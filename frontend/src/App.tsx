import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoadingPage from './pages/LoadingPage';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative z-0">
        {/* Background Mesh */}
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-bgMain">
          <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/loading/:jobId" element={<LoadingPage />} />
          <Route path="/analysis/:jobId" element={<AnalysisPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
