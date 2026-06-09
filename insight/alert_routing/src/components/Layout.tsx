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
  LogOut,
  ChevronDown,
  Monitor,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { name: '策略树配置', path: '/', icon: FolderTree },
    { name: '告警通知列表', path: '/alerts', icon: Bell },
  ];

  const sidebarItems = [
    { name: '概览', icon: LayoutDashboard },
    { name: '仪表盘', icon: Monitor },
    { name: '基础设施', icon: Database },
    { name: '指标', icon: Activity },
    { name: '日志', icon: FileText },
    { name: '告警', icon: Bell, active: true, subItems: [
      { name: '告警列表', path: '/alerts' },
      { name: '告警策略', path: '/' },
      { name: '通知配置', path: '#' },
      { name: '消息模板', path: '#' },
    ]},
    { name: '采集管理', icon: Database },
    { name: '系统管理', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#2b333e] text-gray-400">
        <div className="h-16 flex items-center px-6 gap-2 bg-[#232a33]">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">D</div>
          <span className="text-white font-bold text-lg tracking-tight">DaoCloud</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-[10px] uppercase font-bold tracking-wider text-gray-500">观测性</div>
          {sidebarItems.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className={cn(
                "flex items-center px-4 py-2 text-sm transition-colors cursor-pointer group hover:text-white",
                item.active ? "text-white bg-[#1e252d]" : ""
              )}>
                <item.icon className="w-4 h-4 mr-3" />
                <span className="flex-1">{item.name}</span>
                {item.subItems && <ChevronDown className="w-3 h-3" />}
              </div>
              
              {item.subItems && item.active && (
                <div className="bg-[#1e252d] py-1">
                  {item.subItems.map((sub, sIdx) => (
                    <Link
                      key={sIdx}
                      to={sub.path}
                      className={cn(
                        "block px-11 py-2 text-xs hover:text-white transition-colors",
                        location.pathname === sub.path ? "text-blue-400 font-medium" : ""
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
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-2 text-sm hover:text-white cursor-pointer transition-colors">
            <Users className="w-4 h-4" />
            <span>用户管理</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
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
             <span className="text-gray-900 font-medium">告警列表</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-gray-500">
              <Link to="/" className="p-1 hover:text-blue-600" title="策略树配置"><FolderTree className="w-5 h-5" /></Link>
              <Bell className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
