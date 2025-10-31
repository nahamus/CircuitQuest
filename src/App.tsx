import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import './styles/globals.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:id" element={<Play />} />
      </Routes>
    </HashRouter>
  );
}

export default App
