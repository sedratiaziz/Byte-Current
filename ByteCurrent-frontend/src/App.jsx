import { useState } from 'react'
import {Routes ,Route} from 'react-router'

import './App.css'

import Homepage from './pages/Homepage'
import HeatmapAndStat from './pages/HeatmapAndStat'
import TempAnalysis from './pages/TempAnalysis'
import AlgaeMap from './pages/AlgaeMap'


function App() {

  return (
    <>
      <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/algal-bloom-detec" element={<AlgaeMap />} />
          <Route path="/heatmaps-and-stats" element={<HeatmapAndStat />} />
          <Route path="/temp-analysis" element={<TempAnalysis />} />
      </Routes>
    </>
  )
}

export default App
