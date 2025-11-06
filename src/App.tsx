import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Play from './routes/Play';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:id" element={<Play />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
