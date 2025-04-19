from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import earthpy.spatial as es
import matplotlib.pyplot as plt
import base64
import os
import tempfile
import joblib  # For loading the ML model
from sklearn.ensemble import RandomForestClassifier  # Example classifier

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load ML model (replace with your actual model path)
try:
    model = joblib.load('./algae-classifier.pkl')
except:
    # Fallback to a simple model if the file doesn't exist
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier()
    # Dummy training just to have a working model
    model.fit([[0,0,0], [255,255,255]], [0,1])

def ml_algae_detection(rgb_water):
    """
    Predict algae presence using ML model
    Args:
        rgb_water: numpy array of shape (H,W,3) with water pixels only (others should be nan)
    Returns:
        Binary mask where 1=algae, 0=water
    """
    # Prepare data for prediction
    valid_pixels = ~np.isnan(rgb_water[:,:,0])
    X = rgb_water[valid_pixels]
    
    if len(X) == 0:
        return np.zeros_like(rgb_water[:,:,0], dtype=bool)
    
    # Predict
    predictions = model.predict(X)
    
    # Reconstruct mask
    algae_mask = np.zeros_like(rgb_water[:,:,0], dtype=bool)
    algae_mask[valid_pixels] = predictions == 1
    
    return algae_mask

# Serve static files (for production)
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# API endpoint for algae detection
@app.route('/api/detect-algae', methods=['POST'])
def detect_algae():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Save to temp file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Process the image
            img = Image.open(temp_path)
            img_array = np.array(img)
            
            # Extract bands (simplified version)
            blue = img_array[:,:,2].astype(float)
            green = img_array[:,:,1].astype(float)
            red = img_array[:,:,0].astype(float)
            nir = red * 0.8  # Mock NIR
            
            # Calculate NDWI (water index)
            ndwi = es.normalized_diff(green, nir)
            
            # Mask to water only
            water_mask = ndwi > 0
            blue_water = np.where(water_mask, blue, np.nan)
            green_water = np.where(water_mask, green, np.nan)
            red_water = np.where(water_mask, red, np.nan)
            
            # Stack RGB water pixels for ML model
            rgb_water = np.stack([red_water, green_water, blue_water], axis=-1)
            
            # ML-based algae detection (replaces threshold approach)
            algae_mask = ml_algae_detection(rgb_water)
            
            # Create visualization
            plt.figure(figsize=(10, 10))
            plt.imshow(algae_mask, cmap='Blues')
            plt.axis('off')
            
            # Save to bytes
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
            buf.seek(0)
            plt.close()
            
            # Calculate coverage percentage
            coverage = np.nansum(algae_mask) / np.sum(water_mask) * 100 if np.sum(water_mask) > 0 else 0
            
            return jsonify({
                'algae_mask': base64.b64encode(buf.read()).decode('utf-8'),
                'coverage': f"{coverage:.2f}%",
                'status': 'High' if coverage > 30 else 'Moderate' if coverage > 10 else 'Low'
            })
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=False)