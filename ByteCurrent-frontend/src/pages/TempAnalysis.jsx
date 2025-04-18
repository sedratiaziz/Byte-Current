import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Slider, Switch, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import '../../public/styles/temp-analysis.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


// Register Chart.js components
ChartJS.register(...registerables);

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  shadowUrl: markerShadow,
});


// Sample data for demonstration
const SAMPLE_DATA = {
  'Lake Tahoe': {
    chlorophyll: generateTimeSeriesData(30, 0.5, 10),
    temperature: generateTimeSeriesData(30, 15, 30),
    coordinates: [39.0968, -120.0324]
  },
  'Lake Erie': {
    chlorophyll: generateTimeSeriesData(30, 1, 15),
    temperature: generateTimeSeriesData(30, 10, 25),
    coordinates: [41.681, -81.7356]
  },
  'Lake Okeechobee': {
    chlorophyll: generateTimeSeriesData(30, 2, 20),
    temperature: generateTimeSeriesData(30, 20, 35),
    coordinates: [26.9342, -80.8292]
  }
};

// Helper function to generate time series data
function generateTimeSeriesData(days, min, max) {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - i - 1));
    
    data.push({
      date: date,
      value: Math.random() * (max - min) + min
    });
  }
  
  return data;
}

// Custom map layer for visualization
const AnalysisLayer = ({ selectedLake, showChlorophyll, showTemperature }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!selectedLake) return;

    // In a real app, this would fetch actual satellite imagery
    // Here we simulate with colored overlays
    const bounds = map.getBounds();
    const overlay = L.rectangle(bounds, {
      color: getVisualizationColor(selectedLake, showChlorophyll, showTemperature),
      fillOpacity: 0.5
    }).addTo(map);

    layerRef.current = overlay;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, selectedLake, showChlorophyll, showTemperature]);

  return null;
};

function getVisualizationColor(lake, showChlorophyll, showTemperature) {
  if (showChlorophyll && showTemperature) {
    // Combined visualization (purple-ish)
    return '#8a2be2';
  } else if (showChlorophyll) {
    // Chlorophyll visualization (green)
    return '#32cd32';
  } else {
    // Temperature visualization (red)
    return '#ff4500';
  }
}

const TempAnalysis = () => {
  const [selectedLake, setSelectedLake] = useState('Lake Tahoe');
  const [dateRange, setDateRange] = useState([0, 29]);
  const [showChlorophyll, setShowChlorophyll] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [chartType, setChartType] = useState('line');
  const mapRef = useRef(null);

  const lakeData = SAMPLE_DATA[selectedLake];
  const filteredChlorophyll = lakeData.chlorophyll.slice(dateRange[0], dateRange[1] + 1);
  const filteredTemperature = lakeData.temperature.slice(dateRange[0], dateRange[1] + 1);

  // Chart data configuration
  const chartData = {
    labels: filteredChlorophyll.map(item => item.date),
    datasets: [
      {
        type: chartType,
        label: 'Chlorophyll-a (µg/L)',
        data: filteredChlorophyll.map(item => item.value),
        borderColor: '#32cd32',
        backgroundColor: 'rgba(50, 205, 50, 0.1)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        type: chartType,
        label: 'Surface Temp (°C)',
        data: filteredTemperature.map(item => item.value),
        borderColor: '#ff4500',
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        }
      },
      y: {
        type: 'linear',
        display: showChlorophyll,
        position: 'left',
        title: {
          display: true,
          text: 'Chlorophyll-a (µg/L)'
        }
      },
      y1: {
        type: 'linear',
        display: showTemperature,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°C)'
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    }
  };

  const handleLakeChange = (value) => {
    setSelectedLake(value);
    if (mapRef.current) {
      mapRef.current.flyTo(SAMPLE_DATA[value].coordinates, 10);
    }
  };

  return (
    <div className="analysis-container">
      <div className="control-panel">
        <h2>Chlorophyll & Surface Temperature Analysis</h2>
        
        <div className="control-group">
          <div className="control-item">
            <label>Select Lake:</label>
            <Select
              value={selectedLake}
              onChange={handleLakeChange}
              options={[
                { value: 'Lake Tahoe', label: 'Lake Tahoe' },
                { value: 'Lake Erie', label: 'Lake Erie' },
                { value: 'Lake Okeechobee', label: 'Lake Okeechobee' }
              ]}
            />
          </div>

          <div className="control-item">
            <label>Date Range:</label>
            <Slider
              range
              min={0}
              max={29}
              value={dateRange}
              onChange={setDateRange}
              tooltip={{
                formatter: (value) => {
                  const date = lakeData.chlorophyll[value].date;
                  return date.toLocaleDateString();
                }
              }}
            />
          </div>

          <div className="control-item">
            <label>Chart Type:</label>
            <Select
              value={chartType}
              onChange={setChartType}
              options={[
                { value: 'line', label: 'Line Chart' },
                { value: 'bar', label: 'Bar Chart' }
              ]}
            />
          </div>

          <div className="toggle-group">
            <Switch
              checked={showChlorophyll}
              onChange={(checked) => setShowChlorophyll(checked)}
              checkedChildren="Chlorophyll"
              unCheckedChildren="Chlorophyll"
            />
            <Switch
              checked={showTemperature}
              onChange={(checked) => setShowTemperature(checked)}
              checkedChildren="Temperature"
              unCheckedChildren="Temperature"
            />
          </div>
        </div>
      </div>

      <div className="visualization-area">
        <div className="map-container">
          <MapContainer
            center={lakeData.coordinates}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => { mapRef.current = map; }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <AnalysisLayer
              selectedLake={selectedLake}
              showChlorophyll={showChlorophyll}
              showTemperature={showTemperature}
            />
          </MapContainer>
        </div>

        <div className="chart-container">
          <Chart
            type={chartType}
            data={chartData}
            options={chartOptions}
          />
        </div>
      </div>

      <div className="info-panel">
      <h3><InfoCircleOutlined /> Analysis Information</h3>
      <div className="info-content">
        <h4>Key Indicators</h4>
        <p>
          <strong>Chlorophyll-a</strong> measures algal concentration in water. 
          <strong>Surface Temperature</strong> affects algal growth rates.
        </p>
        
        <h4>Interpretation Guide</h4>
        <ul>
          <li><strong>Chlorophyll-a &gt; 10µg/L</strong> = Potential bloom</li>
          <li><strong>Temp 15-30°C</strong> = Optimal growth range</li>
          <li><strong>Spikes in both</strong> = High bloom risk</li>
        </ul>

        <h4>Seasonal Patterns</h4>
        <p>
          Expect higher values in warmer months (late spring to early fall).
        </p>

        <h4>Data Sources</h4>
        <p>
          Satellite-derived measurements (Sentinel-2/3) with field validation.
        </p>

        {showChlorophyll && showTemperature && (
          <div className="correlation-note">
            <h4>Current Correlation</h4>
            <p>
              Warming waters combined with nutrient availability may accelerate 
              algal growth. Monitor for rapid chlorophyll increases.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default TempAnalysis;