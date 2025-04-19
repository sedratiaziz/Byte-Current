import { Box, Container, Typography } from '@mui/material'
import React from 'react'
import { Link } from 'react-router'
// import bgVideo from '/ByteCurrent-forntend/src/pages/unwrap_v43_2023-10-26_1332.mp4' // ✅ Update the path!
import bgVideo from '../unwrap_v43_2023-10-26_1332.mp4'

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
            color: '#fff', // Makes text visible over video
            textShadow: '0 0 10px rgba(0,0,0,0.7)', // Adds contrast
          }}
        >
          <Box
            sx={{
              height: '50%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              p: 2,
            }}
          >
            <Typography variant='h1'>Algaerithm</Typography>
            <Typography variant='body1' sx={{ paddingRight: 15, paddingLeft: 15 }}>
              At Algaerithm, we harness the power of OpenCosmos' satellite data to detect algal blooms and track ocean health in real time. 
              By combining the tech, environmental insights, and our teams skills, we turn complex data into clear, actionable results, protecting our planet’s precious waters.
            </Typography>
          </Box>

          <Box
            sx={{
              height: '50%',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Link to={'/algal-bloom-detec'}>
              <Box sx={{ p: 2, border: '1px solid white', borderRadius: 2 }}><Typography>Algal Bloom Detection</Typography></Box>
            </Link>
            <Link to={'/heatmaps-and-stats'}>
              <Box sx={{ p: 2, border: '1px solid white', borderRadius: 2 }}><Typography>Heatmaps and Statistic</Typography></Box>
            </Link>
            <Link to={'/temp-analysis'}>
              <Box sx={{ p: 2, border: '1px solid white', borderRadius: 2 }}><Typography>Surface Temperature Analysis</Typography></Box>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Homepage
