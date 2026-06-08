import { SKU } from '../src/types/sku.js'

// 1. 产品与区域配置
export const mockProducts = [
  { product: 'zestu-container-instance' },
  { product: 'zestu-file-storage' },
  { product: 'zestu-local-storage' },
  { product: 'hydra-maas' }
]

export const mockRegions = [
  { id: 'cn-shanghai', name: '华东（上海）' },
  { id: 'cn-beijing', name: '华北（北京）' },
  { id: 'cn-hangzhou', name: '华东（杭州）' }
]

export const mockGpuModels = [
  { value: 'GeForce-RTX-4090' },
  { value: 'NVIDIA-A100-80GB' },
  { value: 'NVIDIA-H100-80GB' },
  { value: 'Tesla-T4' },
  { value: 'NVIDIA-L4' }
]

// 2. 折扣策略列表 (符合 PRD 中包年包月阶梯折、优先级 priority 与叠加控制 allow_stacking)
export const mockDiscountRules: Record<string, any> = {
  'rule-1': {
    id: 'rule-1',
    name: '常规容器包月时长梯度折 (P1)',
    priority: 10, // P1
    allow_stacking: 0, // 排他
    meteringAmountsDiscounts: [
      { meteringAmounts: 1, discountPercentage: 80 }, // 1个月 8折
      { meteringAmounts: 3, discountPercentage: 70 }, // 3个月 7折
      { meteringAmounts: 6, discountPercentage: 60 }  // 6个月 6折
    ]
  },
  'rule-2': {
    id: 'rule-2',
    name: '双十一限时特惠强覆盖 (P0)',
    priority: 0, // P0 (最高优先级)
    allow_stacking: 0, // 排他
    meteringAmountsDiscounts: [
      { meteringAmounts: 1, discountPercentage: 50 }, // 全场 5 折
      { meteringAmounts: 3, discountPercentage: 45 }
    ]
  },
  'rule-3': {
    id: 'rule-3',
    name: '大客户专享渠道叠加折 (P2)',
    priority: 20, // P2 (低优先级，但开启叠加)
    allow_stacking: 1, // 允许叠加
    meteringAmountsDiscounts: [
      { meteringAmounts: 1, discountPercentage: 90 }, // 9 折叠加
      { meteringAmounts: 3, discountPercentage: 85 }
    ]
  }
}

// 3. SKU 与 SKU-infos 仿真数据
export const mockSpecs = [
  { id: 101, name: 'RTX-4090-Single', product: 'zestu-container-instance' },
  { id: 102, name: 'A100-80G-Single', product: 'zestu-container-instance' },
  { id: 103, name: 'File-Storage-Basic', product: 'zestu-file-storage' },
  { id: 104, name: 'Local-Disk-NVMe', product: 'zestu-local-storage' },
  { id: 105, name: 'MaaS-Llama3-8B', product: 'hydra-maas' }
]

