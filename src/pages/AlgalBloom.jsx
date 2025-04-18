import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { Container, Typography, Paper, Box, Slider } from '@mui/material';

import '../../public/styles/algal-bloom.css'

// Sample data - replace with your actual API data
const sampleAlgalData = [
  { id: 1, lat: 40.7128, lng: -74.006, severity: 0.8, size: 2500, date: '2025-04-01' },
  { id: 2, lat: 34.0522, lng: -118.2437, severity: 0.5, size: 1200, date: '2025-04-02' },
  { id: 3, lat: 41.8781, lng: -87.6298, severity: 0.9, size: 3000, date: '2025-04-03' },
  // Add more sample points
];

function AlgalBloom() {
  const [currentDate, setCurrentDate] = useState(new Date('2025-04-03'));
  const [mapData, setMapData] = useState([]);
  
  // Get severity color based on value (0-1)
  const getSeverityColor = (severity) => {
    if (severity > 0.8) return '#ff0000'; // High - red
    if (severity > 0.5) return '#ff9900'; // Medium - orange
    return '#ffff00'; // Low - yellow
  };
  
  // Calculate radius based on bloom size
  const getBloomRadius = (size) => {
    return Math.sqrt(size) / 10; // Simple scaling function
  };
  
  // Filter data based on selected date
  useEffect(() => {
    // In a real app, you'd fetch this data from your API
    // Here we're just filtering the sample data
    const filteredData = sampleAlgalData.filter(
      bloom => new Date(bloom.date) <= currentDate
    );
    setMapData(filteredData);
  }, [currentDate]);
  
  const handleDateChange = (event, newValue) => {
    setCurrentDate(new Date(newValue));
  };
  
  return (
    <Container maxWidth="xl" sx={{ height: '100%', py: 3 }}>
      <Paper elevation={3} sx={{ height: 'calc(100vh - 100px)', overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ height: '90%', position: 'relative' }}>
          <MapContainer 
            center={[39.8283, -98.5795]} // Center of US
            zoom={4} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            
            {mapData.map(bloom => (
              <CircleMarker 
                key={bloom.id}
                center={[bloom.lat, bloom.lng]}
                radius={getBloomRadius(bloom.size)}
                pathOptions={{
                  color: getSeverityColor(bloom.severity),
                  fillColor: getSeverityColor(bloom.severity),
                  fillOpacity: 0.6
                }}
              >
                <Popup>
                  <Typography variant="body2">
                    <strong>Severity:</strong> {(bloom.severity * 100).toFixed(0)}%<br />
                    <strong>Size:</strong> {bloom.size} km²<br />
                    <strong>Date:</strong> {bloom.date}
                  </Typography>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </Box>
        
        <Box sx={{ px: 4, py: 2 }}>
          <Typography gutterBottom>Date: {currentDate.toLocaleDateString()}</Typography>
          <Slider
            min={new Date('2025-04-01').getTime()}
            max={new Date('2025-04-10').getTime()}
            value={currentDate.getTime()}
            onChange={handleDateChange}
            valueLabelFormat={value => new Date(value).toLocaleDateString()}
            valueLabelDisplay="auto"
            step={86400000} // One day in milliseconds
          />
        </Box>
      </Paper>
    </Container>
  );
}

export default AlgalBloom;