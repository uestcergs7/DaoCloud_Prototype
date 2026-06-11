import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  Activity,
  FolderTree,
  Database,
  Users,
  ChevronDown,
  Monitor,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(
    () => localStorage.getItem('alert_routing_sidebar_collapsed') === 'true',
  );

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('alert_routing_sidebar_collapsed', String(next));
      return next;
    });
  };

  const sidebarItems = [
    { name: '概览', icon: LayoutDashboard },
    { name: '仪表盘', icon: Monitor },
    { name: '基础设施', icon: Database },
    { name: '指标', icon: Activity },
    { name: '日志', icon: FileText },
    {
      name: '告警',
      icon: Bell,
      active: true,
      subItems: [
        { name: '告警列表', path: '/alerts' },
        { name: '告警策略', path: '/' },
        { name: '通知配置', path: '#' },
        { name: '消息模板', path: '#' },
      ],
    },
    { name: '采集管理', icon: Database },
    { name: '系统管理', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans">
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-[#2b333e] text-gray-400 transition-all duration-200',
          isSidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'h-16 flex items-center gap-2 bg-[#232a33]',
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold flex-shrink-0">
                D
              </div>
              <span className="text-white font-bold text-lg tracking-tight truncate">DaoCloud</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            aria-label={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className={cn('flex-1 overflow-y-auto py-4', isSidebarCollapsed && 'px-2')}>
          {!isSidebarCollapsed && (
            <div className="px-4 mb-2 text-[10px] uppercase font-bold tracking-wider text-gray-500">
              观测性
            </div>
          )}
          {sidebarItems.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div
                className={cn(
                  'flex items-center py-2 text-sm transition-colors cursor-pointer group hover:text-white rounded',
                  isSidebarCollapsed ? 'justify-center px-0' : 'px-4',
                  item.active ? 'text-white bg-[#1e252d]' : '',
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={cn('w-4 h-4', !isSidebarCollapsed && 'mr-3')} />
                {!isSidebarCollapsed && <span className="flex-1">{item.name}</span>}
                {!isSidebarCollapsed && item.subItems && <ChevronDown className="w-3 h-3" />}
              </div>

              {!isSidebarCollapsed && item.subItems && item.active && (
                <div className="bg-[#1e252d] py-1">
                  {item.subItems.map((sub, sIdx) => (
                    <Link
                      key={sIdx}
                      to={sub.path}
                      className={cn(
                        'block px-11 py-2 text-xs hover:text-white transition-colors',
                        location.pathname === sub.path ? 'text-blue-400 font-medium' : '',
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-gray-700', isSidebarCollapsed ? 'p-2' : 'p-4')}>
          <div
            className={cn(
              'flex items-center text-sm hover:text-white cursor-pointer transition-colors rounded py-2',
              isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-2',
            )}
            title={isSidebarCollapsed ? '用户管理' : undefined}
          >
            <Users className="w-4 h-4" />
            {!isSidebarCollapsed && <span>用户管理</span>}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-4 font-bold text-lg">DaoCloud</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span className="hover:text-blue-600 cursor-pointer">观测性</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {location.pathname === '/' ? '告警策略' : '告警列表'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-gray-500">
              <Link to="/" className="p-1 hover:text-blue-600" title="告警策略">
                <FolderTree className="w-5 h-5" />
              </Link>
              <Link to="/alerts" className="p-1 hover:text-blue-600" title="告警列表">
                <Bell className="w-5 h-5" />
              </Link>
              <Settings className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
            </div>
            <div className="h-8 w-[1px] bg-gray-200" />
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold border border-blue-200 group-hover:bg-blue-200 transition-colors">
                AD
              </div>
              <span className="text-sm font-medium text-gray-700">admin</span>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