export const mockSkus: any[] = [
  {
    id: 'sku-101',
    region: 'cn-shanghai',
    specName: 'RTX-4090 容器实例',
    price: 3000000000, // 3000 元/月 (微元单位 = 元 * 1,000,000)
    billingType: 'SUBSCRIPTION_MONTHLY',
    discountRuleId: 'rule-1',
    specFields: [
      { key: 'gpu-model', value: 'GeForce-RTX-4090' },
      { key: 'gpu-type', value: 'gpu' },
      { key: 'gpu-count', value: '1' },
      { key: 'gpu-memory', value: '24' },
      { key: 'cpu', value: '16' },
      { key: 'memory', value: '64' }
    ]
  },
  {
    id: 'sku-102',
    region: 'cn-shanghai',
    specName: 'A100 80G 容器实例',
    price: 12000000000, // 12000 元/月
    billingType: 'SUBSCRIPTION_MONTHLY',
    discountRuleId: 'rule-2',
    specFields: [
      { key: 'gpu-model', value: 'NVIDIA-A100-80GB' },
      { key: 'gpu-type', value: 'gpu' },
      { key: 'gpu-count', value: '1' },
      { key: 'gpu-memory', value: '80' },
      { key: 'cpu', value: '32' },
      { key: 'memory', value: '256' }
    ]
  },
  {
    id: 'sku-103',
    region: 'cn-shanghai',
    specName: '通用型高性能文件存储',
    price: 400000, // 0.4 元/GB/月
    billingType: 'PAY_AS_YOU_GO',
    discountRuleId: '',
    specFields: [
      { key: 'storage-type', value: 'SSD' },
      { key: 'throughput', value: '150MB/s' }
    ]
  },
  {
    id: 'sku-104',
    region: 'cn-beijing',
    specName: 'MaaS Llama-3-8B 模型服务',
    price: 8000, // 8000 微元/k-token = 0.008 元/k-token
    billingType: 'PAY_AS_YOU_GO',
    discountRuleId: 'rule-3',
    specFields: [
      { key: 'model-name', value: 'Llama3-8B' },
      { key: 'token-type', value: 'input' }
    ]
  },
  {
    id: 'sku-105',
    region: 'cn-shanghai',
    specName: 'H100 80G 容器实例',
    price: 24000000000,
    billingType: 'SUBSCRIPTION_MONTHLY',
    discountRuleId: '',
    specFields: [
      { key: 'gpu-model', value: 'NVIDIA-H100-80GB' },
      { key: 'gpu-type', value: 'gpu' },
      { key: 'gpu-count', value: '1' },
      { key: 'gpu-memory', value: '80' },
      { key: 'cpu', value: '64' },
      { key: 'memory', value: '512' }
    ]
  },
  {
    id: 'sku-106',
    region: 'cn-shanghai',
    specName: 'L4 容器实例',
    price: 1500000000,
    billingType: 'SUBSCRIPTION_MONTHLY',
    discountRuleId: '',
    specFields: [
      { key: 'gpu-model', value: 'NVIDIA-L4' },
      { key: 'gpu-type', value: 'gpu' },
      { key: 'gpu-count', value: '1' },
      { key: 'gpu-memory', value: '24' },
      { key: 'cpu', value: '8' },
      { key: 'memory', value: '32' }
    ]
  },
  {
    id: 'sku-107',
    region: 'cn-shanghai',
    specName: 'Tesla T4 容器实例',
    price: 800000000,
    billingType: 'SUBSCRIPTION_MONTHLY',
    discountRuleId: '',
    specFields: [
      { key: 'gpu-model', value: 'Tesla-T4' },
      { key: 'gpu-type', value: 'gpu' },
      { key: 'gpu-count', value: '1' },
      { key: 'gpu-memory', value: '16' },
      { key: 'cpu', value: '4' },
      { key: 'memory', value: '16' }
    ]
  }
]

