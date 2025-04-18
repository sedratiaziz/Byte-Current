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

import '../../public/styles/algae-map.css'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

Chart.register(...registerables);

const AlgaeMap = () => {
  // Sample monitoring locations with mock data
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: 'Lake Tahoe',
      position: [39.0968, -120.0324],
      levels: generateMockLevels(),
      currentLevel: 'Moderate'
    },
    {
      id: 2,
      name: 'Lake Erie',
      position: [41.681, -81.7356],
      levels: generateMockLevels(),
      currentLevel: 'High'
    },
    {
      id: 3,
      name: 'Lake Okeechobee',
      position: [26.9342, -80.8292],
      levels: generateMockLevels(),
      currentLevel: 'Low'
    },
  ]);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate mock data for 30 days
  function generateMockLevels() {
    const levels = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      levels.push({
        date: date.toISOString().split('T')[0],
        level: Math.floor(Math.random() * 100),
        status: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
      });
    }
    
    return levels;
  }

  // Handle timelapse animation
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + 1);
          return newDate;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying]);

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
            disabled={isPlaying}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`play-button ${isPlaying ? 'active' : ''}`}
          >
            {isPlaying ? 'Pause' : 'Play Timelapse'}
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
            
            {locations.map(location => (
              <CircleMarker
                key={location.id}
                center={location.position}
                radius={10}
                fillColor={getColor(location.currentLevel)}
                color="#333"
                weight={1}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => setSelectedLocation(location),
                }}
              >
                <Popup>
                  <div>
                    <h3>{location.name}</h3>
                    <p>Status: <strong>{location.currentLevel}</strong></p>
                    <button onClick={() => setSelectedLocation(location)}>
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
            <p>Current Status: <span className={`status-${selectedLocation.currentLevel.toLowerCase()}`}>
              {selectedLocation.currentLevel}
            </span></p>
            
            <div className="chart-container">
              <Line data={chartData} />
            </div>
            
            <div className="status-info">
              <h4>Status Information:</h4>
              <ul>
                <li><span className="status-low">Low</span>: Safe for all recreational activities</li>
                <li><span className="status-moderate">Moderate</span>: Caution advised for sensitive individuals</li>
                <li><span className="status-high">High</span>: Avoid water contact, potential health risk</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgaeMap;