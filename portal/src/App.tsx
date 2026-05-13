import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Server, ChevronDown, ChevronRight } from 'lucide-react';
import './App.css';

// Mock data for the sidebar navigation
const navigationData = [
  {
    id: 'kpanda',
    title: 'Kpanda',
    icon: <LayoutGrid size={18} />,
    children: [
      {
        id: 'gateway-api',
        title: 'Gateway API',
        icon: <Server size={18} />,
        path: '/gateway-api',
        iframeUrl: import.meta.env.DEV ? 'http://localhost:5174/' : '/prototypes/gatewayapi/'
      }
    ]
  }
];

function Sidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ kpanda: true });
  const navigate = useNavigate();
  const location = useLocation();

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder"></div>
        <span className="logo-text">DaoCloud Prototype</span>
      </div>
      <div className="sidebar-nav">
        {navigationData.map(product => (
          <div key={product.id} className="nav-group">
            <div 
              className="nav-group-header" 
              onClick={() => toggleExpand(product.id)}
            >
              <div className="nav-group-title">
                {expanded[product.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {product.icon}
                <span>{product.title}</span>
              </div>
            </div>
            
            {expanded[product.id] && (
              <div className="nav-group-children">
                {product.children.map(feature => {
                  const isActive = location.pathname === feature.path;
                  return (
                    <div 
                      key={feature.id} 
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(feature.path)}
                    >
                      <span className="nav-item-icon">{feature.icon}</span>
                      <span className="nav-item-text">{feature.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IframeViewer({ url }: { url: string }) {
  if (!url) {
    return (
      <div className="empty-state">
        <h2>请在左侧选择一个功能模块</h2>
      </div>
    );
  }

  return (
    <div className="iframe-container">
      <iframe src={url} title="Prototype Viewer" className="content-iframe" />
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  
  // Find matching URL for iframe
  let currentIframeUrl = '';
  navigationData.forEach(prod => {
    prod.children.forEach(feat => {
      if (feat.path === location.pathname) {
        currentIframeUrl = feat.iframeUrl;
      }
    });
  });

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="top-header">
          <div className="breadcrumb-simple">
             {/* Simple dynamic breadcrumb based on current path */}
             {location.pathname === '/gateway-api' ? 'Kpanda / Gateway API' : '原型门户'}
          </div>
          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<IframeViewer url="" />} />
          <Route path="/gateway-api" element={<IframeViewer url={currentIframeUrl} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