export const mockSkuInfos: Record<string, any> = {
  'sku-101': {
    id: 'sku-101',
    specId: 101,
    productName: 'zestu-container-instance',
    regionName: 'cn-shanghai',
    price: '3000000000',
    billingPolicyId: 8, // SUBSCRIPTION_MONTHLY
    freeQuantity: 0,
    available: 1,
    displayOrder: 1,
    discountRuleId: 'rule-1',
    description: '华东（上海）高性能 4090 容器算力实例'
  },
  'sku-102': {
    id: 'sku-102',
    specId: 102,
    productName: 'zestu-container-instance',
    regionName: 'cn-shanghai',
    price: '12000000000',
    billingPolicyId: 8, // SUBSCRIPTION_MONTHLY
    freeQuantity: 0,
    available: 1,
    displayOrder: 2,
    discountRuleId: 'rule-2',
    description: '华东（上海）独享型 A100-80G 高端科研级算力'
  },
  'sku-103': {
    id: 'sku-103',
    specId: 103,
    productName: 'zestu-file-storage',
    regionName: 'cn-shanghai',
    price: '400000',
    billingPolicyId: 1, // PAY_AS_YOU_GO
    freeQuantity: 20, // 免费赠送 20G
    available: 1,
    displayOrder: 3,
    discountRuleId: '',
    description: '极速冷热隔离型分布式共享文件存储系统'
  },
  'sku-104': {
    id: 'sku-104',
    specId: 105,
    productName: 'hydra-maas',
    regionName: 'cn-beijing',
    price: '8000',
    billingPolicyId: 3, // k-token
    freeQuantity: 0,
    available: 1,
    displayOrder: 4,
    discountRuleId: 'rule-3',
    description: 'Meta Llama 3 8B 极速版推理接口'
  },
  'sku-105': {
    id: 'sku-105',
    specId: 105,
    productName: 'zestu-container-instance',
    regionName: 'cn-shanghai',
    price: '24000000000',
    billingPolicyId: 8, // SUBSCRIPTION_MONTHLY
    freeQuantity: 0,
    available: 1,
    displayOrder: 5,
    discountRuleId: '',
    description: '华东（上海）独享型 H100 高阶容器算力实例'
  },
  'sku-106': {
    id: 'sku-106',
    specId: 106,
    productName: 'zestu-container-instance',
    regionName: 'cn-shanghai',
    price: '1500000000',
    billingPolicyId: 8, // SUBSCRIPTION_MONTHLY
    freeQuantity: 0,
    available: 1,
    displayOrder: 6,
    discountRuleId: '',
    description: '华东（上海）通用型 L4 容器算力实例'
  },
  'sku-107': {
    id: 'sku-107',
    specId: 107,
    productName: 'zestu-container-instance',
    regionName: 'cn-shanghai',
    price: '800000000',
    billingPolicyId: 8, // SUBSCRIPTION_MONTHLY
    freeQuantity: 0,
    available: 1,
    displayOrder: 7,
    discountRuleId: '',
    description: '华东（上海）基础型 Tesla T4 容器算力实例'
  }
}

// 4. Ghippo 用户列表
export const mockUsers = [
  {
    id: 'user-1',
    username: 'admin',
    name: '系统超级管理员',
    email: 'admin@d.run',
    description: 'D.Run 平台主权管理账号',
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-30T10:00:00Z',
    lastLoginAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'user-2',
    username: 'DaoCloud_Partner',
    name: '上海道客渠道分销商',
    email: 'partner@daocloud.io',
    description: '平台核心白标渠道合作商，名下管理多个大型政企子客户。',
    enabled: true,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-05-31T09:00:00Z',
    lastLoginAt: '2026-06-01T09:30:00Z'
  },
  {
    id: 'user-3',
    username: 'SubAccount_ShenN',
    name: '申工（主账号）',
    email: 'shenn@dce.io',
    description: '核心测试主账号，专门测试 Leopard 折扣率策略与冲突仲裁。',
    enabled: true,
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-05-28T04:00:00Z',
    lastLoginAt: '2026-06-01T10:15:00Z'
  },
  {
    id: 'user-4',
    username: 'DCE_Operator',
    name: '运营专员',
    email: 'operator@dce.io',
    description: 'Leopard 平台折扣策略运营管理账号。',
    enabled: true,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-05-29T11:00:00Z',
    lastLoginAt: '2026-06-01T11:00:00Z'
  },
  {
    id: 'user-5',
    username: 'Financial_Auditor',
    name: '财务审计员',
    email: 'finance@dce.io',
    description: '折扣率结算与账单对账审计账号。',
    enabled: true,
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-05-30T12:00:00Z',
    lastLoginAt: '2026-06-01T12:30:00Z'
  }
]

