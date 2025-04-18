


# Server Code (to display on the frontend)


from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import io
import earthpy.spatial as es
import earthpy.plot as ep
import matplotlib.pyplot as plt
import base64

app = Flask(__name__)


@app.route('/test')
def test():
    return 'test1234'



@app.route('/detect-algae', methods=['POST'])
def detect_algae():
    # Get image from request
    file = request.files['image']
    img = Image.open(io.BytesIO(file.read()))
    
    # Convert to numpy array (simplified - in reality you'd process Sentinel-2 bands)
    img_array = np.array(img)
    
    # Extract bands (mock - real implementation would use actual band separation)
    blue = img_array[:,:,2].astype(float)  # Assuming RGB order
    green = img_array[:,:,1].astype(float)
    nir = img_array[:,:,0].astype(float) * 0.8  # Mock NIR
    
    # Calculate NDWI (water index)
    ndwi = es.normalized_diff(green, nir)
    
    # Mask to water only
    water_mask = ndwi > 0
    blue_water = np.where(water_mask, blue, np.nan)
    green_water = np.where(water_mask, green, np.nan)
    
    # Algae detection
    algae_mask = (blue_water > 100) & (green_water > 100)  # Simplified threshold
    
    # Create visualization
    plt.figure(figsize=(10, 10))
    plt.imshow(algae_mask, cmap='Blues')
    plt.axis('off')
    
    # Save to bytes
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    buf.seek(0)
    plt.close()
    
    return jsonify({
        'algae_mask': base64.b64encode(buf.read()).decode('utf-8'),
        'coverage': f"{np.nansum(algae_mask) / np.sum(water_mask) * 100:.2f}%"
    })

if __name__ == '__main__':
    app.run(port=5000)



#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#



# *** Code For Algae-Detection, Heatmaps, NDWI, NDVI ***

import os
from glob import glob
import numpy as np
import matplotlib.pyplot as plt
import rasterio as rio
import rioxarray as rxr
import geopandas as gpd
from shapely.geometry import Polygon
from pyproj import Proj
from matplotlib.colors import ListedColormap
import earthpy.spatial as es
import earthpy.plot as ep

# Paths to image directories
image_1 = "/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Image_1/"
image_2 = "/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Image_2/"

# Search for Sentinel-2 bands (10m resolution)
patterns = [
    image_1 + "S2C_MSIL2A_20250319T070641_N0511_R106_T39RVJ_20250319T130709.SAFE/GRANULE/L2A_T39RVJ_A002793_20250319T071542/IMG_DATA/R10m/T39RVJ_20250319T070641_B*.jp2",
    image_2 + "S2C_MSIL2A_20250319T070641_N0511_R106_T39RVK_20250319T130709.SAFE/GRANULE/L2A_T39RVK_A002793_20250319T071542/IMG_DATA/R10m/T39RVK_20250319T070641_B*.jp2"
]

S2 = []
for pattern in patterns:
    S2.extend(glob(pattern))

# Plot a single band to check
example = rxr.open_rasterio(S2[0], masked=True).squeeze()
f, ax = plt.subplots()
example.plot.imshow(cmap="Greys_r", ax=ax)
ax.set_title("Plot of One Band as an Example")
plt.show()

# Separate bands
blue_bands = [i for i in S2 if 'B02' in i]
green_bands = [i for i in S2 if 'B03' in i]
red_bands = [i for i in S2 if 'B04' in i]
nir_bands = [i for i in S2 if 'B08' in i]
merged_bands = [blue_bands, green_bands, red_bands, nir_bands]

# Helper for naming
def namestr(obj):
    return [name for name in globals() if globals()[name] is obj][0]

# Merge arrays
def merge_arrays(band_list):
    arrays = [rxr.open_rasterio(b, masked=True).squeeze() for b in band_list]
    return sum(arrays) / len(arrays)

# Create mosaics
os.makedirs("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/", exist_ok=True)
for band in merged_bands:
    mosaic = merge_arrays(band)
    mosaic.rio.to_raster(f"/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/{namestr(band)}.tif")

