import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Server, ChevronDown, ChevronRight, Globe } from 'lucide-react';
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
        getIframeUrl: (lang: string) =>
          import.meta.env.DEV
            ? `http://localhost:5174/?lang=${lang}`
            : `/prototypes/gatewayapi/?lang=${lang}`
      }
    ]
  }
];

const portalI18n = {
  zh: {
    selectModule: '请在左侧选择一个功能模块',
    breadcrumbHome: '原型门户',
    language: '语言',
    chinese: '中文',
    english: 'English',
  },
  en: {
    selectModule: 'Please select a module from the sidebar',
    breadcrumbHome: 'Prototype Portal',
    language: 'Language',
    chinese: '中文',
    english: 'English',
  },
};

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
        <img src="/daocloud-logo.png" alt="DaoCloud Logo" className="logo-image" />
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

function IframeViewer({ url, lang }: { url: string; lang: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const t = portalI18n[lang as keyof typeof portalI18n] || portalI18n.zh;

  if (!url) {
    return (
      <div className="empty-state">
        <h2>{t.selectModule}</h2>
      </div>
    );
  }

  return (
    <div className="iframe-container">
      <iframe ref={iframeRef} src={url} title="Prototype Viewer" className="content-iframe" />
    </div>
  );
}

function AppLayout({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const location = useLocation();
  const t = portalI18n[lang as keyof typeof portalI18n] || portalI18n.zh;
  
  // Find matching URL for iframe
  let currentIframeUrl = '';
  navigationData.forEach(prod => {
    prod.children.forEach(feat => {
      if (feat.path === location.pathname) {
        currentIframeUrl = feat.getIframeUrl(lang);
      }
    });
  });

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="top-header">
          <div className="breadcrumb-simple">
             {location.pathname === '/gateway-api' ? 'Kpanda / Gateway API' : t.breadcrumbHome}
          </div>
          <div className="header-right">
            <button
              className="lang-toggle"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
            >
              <Globe size={16} />
              <span>{lang === 'zh' ? '中文' : 'EN'}</span>
            </button>
            <div className="user-profile">
              <div className="avatar">A</div>
              <span>Admin</span>
            </div>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<IframeViewer url="" lang={lang} />} />
          <Route path="/gateway-api" element={<IframeViewer url={currentIframeUrl} lang={lang} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState('zh');

  return (
    <BrowserRouter>
      <AppLayout lang={lang} setLang={setLang} />
    </BrowserRouter>
  );
}

export default App;
