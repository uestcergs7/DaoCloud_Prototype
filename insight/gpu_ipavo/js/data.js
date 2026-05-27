/**
 * data.js — 模拟数据模块
 * 包含原始 DCE5 Dashboard 数据 + GPU 扩展数据
 */

const DashboardData = {
  // ============================================================
  // 原始 Dashboard 数据
  // ============================================================

  // 容器统计
  containerStats: {
    total: 383,
    running: 315,
    other: 68,
    // 蜂窝图数据：每个节点的健康状态
    honeycomb: [
      { status: 'healthy', count: 280 },    // 90-100% 绿色
      { status: 'good', count: 20 },        // 80-90% 浅绿
      { status: 'warning', count: 8 },      // 60-80% 红色
      { status: 'danger', count: 5 },       // 40-60% 深红
      { status: 'critical', count: 2 },     // 0-40% 黑色
      { status: 'unknown', count: 0 }       // 未知 灰色
    ]
  },

  // CPU 用量时序数据
  cpuUsage: {
    labels: ['16:00', '16:05', '16:10', '16:15', '16:20', '16:25', '16:30'],
    data: [28, 32, 35, 30, 45, 62, 78]
  },

  // 内存用量时序数据
  memoryUsage: {
    labels: ['16:00', '16:05', '16:10', '16:15', '16:20', '16:25', '16:30'],
    data: [40, 42, 41, 43, 44, 43, 45]
  },

  // 健康状态
  healthStatus: {
    overall: 'unhealthy',  // 不健康
    details: [
      { icon: 'cluster', label: '集群', value: '2/3', status: 'unhealthy' },
      { icon: 'node', label: '节点', value: '10/10', status: 'healthy' },
      { icon: 'pod', label: '容器组', value: '315/383', status: 'healthy' }
    ]
  },

  // 告警
  alerts: {
    critical: 4,
    warning: 60,
    info: 5,
    items: [
      { time: '2026-05-20T08:43:53', message: 'NodeDiskIOSaturation:Disk IO queue (aqu-sq...' },
      { time: '2026-05-20T08:43:53', message: 'NodeDiskIOSaturation:Disk IO queue (aqu-sq...' },
      { time: '2026-05-20T08:33:09', message: 'CPUThrottlingHigh:70.15% throttling of CP...' },
      { time: '2026-05-20T08:33:09', message: 'CPUThrottlingHigh:70.59% throttling of CP...' },
      { time: '2026-05-20T08:33:09', message: 'CPUThrottlingHigh:99.91% throttling of CP...' }
    ]
  },

  // 集群统计
  clusterStats: {
    clusterCount: 3,
    nodeCount: 10,
    clusters: [
      { name: 'network', icon: 'network', badges: ['running', 'connected'] },
      { name: 'minquan-dev', icon: 'dev', badges: ['running', 'warning'] },
      { name: 'kpanda-global-cluster', icon: 'global', badges: ['running', 'connected'] }
    ]
  },

  // 资源用量
  resourceUsage: {
    cpu: { used: 9.437, total: 32, unit: 'core', percent: 29 },
    memory: { used: 27.09, total: 62.74, unit: 'GB', percent: 43 },
    pods: { used: 114, total: 200, unit: '', percent: 56 },
    disk: { used: 38.05, total: 95.94, unit: 'GB', percent: 39 }
  },

  // 功能一览
  features: [
    { name: '容器管理', icon: 'container', links: ['网络', '消息', '存储'] },
    { name: '可观测性', icon: 'observability', links: ['监控', '追踪', '日志', '告警'] },
    { name: '全局管理', icon: 'global', links: [] }
  ],

  // ============================================================
  // GPU 扩展数据
  // ============================================================

  // GPU 节点/设备统计
  gpuStats: {
    readyNodes: { ready: 4, total: 4, link: 'All nodes' },
    readyDevices: { ready: 32, total: 32, link: 'All nodes' },
    allocatedDevices: { value: 30.50, link: 'All nodes' },
    idleDevices: { value: 0.50, link: 'All workloads' }
  },

  // GPU 利用率（仪表盘）
  gpuUtilization: {
    allocation: { value: 87.9, label: 'GPU Allocation' },
    computeUtilization: { value: 84.1, label: 'GPU Compute Utilization' },
    memoryAllocation: { value: 87.9, label: 'GPU Memory Allocation' },
    memoryUtilization: { value: 87.6, label: 'GPU Memory Utilization' }
  },

  // GPU 资源用量（环形图扩展）
  gpuResourceUsage: {
    gpu: { used: 23.04, total: 32, unit: '卡', percent: 72 },
    vram: { used: 156.8, total: 241.2, unit: 'GB', percent: 65 }
  },

  // GPU 利用率 by Cluster（原 by Project，字段改为 Cluster）
  gpuAllocationByCluster: {
    sortBy: 'Highest Avg. GPU allocation',
    timeRange: 'Last 24h',
    rows: [
      { cluster: 'kc-demo-prod', avgAllocation: 7.53, avgUtilization: 81, avgMemUtilization: 100, workloads: 2 },
      { cluster: 'kc-demo-dev', avgAllocation: 0, avgUtilization: null, avgMemUtilization: null, workloads: 4 },
      { cluster: 'kc-demo-stage', avgAllocation: 0, avgUtilization: null, avgMemUtilization: null, workloads: 1 }
    ]
  },

  // GPU 使用情况 by Cluster（原 by Project，字段改为 Cluster）
  gpuConsumptionByCluster: {
    rows: [
      { cluster: 'Fraud-algo-2.8', gpuQuota: 10.00, gpuAllocation: 18.00, runningWorkloads: 15 },
      { cluster: 'Underwriting-1.7', gpuQuota: 24.00, gpuAllocation: 9.00, runningWorkloads: 7 },
      { cluster: 'Risk-score-5.3', gpuQuota: 18.00, gpuAllocation: 22.00, runningWorkloads: 17 },
      { cluster: 'FX-rate-prod', gpuQuota: 5.00, gpuAllocation: 3.00, runningWorkloads: 3 }
    ]
  },

  // ============================================================
  // AI 运维数据
  // ============================================================

  // AI ROI (Monthly)
  aiROI: {
    projected: '+￥1.2M',
    period: "2025 财年预估",
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    data: [120, 200, 280, 350, 400, 500, 620, 750, 850, 1000, 1100, 1200]
  },

  // 护栏干预统计 (Daily)
  guardrailInterventions: {
    labels: Array.from({ length: 26 }, (_, i) => i),
    data: [8, 12, 25, 30, 35, 42, 48, 55, 50, 45, 80, 90, 100, 110, 105, 95, 120, 125, 130, 128, 135, 140, 60, 65, 70, 68]
  },

  // AI Safety Score
  aiSafetyScore: 90,

  // Model Costs
  modelCosts: {
    totalCost: 4984.34,
    models: [
      { name: 'gemini-2.5-flash', tokens: '200m', cost: 403.56 },
      { name: 'gpt-4o', tokens: '85m', cost: 1275.00 },
      { name: 'claude-sonnet-4', tokens: '120m', cost: 1440.00 },
      { name: 'llama-3.1-70b', tokens: '350m', cost: 1865.78 },
      { name: 'gpt-3.5-turbo', tokens: '500m', cost: 250.00 },
      { name: 'claude-3-haiku', tokens: '400m', cost: 300.00 },
      { name: 'qwen-max', tokens: '150m', cost: 450.00 },
      { name: 'gemini-1.5-pro', tokens: '90m', cost: 800.00 },
      { name: 'moonshot-v1-8k', tokens: '210m', cost: 320.00 },
      { name: 'deepseek-chat', tokens: '600m', cost: 120.00 },
      { name: 'glm-4', tokens: '180m', cost: 500.00 },
      { name: 'baichuan2-turbo', tokens: '220m', cost: 280.00 },
      { name: 'yi-large', tokens: '110m', cost: 350.00 },
      { name: 'mixtral-8x7b', tokens: '300m', cost: 150.00 },
      { name: 'llama-3-8b', tokens: '800m', cost: 80.00 }
    ]
  },

  // Cluster 成本分解
  clusterBreakdown: {
    rows: [
      { cluster: 'kc-demo-prod', nodes: 3, pods: 37, cost: 83.72 },
      { cluster: 'kc-demo-dev', nodes: 1, pods: 19, cost: 38.43 },
      { cluster: 'kc-demo-stage', nodes: 1, pods: 27, cost: 28.23 }
    ]
  }
};
