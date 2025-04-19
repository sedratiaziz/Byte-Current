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
    historicalData: [],
    levels: [],  // Add this line
    currentLevel: 'Low',  // Default value
    coverage: '0%'  // Default value
  },
  'Lake Erie': {
    position: [41.681, -81.7356],
    apiEndpoint: '/api/erie',
    historicalData: [],
    levels: [],  // Add this line
    currentLevel: 'Moderate',  // Default value
    coverage: '0%'  // Default value
  },
  'Lake Okeechobee': {
    position: [26.9342, -80.8292],
    apiEndpoint: '/api/okeechobee',
    historicalData: [],
    levels: [],  // Add this line
    currentLevel: 'High',  // Default value
    coverage: '0%'  // Default value
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
      // Mock API response with proper structure
      const mockResponse = {
        currentLevel: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)],
        coverage: `${(Math.random() * 100).toFixed(2)}%`,
        levels: Array(30).fill().map((_, i) => ({  // Ensure 'levels' exists
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          level: Math.floor(Math.random() * 100),
          status: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
        }))
      };
  
      setLocations(prev => ({
        ...prev,
        [lakeName]: {
          ...prev[lakeName],
          ...mockResponse  // Spread the entire response
        }
      }));
      
      return mockResponse;
    } catch (error) {
      console.error('Error fetching lake data:', error);
      return { levels: [] };  // Return empty levels on error
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
  // Process image through algae detection API
const detectAlgaeInImage = async (lakeName) => {
  setIsLoading(true);
  setAlgaeImage(null); // Reset previous image
  
  try {
    // In a real app, you would fetch the satellite image for the selected location
    // For demo purposes, we'll use a sample image
    const response = await fetch('sample-lake-image.jpg');
    const imageBlob = await response.blob();
    
    // Create FormData to send to backend
    const formData = new FormData();
    formData.append('image', imageBlob, `${lakeName}.jpg`);
    
    // Call your Flask backend
    const apiResponse = await fetch('http://localhost:5000/api/detect-algae', {
      method: 'POST',
      body: formData,
    });
    
    if (!apiResponse.ok) {
      throw new Error(`Server responded with ${apiResponse.status}`);
    }
    
    const result = await apiResponse.json();
    
    // Update state with results
    if (result.algae_mask) {
      setAlgaeImage(`data:image/png;base64,${result.algae_mask}`);
    } else {
      throw new Error('No algae mask returned from server');
    }
    
    // Update location data with new coverage info
    setLocations(prev => ({
      ...prev,
      [lakeName]: {
        ...prev[lakeName],
        currentLevel: result.status || 'Unknown',
        coverage: result.coverage || '0%',
      }
    }));
    
    // Update selected location if it's the current one
    if (selectedLocation && selectedLocation.name === lakeName) {
      setSelectedLocation(prev => ({
        ...prev,
        currentLevel: result.status || 'Unknown',
        coverage: result.coverage || '0%',
      }));
    }
    
  } catch (error) {
    console.error('Error detecting algae:', error);
    // Fallback to a placeholder image
    setAlgaeImage('https://via.placeholder.com/500x300?text=Error+processing+image');
  } finally {
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





  // Add this function to your component

  return (
    <div className="algae-map-container">
      <div className="map-controls">
        <h2>Algae Bloom Monitoring</h2>
        {/* <div className="time-controls">
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
        </div> */}
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
            
            {/* Removed since ML is not working currently, also due to time */}
            {/* <div className="algae-detection-section">
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
            </div> */}
            
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