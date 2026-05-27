import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Server, ChevronDown, ChevronRight, Globe, Cpu, BookOpen, LineChart } from 'lucide-react';
import './App.css';

// Mock data for the sidebar navigation including nested GPU iPavo sub-pages with typed array
const navigationData: any[] = [
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
        getIframeUrl: (lang?: string) =>
          import.meta.env.DEV
            ? `http://localhost:5174/?lang=${lang || 'zh'}`
            : `/prototypes/gatewayapi/?lang=${lang || 'zh'}`
      }
    ]
  },
  {
    id: 'insight',
    title: 'Insight',
    icon: <LayoutGrid size={18} />,
    children: [
      {
        id: 'gpu-ipavo',
        title: 'GPU iPavo',
        icon: <Cpu size={18} />,
        children: [
          {
            id: 'gpu-ipavo-dashboard',
            title: '监控大盘 (Dashboard)',
            icon: <LayoutGrid size={16} />,
            path: '/gpu-ipavo/dashboard',
            getIframeUrl: (_lang?: string) =>
              import.meta.env.DEV
                ? `http://localhost:3000/dashboard`
                : `/prototypes/gpu_ipavo/index.html`
          },
          {
            id: 'gpu-ipavo-spec',
            title: '交互式规格说明书 (Spec)',
            icon: <BookOpen size={16} />,
            path: '/gpu-ipavo/spec',
            getIframeUrl: (_lang?: string) =>
              import.meta.env.DEV
                ? `http://localhost:3000/spec`
                : `/prototypes/gpu_ipavo/functional_spec.html`
          },
          {
            id: 'gpu-ipavo-research',
            title: '行业竞品调研 (Research)',
            icon: <LineChart size={16} />,
            path: '/gpu-ipavo/research',
            getIframeUrl: (_lang?: string) =>
              import.meta.env.DEV
                ? `http://localhost:3000/research`
                : `/prototypes/gpu_ipavo/research.html`
          }
        ]
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ kpanda: true, insight: true });
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({ 'gpu-ipavo': true });
  const navigate = useNavigate();
  const location = useLocation();

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFeatureExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/daocloud-logo.png" alt="DaoCloud Logo" className="logo-image" />
        <span className="logo-text">DaoCloud Prototype</span>
      </div>
      <div className="sidebar-nav">
        {navigationData.map((product: any) => (
          <div key={product.id} className="nav-group">
            <div 
              className="nav-group-header" 
              onClick={() => toggleGroupExpand(product.id)}
            >
              <div className="nav-group-title">
                {expandedGroups[product.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {product.icon}
                <span>{product.title}</span>
              </div>
            </div>
            
            {expandedGroups[product.id] && (
              <div className="nav-group-children">
                {product.children.map((feature: any) => {
                  if (feature.children) {
                    // 3rd Level collapsible submenu (e.g. GPU iPavo under Insight)
                    const isFeatureExpanded = expandedFeatures[feature.id];
                    const isAnyChildActive = feature.children.some((child: any) => location.pathname === child.path);
                    return (
                      <div key={feature.id} className="nav-submenu-group" style={{ marginBottom: '4px' }}>
                        <div 
                          className={`nav-item ${isAnyChildActive ? 'parent-active' : ''}`}
                          onClick={(e) => toggleFeatureExpand(feature.id, e)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: isAnyChildActive ? 'var(--primary-color)' : 'inherit',
                            fontWeight: isAnyChildActive ? '600' : 'normal'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="nav-item-icon">{feature.icon}</span>
                            <span className="nav-item-text">{feature.title}</span>
                          </div>
                          <span>
                            {isFeatureExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        </div>
                        {isFeatureExpanded && (
                          <div className="nav-submenu-children" style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            {feature.children.map((child: any) => {
                              const isActive = location.pathname === child.path;
                              return (
                                <div 
                                  key={child.id} 
                                  className={`nav-item ${isActive ? 'active' : ''}`}
                                  onClick={() => navigate(child.path)}
                                  style={{ paddingLeft: '12px' }}
                                >
                                  <span className="nav-item-icon">{child.icon}</span>
                                  <span className="nav-item-text">{child.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Regular 2nd Level collapsible item (e.g. Gateway API under Kpanda)
                    const isActive = location.pathname === feature.path;
                    return (
                      <div 
                        key={feature.id} 
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(feature.path)}
                        style={{ marginBottom: '4px' }}
                      >
                        <span className="nav-item-icon">{feature.icon}</span>
                        <span className="nav-item-text">{feature.title}</span>
                      </div>
                    );
                  }
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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = portalI18n[lang as keyof typeof portalI18n] || portalI18n.zh;
  
  // Find matching URL for iframe dynamically, resolving nested levels
  let currentIframeUrl = '';
  navigationData.forEach((prod: any) => {
    prod.children.forEach((feat: any) => {
      if (feat.children) {
        feat.children.forEach((child: any) => {
          if (child.path === location.pathname) {
            currentIframeUrl = child.getIframeUrl(lang);
          }
        });
      } else {
        if (feat.path === location.pathname) {
          currentIframeUrl = feat.getIframeUrl(lang);
        }
      }
    });
  });

  // Calculate dynamic nested breadcrumbs
  let breadcrumb = t.breadcrumbHome;
  if (location.pathname === '/gateway-api') {
    breadcrumb = 'Kpanda / Gateway API';
  } else if (location.pathname === '/gpu-ipavo/dashboard') {
    breadcrumb = 'Insight / GPU iPavo / 监控大盘 (Dashboard)';
  } else if (location.pathname === '/gpu-ipavo/spec') {
    breadcrumb = 'Insight / GPU iPavo / 交互式规格说明书 (Spec)';
  } else if (location.pathname === '/gpu-ipavo/research') {
    breadcrumb = 'Insight / GPU iPavo / 行业竞品调研 (Research)';
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="top-header">
          <div className="breadcrumb-simple" style={{ fontWeight: 500 }}>
             {breadcrumb}
          </div>
          <div className="header-right">
            <div className="lang-wrapper">
              <button
                className="lang-toggle"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                <Globe size={16} />
                <span>Language</span>
                <ChevronDown size={14} />
              </button>
              {showLangMenu && (
                <div className="lang-dropdown">
                  <div
                    className={`lang-option ${lang === 'zh' ? 'active' : ''}`}
                    onClick={() => { setLang('zh'); setShowLangMenu(false); }}
                  >
                    中文
                  </div>
                  <div
                    className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => { setLang('en'); setShowLangMenu(false); }}
                  >
                    EN
                  </div>
                </div>
              )}
            </div>
            <div className="user-profile">
              <div className="avatar">A</div>
              <span>Admin</span>
            </div>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<IframeViewer url="" lang={lang} />} />
          <Route path="/gateway-api" element={<IframeViewer url={currentIframeUrl} lang={lang} />} />
          <Route path="/gpu-ipavo/dashboard" element={<IframeViewer url={currentIframeUrl} lang={lang} />} />
          <Route path="/gpu-ipavo/spec" element={<IframeViewer url={currentIframeUrl} lang={lang} />} />
          <Route path="/gpu-ipavo/research" element={<IframeViewer url={currentIframeUrl} lang={lang} />} />
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