// 用户实名认证
export const mockCertifyInfos: Record<string, any> = {
  'user-1': { certName: '系统组运维主管', certNo: '110101********0001', certTime: '2026-01-01T00:00:00Z', subject: 'Individual' },
  'user-2': { certName: '上海道客网络科技有限公司', certNo: '913101********1234', certTime: '2026-02-15T00:00:00Z', subject: 'Enterprise' },
  'user-3': { certName: '申工', certNo: '310104********8888', certTime: '2026-03-01T12:00:00Z', subject: 'Individual' },
  'user-4': { certName: '运营专员', certNo: '310105********1111', certTime: '2026-04-01T08:00:00Z', subject: 'Individual' },
  'user-5': { certName: '财务审计员', certNo: '310106********2222', certTime: '2026-04-10T09:00:00Z', subject: 'Individual' }
}

// 钱包余额
export const mockWalletBalances: Record<string, any> = {
  'user-1': { balance: '582910.45', isVirtual: false, alertsEnabled: true, mainAccountInArrears: false },
  'user-2': { balance: '24900.00', isVirtual: true, alertsEnabled: true, mainAccountInArrears: false },
  'user-3': { balance: '880.50', isVirtual: false, alertsEnabled: false, mainAccountInArrears: false },
  'user-4': { balance: '500.00', isVirtual: false, alertsEnabled: false, mainAccountInArrears: false },
  'user-5': { balance: '12000.50', isVirtual: false, alertsEnabled: true, mainAccountInArrears: false }
}

// 代金券统计
export const mockVoucherStats: Record<string, any> = {
  'user-1': { amount: '5000.00', count: 2 },
  'user-2': { amount: '1500.00', count: 1 },
  'user-3': { amount: '350.00', count: 2 },
  'user-4': { amount: '0.00', count: 0 },
  'user-5': { amount: '1000.00', count: 1 }
}

// 代金券详细列表
export const mockVouchers: Record<string, any[]> = {
  'user-3': [
    {
      voucherId: 'vouch-2026-001',
      name: '算力专属新人代金券',
      amount: '200.00',
      balance: '150.00',
      status: 'ACTIVE',
      expireAt: '2026-12-31T23:59:59Z',
      description: '新客户算力专属代金券'
    },
    {
      voucherId: 'vouch-2026-002',
      name: '折扣测试叠加券',
      amount: '200.00',
      balance: '200.00',
      status: 'ACTIVE',
      expireAt: '2027-06-30T23:59:59Z',
      description: '可用于折扣叠加测试的现金券'
    }
  ]
}

export const mockExpiredVouchers: Record<string, any[]> = {
  'user-3': [
    {
      voucherId: 'vouch-expired-001',
      name: '2025年Q4大促失效券',
      amount: '500.00',
      balance: '0.00',
      status: 'EXPIRED',
      expireAt: '2025-12-31T23:59:59Z',
      description: '2025冬季算力大促代金券已失效'
    }
  ]
}

// 子账号成员列表
export const mockMembers: Record<string, any[]> = {
  'user-2': [
    { id: 'member-1', name: 'DaoCloud_Partner#TechSupport' },
    { id: 'member-2', name: 'DaoCloud_Partner#FinanceAdmin' }
  ],
  'user-3': [
    { id: 'member-3', name: 'SubAccount_ShenN#DevOps' },
    { id: 'member-4', name: 'SubAccount_ShenN#Developer' }
  ]
}

// 模拟订单列表
export const mockOrders: Record<string, any[]> = {
  'user-3': [
    {
      orderId: 'ord-20260601-0001',
      productName: 'zestu-container-instance',
      orderType: 'PURCHASE',
      amountDue: '2400.00',
      orderPrice: '3000.00', // 原始价
      orderStatus: 'PAID',
      createdAtTimestamp: String(Date.now() - 3600 * 1000),
      username: 'SubAccount_ShenN'
    },
    {
      orderId: 'ord-20260520-0002',
      productName: 'zestu-file-storage',
      orderType: 'PURCHASE',
      amountDue: '160.00',
      orderPrice: '200.00',
      orderStatus: 'PAID',
      createdAtTimestamp: String(Date.now() - 10 * 24 * 3600 * 1000),
      username: 'SubAccount_ShenN'
    }
  ]
}

