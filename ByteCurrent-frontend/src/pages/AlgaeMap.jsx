// src/components/AlgaeMap.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

Chart.register(...registerables);

// Real lake data with API endpoints
const LAKE_DATA = {
  'Lake Tahoe': {
    position: [39.0968, -120.0324],
    apiEndpoint: '/api/tahoe',
    historicalData: []
  },
  'Lake Erie': {
    position: [41.681, -81.7356],
    apiEndpoint: '/api/erie',
    historicalData: []
  },
  'Lake Okeechobee': {
    position: [26.9342, -80.8292],
    apiEndpoint: '/api/okeechobee',
    historicalData: []
  }
};

const AlgaeMap = () => {
  const [locations, setLocations] = useState(LAKE_DATA);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [algaeImage, setAlgaeImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real data for a location
  const fetchLakeData = async (lakeName) => {
    setIsLoading(true);
    try {
      // In a real app, this would call your backend API
      // const response = await fetch(locations[lakeName].apiEndpoint);
      // const data = await response.json();
      
      // Mock API response
      const mockResponse = {
        currentLevel: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)],
        coverage: `${(Math.random() * 100).toFixed(2)}%`,
        historical: Array(30).fill().map((_, i) => ({
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          level: Math.floor(Math.random() * 100),
          status: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
        }))
      };
      
      setLocations(prev => ({
        ...prev,
        [lakeName]: {
          ...prev[lakeName],
          currentLevel: mockResponse.currentLevel,
          coverage: mockResponse.coverage,
          levels: mockResponse.historical
        }
      }));
      
      return mockResponse;
    } catch (error) {
      console.error('Error fetching lake data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (lakeName) => {
    const locationData = locations[lakeName];
    setSelectedLocation({ name: lakeName, ...locationData });
    
    // Fetch data if not already loaded
    if (locationData.levels.length === 0) {
      fetchLakeData(lakeName);
    }
  };

  // Process image through algae detection API
  const detectAlgaeInImage = async (imageUrl) => {
    setIsLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Fetch the satellite image for the selected location
      // 2. Send it to your Flask backend for processing
      
      // Mock implementation
      const mockAlgaeImage = `data:image/png;base64,...`; // This would be the real base64 from API
      setAlgaeImage(mockAlgaeImage);
      
      // For demo purposes, we'll use a placeholder
      setTimeout(() => {
        setAlgaeImage('https://via.placeholder.com/500?text=Algae+Detection+Result');
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error detecting algae:', error);
      setIsLoading(false);
    }
  };

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!selectedLocation) return [];
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return selectedLocation.levels.slice(-days);
  };

  // Get color based on algae level
  const getColor = (level) => {
    if (level === 'High') return 'red';
    if (level === 'Moderate') return 'orange';
    return 'green';
  };

  // Chart data configuration
  const chartData = {
    labels: getFilteredData().map(item => item.date),
    datasets: [
      {
        label: 'Algae Concentration',
        data: getFilteredData().map(item => item.level),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  return (
    <div className="algae-map-container">
      <div className="map-controls">
        <h2>Algae Bloom Monitoring</h2>
        <div className="time-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            disabled={isPlaying || isLoading}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`play-button ${isPlaying ? 'active' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play Timelapse'}
          </button>
          
          {isPlaying && (
            <span className="current-date">
              {currentDate.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="map-content">
        <div className="map-view">
          <MapContainer 
            center={[37.8, -96]} 
            zoom={4} 
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {Object.entries(locations).map(([name, data]) => (
              <CircleMarker
                key={name}
                center={data.position}
                radius={10}
                fillColor={getColor(data.currentLevel || 'Low')}
                color="#333"
                weight={1}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => handleLocationSelect(name),
                }}
              >
                <Popup>
                  <div>
                    <h3>{name}</h3>
                    {data.currentLevel ? (
                      <>
                        <p>Status: <strong>{data.currentLevel}</strong></p>
                        <p>Coverage: <strong>{data.coverage || 'Calculating...'}</strong></p>
                      </>
                    ) : (
                      <p>Loading data...</p>
                    )}
                    <button onClick={() => handleLocationSelect(name)}>
                      View Details
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {selectedLocation && (
          <div className="location-details">
            <h3>{selectedLocation.name}</h3>
            <p>Current Status: <span className={`status-${selectedLocation.currentLevel?.toLowerCase() || 'low'}`}>
              {selectedLocation.currentLevel || 'Loading...'}
            </span></p>
            {selectedLocation.coverage && (
              <p>Algae Coverage: <strong>{selectedLocation.coverage}</strong></p>
            )}
            
            <div className="chart-container">
              {selectedLocation.levels?.length > 0 ? (
                <Line data={chartData} />
              ) : (
                <p>Loading historical data...</p>
              )}
            </div>
            
            <div className="algae-detection-section">
              <h4>Latest Algae Detection</h4>
              {algaeImage ? (
                <img 
                  src={algaeImage} 
                  alt="Algae detection result" 
                  style={{ width: '100%', border: '1px solid #ddd' }}
                />
              ) : (
                <button 
                  onClick={() => detectAlgaeInImage(selectedLocation.name)}
                  disabled={isLoading}
                  className="detect-button"
                >
                  {isLoading ? 'Processing...' : 'Run Algae Detection'}
                </button>
              )}
            </div>
            
            <div className="status-info">
              <h4>Status Information:</h4>
              <ul>
                <li><span className="status-low">Low</span>: &lt; 10% coverage</li>
                <li><span className="status-moderate">Moderate</span>: 10-30% coverage</li>
                <li><span className="status-high">High</span>: &gt; 30% coverage</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgaeMap;