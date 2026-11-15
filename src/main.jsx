import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { StageOverlay } from './components/stage/overlay.js'
import { DevUi } from './dev/DevUi.jsx'
import { GameProvider } from './engine/useGame.jsx'
import { F0 } from './screens/F0.jsx'
import { F1a } from './screens/F1a.jsx'
import { F1b } from './screens/F1b.jsx'
import { F1Done } from './screens/F1Done.jsx'
import { GameTools } from './screens/GameTools.jsx'
import { Intro } from './screens/Intro.jsx'
import { Start } from './screens/Start.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/dev/ui" element={<DevUi />} />
        <Route element={<GameProvider><StageOverlay.Provider value={<GameTools />}><Outlet /></StageOverlay.Provider></GameProvider>}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<Start />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/f0" element={<F0 />} />
          <Route path="/f1a" element={<F1a />} />
          <Route path="/f1b" element={<F1b />} />
          <Route path="/f1done" element={<F1Done />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
