import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard';
import Team from './pages/Team';
import SubmitPhoto from './pages/SubmitPhoto';
import Admin from './pages/Admin'; // Add import

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/teams/:teamId" element={<Team />} />
          <Route path="/teams/:teamId/submit" element={<SubmitPhoto />} />
          <Route path="/admin" element={<Admin />} /> {/* Replace placeholder */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;