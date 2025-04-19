import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Link } from 'react-router';
import '../../public/Buttons.css'; 
import bgVideo from '/ByteCurrent-frontend/src/pages/unwrap_v43_2023-10-26_1332.mp4'; 
function Homepage() {
  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* 🎥 Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🌟 Foreground Content */}
      <Container sx={{ height: '100vh', p: 2, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(0,0,0,0.7)',
          }}
        >
          {/* 🧠 Intro */}
          <Box sx={{ maxWidth: '800px', px: 2 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold' }}>Algaerithm</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              At Algaerithm, we harness the power of OpenCosmos' satellite data to detect algal blooms and track ocean health in real time.
              By combining technology, environmental insights, and our team's skills, we turn complex data into clear, actionable results—
              protecting our planet’s precious waters.
            </Typography>
          </Box>

          {/* 🚀 Navigation Buttons */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 3,
            mt: 4,
          }}>
            <Link to="/algal-bloom-detec">
              <button className="button">
                <span className="sparkle">
                  <svg className="icon" viewBox="0 0 24 24" fill="none">
                    <path className="path" d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                  </svg>
                </span>
                <span className="text_button">Algal Bloom Detection</span>
                <span className="dots_border"></span>
              </button>
            </Link>

            <Link to="/heatmaps-and-stats">
              <button className="button">
                <span className="sparkle">
                  <svg className="icon" viewBox="0 0 24 24" fill="none">
                    <path className="path" d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                  </svg>
                </span>
                <span className="text_button">Heatmaps & Statistics</span>
                <span className="dots_border"></span>
              </button>
            </Link>

            <Link to="/temp-analysis">
              <button className="button">
                <span className="sparkle">
                  <svg className="icon" viewBox="0 0 24 24" fill="none">
                    <path className="path" d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                  </svg>
                </span>
                <span className="text_button">Surface Temp Analysis</span>
                <span className="dots_border"></span>
              </button>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Homepage;
