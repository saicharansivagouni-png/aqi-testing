import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

# Create directory if not exists
if not os.path.exists('model'):
    os.makedirs('model')

# Crop data with air quality thresholds
crops_data = {
    'Rice': {'pm25_max': 75, 'pm10_max': 150, 'no2_max': 60, 'co_max': 3.0, 'so2_max': 60, 'aqi_max': 200},
    'Wheat': {'pm25_max': 85, 'pm10_max': 180, 'no2_max': 70, 'co_max': 3.5, 'so2_max': 70, 'aqi_max': 220},
    'Corn': {'pm25_max': 80, 'pm10_max': 160, 'no2_max': 65, 'co_max': 3.2, 'so2_max': 65, 'aqi_max': 210},
    'Tomato': {'pm25_max': 50, 'pm10_max': 100, 'no2_max': 40, 'co_max': 2.0, 'so2_max': 40, 'aqi_max': 150},
    'Lettuce': {'pm25_max': 35, 'pm10_max': 70, 'no2_max': 30, 'co_max': 1.5, 'so2_max': 30, 'aqi_max': 100},
    'Apple': {'pm25_max': 60, 'pm10_max': 130, 'no2_max': 50, 'co_max': 2.5, 'so2_max': 50, 'aqi_max': 180},
    'Banana': {'pm25_max': 70, 'pm10_max': 150, 'no2_max': 55, 'co_max': 3.0, 'so2_max': 55, 'aqi_max': 200},
    'Mango': {'pm25_max': 65, 'pm10_max': 140, 'no2_max': 52, 'co_max': 2.8, 'so2_max': 52, 'aqi_max': 190},
    'Cotton': {'pm25_max': 90, 'pm10_max': 200, 'no2_max': 75, 'co_max': 4.0, 'so2_max': 75, 'aqi_max': 250},
    'Sugarcane': {'pm25_max': 95, 'pm10_max': 210, 'no2_max': 80, 'co_max': 4.2, 'so2_max': 80, 'aqi_max': 270},
}

# Create synthetic training data
np.random.seed(42)
features = []
labels = []

for pm25 in np.linspace(5, 350, 20):
    for pm10 in np.linspace(10, 500, 20):
        for no2 in np.linspace(5, 200, 10):
            for co in np.linspace(0.2, 12, 8):
                for so2 in np.linspace(2, 100, 8):
                    aqi = min(500, pm25 * 1.5 + pm10 * 0.5 + no2 * 0.3 + co * 20 + so2 * 0.2)
                    features.append([pm25, pm10, no2, co, so2, aqi])
                    
                    # Determine viable crops for this air quality
                    viable_crops = []
                    for crop, thresholds in crops_data.items():
                        if (pm25 <= thresholds['pm25_max'] and 
                            pm10 <= thresholds['pm10_max'] and 
                            no2 <= thresholds['no2_max'] and 
                            co <= thresholds['co_max'] and 
                            so2 <= thresholds['so2_max'] and 
                            aqi <= thresholds['aqi_max']):
                            viable_crops.append(crop)
                    
                    labels.append(';'.join(viable_crops) if viable_crops else 'None')

df = pd.DataFrame(features, columns=['PM2.5', 'PM10', 'NO2', 'CO', 'SO2', 'AQI'])
df['Crops'] = labels

# Save crop reference data
with open('model/crops_thresholds.pkl', 'wb') as f:
    pickle.dump(crops_data, f)

print("Crop model data prepared and saved successfully")
print(f"Total samples: {len(df)}")
print(f"Sample data:\n{df.head()}")