// 订单详情，配合 PRD 的“流水策略打标”和“价格计算过程图”
export const mockOrderDetails: Record<string, { orderInfo: any; productInfo: any[] }> = {
  'ord-20260601-0001': {
    orderInfo: {
      orderId: 'ord-20260601-0001',
      createdAtTimestamp: String(Date.now() - 3600 * 1000),
      orderType: 'PURCHASE',
      orderStatus: 'PAID',
      orderPrice: '3000.00',
      amountDue: '2400.00',
      username: 'SubAccount_ShenN',
      userId: 'user-3'
    },
    productInfo: [
      {
        productName: 'zestu-container-instance',
        resourceNum: 1,
        specification: JSON.stringify({
          'gpu-model': 'GeForce-RTX-4090',
          'gpu-type': 'gpu',
          'gpu-count': '1',
          'gpu-memory': '24GB',
          'cpu': '16',
          'memory': '64GB',
          // 审计痕迹 (对应 PRD 的命中链路与决策图记录需求)
          'matched_strategy_id': 'rule-1',
          'matched_strategy_name': '常规容器包月时长梯度折 (P1)',
          'original_price_yuan': 3000.0,
          'discount_applied': '1:8000 (1个月打 8 折)',
          'final_price_yuan': 2400.0,
          'priority': 'P1',
          'allow_stacking': 'false',
          'lowest_price_arbitration': '选定最终结算最低价 (3000*0.8 = 2400)'
        }),
        billingType: 'SUBSCRIPTION_MONTHLY',
        start: String(Date.now() - 3600 * 1000),
        end: String(Date.now() - 3600 * 1000 + 30 * 24 * 3600 * 1000),
        resources: [
          { name: 'rtx4090-dev-box-01', id: 'res-container-4090x01' }
        ]
      }
    ]
  },
  'ord-20260520-0002': {
    orderInfo: {
      orderId: 'ord-20260520-0002',
      createdAtTimestamp: String(Date.now() - 10 * 24 * 3600 * 1000),
      orderType: 'PURCHASE',
      orderStatus: 'PAID',
      orderPrice: '200.00',
      amountDue: '160.00',
      username: 'SubAccount_ShenN',
      userId: 'user-3'
    },
    productInfo: [
      {
        productName: 'zestu-file-storage',
        resourceNum: 1,
        specification: JSON.stringify({
          'storage-type': 'SSD',
          'size': '400GB',
          'free-tier-applied': '20GB',
          'billed-size': '380GB',
          'price_per_gb': '0.4元/月',
          'matched_strategy_id': 'none (标准价)'
        }),
        billingType: 'PAY_AS_YOU_GO',
        start: String(Date.now() - 10 * 24 * 3600 * 1000),
        end: String(Date.now() + 20 * 24 * 3600 * 1000),
        resources: [
          { name: 'nas-storage-dev', id: 'res-file-ssd-001' }
        ]
      }
    ]
  }
}

// 模拟账单列表
export const mockBills: Record<string, any[]> = {
  'user-3': [
    {
      billId: 'bill-20260601-0001',
      orderId: 'ord-20260601-0001',
      productName: 'zestu-container-instance',
      billingType: 'SUBSCRIPTION_MONTHLY',
      type: 'CHARGE',
      amountDue: '2400.00',
      billingCycle: {
        startTimestamp: String(Date.now() - 3600 * 1000),
        endTimestamp: String(Date.now() - 3600 * 1000 + 30 * 24 * 3600 * 1000)
      }
    },
    {
      billId: 'bill-20260520-0002',
      orderId: 'ord-20260520-0002',
      productName: 'zestu-file-storage',
      billingType: 'PAY_AS_YOU_GO',
      type: 'CHARGE',
      amountDue: '160.00',
      billingCycle: {
        startTimestamp: String(Date.now() - 10 * 24 * 3600 * 1000),
        endTimestamp: String(Date.now() + 20 * 24 * 3600 * 1000)
      }
    }
  ]
}

