import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

# Create directory if not exists
if not os.path.exists('model'):
    os.makedirs('model')

# Load dataset
df = pd.read_csv('dataset/air_quality.csv')

# Features and Target
X = df[['PM2.5', 'PM10', 'NO2', 'CO', 'SO2']]
y = df['AQI']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
with open('model/model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model trained and saved successfully as model.pkl")
