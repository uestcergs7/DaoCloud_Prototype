import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  RefreshCw, 
  Settings, 
  ChevronRight, 
  MoreVertical,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertNotification {
  id: string;
  alertname: string;
  policyName: string;
  status: '告警中' | '已解决';
  severity: 'critical' | 'warning' | 'info';
  cluster: string;
  namespace: string;
  resourceType: string;
  resourceName: string;
  triggerValue: string;
  description: string;
  notificationStatus: string;
  treeNotificationStatus: string; // Moved after notificationStatus
  time: string;
}

const mockAlerts: AlertNotification[] = [
  {
    id: '1',
    alertname: 'NodeDiskIOSaturation',
    policyName: 'node',
    status: '告警中',
    severity: 'warning',
    cluster: 'minquan-dev',
    namespace: '-',
    resourceType: '节点',
    resourceName: 'control-plane',
    triggerValue: '0',
    description: 'Disk IO queue...',
    notificationStatus: '未配置',
    treeNotificationStatus: '已匹配 (Critical Alerts - PROD)',
    time: '2026-04-09 17:46'
  },
  {
    id: '2',
    alertname: 'CPUThrottlingHigh',
    policyName: 'kubernetes',
    status: '告警中',
    severity: 'info',
    cluster: 'minquan-dev',
    namespace: 'insight-system',
    resourceType: '集群',
    resourceName: 'minquan-dev',
    triggerValue: '53.51%',
    description: '53.51% throttling...',
    notificationStatus: '未配置',
    treeNotificationStatus: '已匹配 (Major Alerts - TEST)',
    time: '2026-04-09 17:35'
  },
  {
    id: '3',
    alertname: 'CPUThrottlingHigh',
    policyName: 'kubernetes',
    status: '告警中',
    severity: 'info',
    cluster: 'minquan-dev',
    namespace: 'insight-system',
    resourceType: '集群',
    resourceName: 'minquan-dev',
    triggerValue: '56.33%',
    description: '56.33% throttling...',
    notificationStatus: '未配置',
    treeNotificationStatus: '已匹配 (Major Alerts - TEST)',
    time: '2026-04-09 13:16'
  },
  {
    id: '4',
    alertname: 'ElasticsearchDown',
    policyName: 'insight-ser...',
    status: '告警中',
    severity: 'critical',
    cluster: '-',
    namespace: '-',
    resourceType: '集群',
    resourceName: '-',
    triggerValue: '0',
    description: 'Elastic Clus...',
    notificationStatus: '未配置',
    treeNotificationStatus: '已匹配 (Critical Alerts)',
    time: '2026-04-09 13:03'
  },
  {
    id: '5',
    alertname: 'KubeDeploymentReplicasMismatch',
    policyName: 'kubernetes',
    status: '告警中',
    severity: 'warning',
    cluster: 'kpanda-glob...',
    namespace: 'default',
    resourceType: '集群',
    resourceName: 'kpanda-glob...',
    triggerValue: '0',
    description: 'Deploymen...',
    notificationStatus: '未配置',
    treeNotificationStatus: '已匹配 (Major Alerts - TEST)',
    time: '2026-04-09 12:58'
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [alerts] = useState<AlertNotification[]>(mockAlerts);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Breadcrumb & Tabs */}
      <div className="bg-white px-6 pt-4 border border-gray-200 rounded-t-lg shadow-sm">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <ChevronRight className="w-3 h-3" />
          <span>告警消息</span>
        </div>
        
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('active')}
            className={cn(
              "pb-3 text-sm font-medium transition-colors border-b-2",
              activeTab === 'active' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            活动告警
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "pb-3 text-sm font-medium transition-colors border-b-2",
              activeTab === 'history' ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            历史告警
          </button>
        </div>
      </div>

      {/* Top Cards (Stats & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribution Card */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-56">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">告警分布</h3>
            <select className="text-xs border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>最近 24 小时</option>
              <option>最近 7 天</option>
            </select>
          </div>
          <div className="flex-1 flex items-end gap-1 px-2 pb-2">
            {/* Dummy Bar Chart */}
            {[0.1, 0.2, 0.5, 0.3, 0.1, 0.4, 0.8, 0.2, 0.5, 0.3, 0.6, 0.4, 0.2, 0.9, 0.1, 0.3, 0.5, 0.2].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 group cursor-pointer">
                <div 
                  className={cn(
                    "w-full rounded-t-sm transition-all group-hover:opacity-80",
                    i % 3 === 0 ? "bg-red-400" : i % 3 === 1 ? "bg-yellow-400" : "bg-blue-400"
                  )} 
                  style={{ height: `${val * 100}%` }}
                  title={`Value: ${val}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 px-2 mt-1">
            <span>20:00</span>
            <span>04-09</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-56">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-6">告警统计</h3>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2 hover:bg-red-50 rounded-lg transition-colors group">
              <AlertCircle className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-gray-500 mb-1">紧急</span>
              <span className="text-2xl font-bold text-red-600">17</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 hover:bg-yellow-50 rounded-lg transition-colors group">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-gray-500 mb-1">警告</span>
              <span className="text-2xl font-bold text-yellow-600">113</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 hover:bg-blue-50 rounded-lg transition-colors group">
              <Info className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-gray-500 mb-1">提示</span>
              <span className="text-2xl font-bold text-blue-600">9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">集群</span>
          <select className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-gray-50 text-gray-700 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>全部集群</option>
            <option>minquan-dev</option>
            <option>kpanda-global</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">命名空间</span>
          <select className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-gray-50 text-gray-700 min-w-[150px] focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>全部命名空间</option>
            <option>insight-system</option>
            <option>default</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">状态</span>
          <select className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-gray-50 text-gray-700 min-w-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>告警中</option>
            <option>已解决</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索" 
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="配置列">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="刷新">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">规则名称</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">告警策略名称</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">告警级别</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">集群</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">命名空间</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">资源类型</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">资源名称</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">触发值</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">描述</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">通知状态</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tree通知状态</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">发生时间</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{alert.alertname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.policyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                      <span className="text-gray-700">{alert.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                      alert.severity === 'critical' ? "bg-red-50 text-red-600 border border-red-100" :
                      alert.severity === 'warning' ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {alert.severity === 'critical' ? '紧急' : alert.severity === 'warning' ? '警告' : '提示'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.cluster}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.namespace}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.resourceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.resourceName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.triggerValue}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate" title={alert.description}>{alert.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="font-medium text-gray-500">{alert.notificationStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.treeNotificationStatus}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    {alert.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                    <button className="p-1 hover:text-blue-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">共 {alerts.length} 条数据</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-400 cursor-not-allowed">上一页</button>
            <button className="px-3 py-1 border border-blue-500 rounded text-sm bg-blue-500 text-white">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-600 hover:bg-gray-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
