import { Box, Container, Typography } from '@mui/material'
import React from 'react'
import { Link } from 'react-router'


function Homepage() {
  return (
    <Container sx={{ height: '100vh', p: 2, border: '1px dashed grey' }}>
        <Box sx={{
            height: '100%', 
             border: '1px dashed grey', 
            display: 'flex', flexDirection: 'column', 
            justifyContent: 'space-evenly',}}>
            
            <Box sx={{
                height: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-evenly',
                p: 2, border: '1px dashed grey'
            }}>
                <Typography variant='h1'>ByteCurrent</Typography>
                <Typography variant='p' sx={{paddingRight: 15, paddingLeft: 15}}>
                At Byte Current, we harness the power of OpenCosmos' satellite data to detect algal blooms and track ocean health in real time. 
                By combining the tech, environmental insights, and our teams skills, we turn complex data into clear, actionable results, protecting our planet’s precious waters.
                </Typography>
            </Box>


            <Box sx={{
                height: '50%',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                p: 2, border: '1px dashed grey',
            }}>
                <Link to={'/algal-bloom-detec'}>
                    <Box sx={{ p: 2, border: '1px dashed grey'}}><Typography>Algal Bloom Detection</Typography></Box>
                </Link>
                <Link to={'/heatmaps-and-stats'}>
                    <Box sx={{ p: 2, border: '1px dashed grey'}}><Typography>Heatmaps and Statistic</Typography></Box>
                </Link>
                <Link to={'/temp-analysis'}>
                    <Box sx={{ p: 2, border: '1px dashed grey'}}><Typography>Surface Temperature Analysis</Typography></Box>
                </Link>
            </Box>

        </Box>
    </Container>
  )
}

export default Homepage