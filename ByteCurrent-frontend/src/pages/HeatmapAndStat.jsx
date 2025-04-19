import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import '../../public/styles/heat-map.css';
import 'leaflet.heat';

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

// Custom Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const heatLayerRef = useRef();

  useEffect(() => {
    // Dynamically import leaflet.heat
    import('leaflet.heat').then((module) => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      
      heatLayerRef.current = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.5,
        gradient: {
          0.2: 'blue',
          0.4: 'cyan',
          0.6: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(map);
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
};

// Helper function to generate heatmap points
function generateHeatPoints(center, intensity) {
  const points = [];
  const [lat, lng] = center;
  const count = intensity === 'High' ? 100 : intensity === 'Moderate' ? 60 : 30;
  const spread = intensity === 'High' ? 0.3 : intensity === 'Moderate' ? 0.2 : 0.1;
  
  for (let i = 0; i < count; i++) {
    points.push([
      lat + (Math.random() * spread * 2 - spread),
      lng + (Math.random() * spread * 2 - spread),
      intensity === 'High' ? 0.8 : intensity === 'Moderate' ? 0.5 : 0.2
    ]);
  }
  
  return points;
}

// Real lake data with heatmap points
const LAKE_DATA = {
  'Lake Tahoe': {
    position: [39.0968, -120.0324],
    apiEndpoint: '/api/tahoe',
    historicalData: [],
    heatPoints: generateHeatPoints([39.0968, -120.0324], 'Moderate'),
    levels: [],  // Add this line
    currentLevel: 'Low',  // Default value
    coverage: '9.02%'  // Default value
  },
  'Lake Erie': {
    position: [41.681, -81.7356],
    apiEndpoint: '/api/erie',
    historicalData: [],
    heatPoints: generateHeatPoints([41.681, -81.7356], 'High'),
    levels: [],  // Add this line
    currentLevel: 'Moderate',  // Default value
    coverage: '17.46%'  // Default value
  },
  'Lake Okeechobee': {
    position: [26.9342, -80.8292],
    apiEndpoint: '/api/okeechobee',
    historicalData: [],
    heatPoints: generateHeatPoints([26.9342, -80.8292], 'Low'),
    levels: [],  // Add this line
    currentLevel: 'High',  // Default value
    coverage: '44.97%'  // Default value
  },
  'Lake Baikal': {
    position: [53.5000, 108.2000],
    apiEndpoint: '/api/baikal',
    historicalData: [],
    heatPoints: generateHeatPoints([53.5000, 108.2000], 'High'),
    levels: [],
    currentLevel: 'High',
    coverage: '31.25%'
  },
  'Lake Victoria': {
    position: [-0.7500, 33.4500],
    apiEndpoint: '/api/victoria',
    historicalData: [],
    heatPoints: generateHeatPoints([-0.7500, 33.4500], 'Moderate'),
    levels: [],
    currentLevel: 'Moderate',
    coverage: '22.83%'
  },
  'Lake Geneva': {
    position: [46.4500, 6.5300],
    apiEndpoint: '/api/geneva',
    historicalData: [],
    heatPoints: generateHeatPoints([46.4500, 6.5300], 'Low'),
    levels: [],
    currentLevel: 'Low',
    coverage: '12.76%'
  }
};

const HeatmapAndStat = () => {
  const [locations, setLocations] = useState(LAKE_DATA);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [algaeImage, setAlgaeImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allHeatPoints, setAllHeatPoints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const mapRef = useRef(null);

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Filter lake names based on search term
    const filteredLakes = Object.keys(locations).filter(lake => 
      lake.toLowerCase().includes(value.toLowerCase())
    );
    
    setSearchResults(filteredLakes);
  };

  // Select lake from search results
  const selectLakeFromSearch = (lakeName) => {
    handleLocationSelect(lakeName);
    setSearchTerm('');
    setSearchResults([]);
  };
  

  // Combine all heat points for the heatmap layer
  useEffect(() => {
    const points = [];
    Object.values(locations).forEach(location => {
      points.push(...location.heatPoints);
    });
    setAllHeatPoints(points);
  }, [locations]);

  // Fetch real data for a location
  const fetchLakeData = async (lakeName) => {
    setIsLoading(true);
    try {
      // Use the existing coverage from LAKE_DATA instead of randomizing
      const currentCoverage = locations[lakeName].coverage;
      const currentLevel = locations[lakeName].currentLevel;
      
      const mockResponse = {
        currentLevel: currentLevel,
        coverage: currentCoverage,
        historical: Array(30).fill().map((_, i) => ({
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          level: parseFloat(currentCoverage), // Use the coverage value for consistency
          status: currentLevel
        }))
      };
      
      setLocations(prev => ({
        ...prev,
        [lakeName]: {
          ...prev[lakeName],
          currentLevel: mockResponse.currentLevel,
          coverage: mockResponse.coverage,
          levels: mockResponse.historical,
          heatPoints: generateHeatPoints(prev[lakeName].position, mockResponse.currentLevel)
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
  // const handleLocationSelect = (lakeName) => {
  //   const locationData = locations[lakeName];
  //   setSelectedLocation({ name: lakeName, ...locationData });
    
  //   if (locationData.levels.length === 0) {
  //     fetchLakeData(lakeName);
  //   }
  // };
  const handleLocationSelect = (lakeName) => {
    const locationData = locations[lakeName];
    setSelectedLocation({ name: lakeName, ...locationData });
  
    if (mapRef.current && locationData) {
      mapRef.current.setView(locationData.position, 7);
    }
  
    if (locationData.levels.length === 0) {
      fetchLakeData(lakeName);
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
  
  // Map reference handler
  const MapReference = () => {
    const map = useMap();
    mapRef.current = map;
    return null;
  };

  return (
    <div className="algae-map-container">
      <div className="map-controls">
        <h2>Algae Bloom Monitoring (Heatmap)</h2>
        
        {/* Search Bar Component */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for a lake..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map(lake => (
                <li 
                  key={lake} 
                  onClick={() => selectLakeFromSearch(lake)}
                  className="search-result-item"
                >
                  {lake}
                </li>
              ))}
            </ul>
          )}
        </div>
        
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
            <MapReference />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <HeatmapLayer points={allHeatPoints} />
            {Object.entries(locations).map(([name, data]) => (
  <React.Fragment key={name}>
    {data.heatPoints.slice(0, 1).map((point, index) => (
      <Popup
        key={`${name}-${index}`}
        position={[point[0], point[1]]}
        eventHandlers={{
          click: () => handleLocationSelect(name),
        }}
      >
        <div>
          <h3>{name}</h3>
          <p>Status: <strong>{data.currentLevel}</strong></p>
          <p>Coverage: <strong>{data.coverage || 'N/A'}</strong></p>
          <button onClick={() => handleLocationSelect(name)}>View Details</button>
        </div>
      </Popup>
    ))}
  </React.Fragment>
))}

            
            {/* Transparent click targets for interaction */}
            {Object.entries(locations).map(([name, data]) => (
              <Popup
                key={name}
                position={data.position}
                eventHandlers={{
                  click: () => handleLocationSelect(name),
                }}
              >
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
            
            <div className="status-info">
              <h4>Heatmap Legend:</h4>
              <div className="heatmap-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'blue' }}></span>
                  <span>Low Concentration</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'cyan' }}></span>
                  <span>Moderate-Low</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'lime' }}></span>
                  <span>Moderate</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'yellow' }}></span>
                  <span>Moderate-High</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'red' }}></span>
                  <span>High Concentration</span>
                </div>
              </div>
              
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

export default HeatmapAndStat;