S2_mosaic = glob("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/*.tif")

# Create polygon
coordinates = [(26.221955995501265, 50.44191853174552), (26.222340224000803, 50.480637436148484),
              (26.2055866865168, 50.48149404907913), (26.198361188733028, 50.44669664743383),
               (26.221955995501265, 50.44191853174552)]
pp = Proj(proj='utm', zone=39, ellps='WGS84', preserve_units=False)

def convert_to_meters(coords):
    lon, lat = coords
    return pp(lat, lon)

converted_coords = [convert_to_meters(coord) for coord in coordinates]
polygon_geom = Polygon(converted_coords)
polygon = gpd.GeoDataFrame(index=[0], crs='EPSG:32639', geometry=[polygon_geom])
polygon.to_file(filename="/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Shapefile/aoi.shp", driver='ESRI Shapefile')

# Clip images
os.makedirs("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/Clip/", exist_ok=True)
for b in S2_mosaic:
    img = rxr.open_rasterio(b, masked=True).squeeze()
    clip = img.rio.clip(polygon.geometry, all_touched=True, drop=True)
    clip.rio.to_raster(f"/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/Clip/{os.path.basename(b)}_clip.tif")

S2_clip = glob("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Mosaic Bands/Clip/*.tif")

# Stack bands
band_st, meta = es.stack(S2_clip, nodata=0)

# RGB plot
fig, ax = plt.subplots(figsize=(12, 12))
ep.plot_rgb(band_st, rgb=(2, 1, 0), ax=ax, stretch=True, str_clip=0.5)
plt.axis('off')
plt.savefig("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/RGB/rgb.png", bbox_inches='tight')
plt.show()

# NDVI (for vegetation health)
ndvi = es.normalized_diff(band_st[3], band_st[2])
ep.plot_bands(ndvi, cmap="RdYlGn", cols=1, title="NDVI", vmin=-1, vmax=1)

# NDVI classification
ndvi_class_bins = [-np.inf, 0, 0.1, 0.25, 0.4, np.inf]
ndvi_class = np.digitize(ndvi, ndvi_class_bins)
ndvi_class = np.ma.masked_where(np.ma.getmask(ndvi), ndvi_class)
nbr_colors = ["gray", "y", "yellowgreen", "g", "darkgreen"]
nbr_cmap = ListedColormap(nbr_colors)
ndvi_class_names = ["No Vegetation", "Bare Area", "Low Vegetation", "Moderate Vegetation", "High Vegetation"]
classes = np.unique(ndvi_class).tolist()[0:5]

fig, ax = plt.subplots(figsize=(12, 12))
im = ax.imshow(ndvi_class, cmap=nbr_cmap)
ep.draw_legend(im_ax=im, classes=classes, titles=ndvi_class_names)
ax.set_title("NDVI Classes", fontsize=14)
ax.set_axis_off()
plt.tight_layout()

# ================================
# 💧 Blue Algae Detection Section
# ================================
# Extract bands
blue = band_st[0]
green = band_st[1]
red = band_st[2]
nir = band_st[3]

# Calculate NDWI (water index)
ndwi = es.normalized_diff(green, nir)

# Mask to water only
water_mask = ndwi > 0
blue_water = np.where(water_mask, blue, np.nan)
green_water = np.where(water_mask, green, np.nan)

# Algae detection based on reflectance
algae_mask = (blue_water > 1000) & (green_water > 1000)

# Plot algae mask
plt.figure(figsize=(10, 10))
plt.imshow(algae_mask, cmap='Blues')
plt.title("Detected Blue Algae Areas")
plt.axis('off')
plt.show()

# Save algae result
# os.makedirs("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Algae/", exist_ok=True)
# plt.imsave("/content/drive/MyDrive/Colab Notebooks/Open Cosmos/Algae/blue_algae_mask.png", algae_mask, cmap='Blues')