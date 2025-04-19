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

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
            nir = img_array[:,:,0].astype(float) * 0.8  # Mock NIR
            
            # Calculate NDWI (water index)
            ndwi = es.normalized_diff(green, nir)
            
            # Mask to water only
            water_mask = ndwi > 0
            blue_water = np.where(water_mask, blue, np.nan)
            green_water = np.where(water_mask, green, np.nan)
            
            # Algae detection
            algae_mask = (blue_water > 100) & (green_water > 100)
            
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