# Air Quality AI Monitoring Platform

An advanced environmental monitoring and prediction platform powered by Google's Gemini AI. This project predicts the Air Quality Index (AQI) based on various pollution parameters and provides detailed health recommendations.

## Features

- **AI-Powered Prediction**: Uses Gemini AI to analyze pollution parameters (PM2.5, PM10, NO2, CO, SO2) and predict AQI.
- **Real-time Dashboard**: Visualizes pollutant levels and health impacts using interactive charts.
- **Health Recommendations**: Provides actionable advice based on the predicted AQI category.
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion for a premium user experience.

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI Model**: Google Gemini 3 Flash
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js installed
- Google Gemini API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Running the Project

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `src/App.tsx`: Main application component and UI logic.
- `src/services/gemini.ts`: AI prediction service using Google GenAI SDK.
- `server.ts`: Express server with Vite middleware for full-stack capabilities.
- `src/lib/utils.ts`: Utility functions for styling.

## Why Gemini AI?

While traditional models like Random Forest are effective, using Gemini AI allows for:
1. **Contextual Analysis**: Better understanding of the relationship between different pollutants.
2. **Detailed Recommendations**: Generating human-like health advice tailored to specific pollution levels.
- **Scalability**: No need to manage and retrain local model files (`.pkl`).

---
*Developed as a BTech Final Year Project.*
