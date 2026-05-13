import { Routes, Route, NavLink } from 'react-router-dom';
import GatewayClassDetail from './pages/GatewayClassDetail';
import GatewayDetail from './pages/GatewayDetail';
import RouterDetail from './pages/RouterDetail';

function App() {
  return (
    <div className="page-container">
      <nav className="nav-menu">
        <NavLink to="/gateway-class" className={({ isActive }) => isActive ? 'active' : ''}>Gateway Class</NavLink>
        <NavLink to="/gateway" className={({ isActive }) => isActive ? 'active' : ''}>Gateway</NavLink>
        <NavLink to="/router" className={({ isActive }) => isActive ? 'active' : ''}>Router</NavLink>
      </nav>
      
      <Routes>
        <Route path="/" element={<GatewayDetail />} />
        <Route path="/gateway-class" element={<GatewayClassDetail />} />
        <Route path="/gateway" element={<GatewayDetail />} />
        <Route path="/router" element={<RouterDetail />} />
      </Routes>
    </div>
  );
}

export default App;