// 模拟收支明细
export const mockTransactions: Record<string, any[]> = {
  'user-3': [
    {
      transactionId: 'tx-20260601-001',
      transactionType: 'CONSUMPTION',
      amount: '2400.00',
      paymentMethod: 'BALANCE',
      status: 'SUCCESS',
      createdAtTimestamp: String(Date.now() - 3600 * 1000),
      username: 'SubAccount_ShenN',
      description: '购买 4090 容器实例费用扣除（已享 8 折优惠）'
    },
    {
      transactionId: 'tx-20260525-002',
      transactionType: 'RECHARGE',
      amount: '3000.00',
      paymentMethod: 'CORPORATE_TRANSFER',
      status: 'SUCCESS',
      createdAtTimestamp: String(Date.now() - 7 * 24 * 3600 * 1000),
      username: 'SubAccount_ShenN',
      description: '对公网银电子转账充值到账'
    },
    {
      transactionId: 'tx-20260520-003',
      transactionType: 'CONSUMPTION',
      amount: '160.00',
      paymentMethod: 'BALANCE',
      status: 'SUCCESS',
      createdAtTimestamp: String(Date.now() - 10 * 24 * 3600 * 1000),
      username: 'SubAccount_ShenN',
      description: '文件共享存储服务月账单结算扣款'
    }
  ]
}

// 模拟月账单列表
export const mockMonthlyBills: Record<string, any[]> = {
  'user-3': [
    {
      billingMonth: '2026-05',
      amountDue: '160.00',
      cashPay: '160.00',
      voucherPay: '0.00',
      arrears: '0.00',
      isPaid: true
    },
    {
      billingMonth: '2026-06',
      amountDue: '2400.00',
      cashPay: '2250.00',
      voucherPay: '150.00',
      arrears: '0.00',
      isPaid: true
    }
  ]
}

export let discountRateAutoIncrement = 7

export const mockChannelDomains = [
  'partner.d.run',
  'enterprise.d.run',
  'edu.d.run',
]

export const mockDiscountRateRules: any[] = [
  {
    id: '1',
    name: '全局通用八折',
    enabled: true,
    discountRate: '0.80',
    mainAccount: 'admin',
    skuId: 'sku-101',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '2',
    name: '渠道专享七五折',
    enabled: true,
    discountRate: '0.75',
    mainAccount: 'DaoCloud_Partner',
    skuId: 'sku-102',
    timePeriods: [{ start: '2026-06-01T00:00:00Z', end: '2026-06-02T23:59:59Z', timeStart: '08:00:00', timeEnd: '18:00:00' }],
  },
  {
    id: '3',
    name: '大客户专属折扣',
    enabled: true,
    discountRate: '0.85',
    mainAccount: 'SubAccount_ShenN',
    skuId: 'sku-102',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '4',
    name: '六月限时促销',
    enabled: true,
    discountRate: '0.60',
    mainAccount: 'DaoCloud_Partner',
    skuId: 'sku-101',
    timePeriods: [{ start: '2026-06-01T00:00:00Z', end: '2026-06-30T23:59:59Z' }],
  },
  {
    id: '5',
    name: '待启用草稿规则',
    enabled: false,
    discountRate: '0.90',
    mainAccount: 'admin',
    skuId: 'sku-102',
    timePeriods: [{ start: 'now', end: 'forever' }],
  },
  {
    id: '6',
    name: '每日高峰期九折',
    enabled: true,
    discountRate: '0.90',
    mainAccount: 'SubAccount_ShenN',
    skuId: 'sku-101',
    timePeriods: [{ start: 'now', end: 'forever', timeStart: '09:00:00', timeEnd: '18:00:00' }],
  },
]
