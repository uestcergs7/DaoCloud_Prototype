import { api } from './api'

// Define types based on leopardapi/order.swagger.json

export interface Order {
  username?: string
  orderId?: string
  createdAtTimestamp?: string
  orderType?: 'PURCHASE' | 'REFUND' | 'UPGRADE' | 'DOWNGRADE' | 'TRANSFORM'
  productName?: string
  resources?: unknown[]
  orderStatus?: 'PAID' | 'PARTIAL' | 'INVALIDATED'
  orderPrice?: string
  amountDue?: string
  userId?: string
}

export interface ListOrdersParams {
  orderId?: string
  resourceId?: string
  orderType?: string
  productName?: string
  orderStatus?: string
  start?: string // uint64 string
  end?: string // uint64 string
  page?: number
  pageSize?: number
  username?: string
}

export interface ListOrdersResponse {
  items: Order[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

export interface Transaction {
  username?: string
  serialNumber?: string
  transactionTimestamp?: string
  paymentType?: 'Income' | 'Expense'
  transactionType?: 'Consume' | 'Charge'
  transactionChannel?: 'Balance' | 'Alipay' | 'Wechat' | 'Corporate_Transfer'
  amount?: string
  balance?: string
  billingId?: string
  userId?: string
}

export interface ListTransactionsParams {
  start?: string
  end?: string
  page?: number
  pageSize?: number
  serialNumber?: string
  billingId?: string
  paymentType?: string
  transactionType?: string
  transactionChannel?: string
  username?: string
}

export interface ListTransactionsResponse {
  items: Transaction[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

export interface Bill {
  username?: string
  billId?: string
  billingCycle?: {
    startTimestamp?: string
    endTimestamp?: string
  }
  billingMonth?: string
  productName?: string
  resources?: { name?: string; id?: string }[]
  billingType?: 'PAY_AS_YOU_GO' | 'SUBSCRIPTION_DAILY' | 'SUBSCRIPTION_WEEKLY' | 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_YEARLY'
  unitPrice?: string
  unit?: string
  orderId?: string
  orderPrice?: string
  couponPayment?: string
  amountDue?: string
  voucherPayment?: string
  type?: 'CONSUME' | 'REFUND'
  userId?: string
}

export interface ListBillsParams {
  start?: string
  end?: string
  page?: number
  pageSize?: number
  billId?: string
  orderId?: string
  resourceId?: string
  billingType?: string
  productName?: string
  username?: string
}

export interface ListBillsResponse {
  items: Bill[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

// Ensure we point to the correct proxy target if needed,
// but for now relying on the standard api instance which likely points to /api
// The proxy config in vite.config.ts maps /api/leopard -> leopard target.
// The swagger path is /apis/leopard.io/v1alpha1/orders
// So the full URL should be /api/leopard/apis/leopard.io/v1alpha1/orders

export const fetchOrders = async (params: ListOrdersParams) => {
  const { data } = await api.get<ListOrdersResponse>('/orders', {
    params,
  })
  return data
}

export const fetchTransactions = async (params: ListTransactionsParams) => {
  const { data } = await api.get<ListTransactionsResponse>('/transactions', {
    params,
  })
  return data
}

export const fetchBills = async (params: ListBillsParams) => {
  const { data } = await api.get<ListBillsResponse>('/bills', {
    params,
  })
  return data
}

export interface BatchCreateVouchersRequest {
  description?: string
  totalAmount?: string
  effectiveDays?: number
  quantity?: number
  regions?: string[]
  expireTimestamp?: string
}

export interface BatchCreateVouchersResponse {
  voucherIds: string[]
}

export const batchCreateVouchers = async (data: BatchCreateVouchersRequest) => {
  const { data: response } = await api.post<BatchCreateVouchersResponse>(
    '/vouchers/batch-create',
    data
  )
  return response
}

export interface Voucher {
  voucherId?: string
  description?: string
  status?: 'Active' | 'UsedUp' | 'Expired'
  totalAmount?: string
  remainingAmount?: string
  regions?: string[]
  products?: string[]
  orderTypes?: string[]
  effectTimestamp?: string
  expireTimestamp?: string
}

export interface ListVouchersParams {
  voucherId?: string
  page?: number
  pageSize?: number
}

export interface ListVouchersResponse {
  items: Voucher[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

export const listActiveVouchers = async (params: ListVouchersParams) => {
  const { data } = await api.get<ListVouchersResponse>('/vouchers/active', {
    params,
  })
  return data
}

// 对公转账充值

export interface PaymentSourceInfo {
  accountName?: string  // 汇款账户名称
  bankAccount?: string  // 汇款银行账号
  bankName?: string     // 开户银行
}

export interface CorporateTransferRechargeRequest {
  userId: string        // 充值用户ID
  amount: string        // 充值金额，单位分
  serialNumber: string  // 银行交易流水号
  message?: string      // 备注信息
  paymentSourceInfo?: PaymentSourceInfo
}

export const corporateTransferRecharge = async (data: CorporateTransferRechargeRequest) => {
  const { data: response } = await api.post(
    '/wallet/corporate-transfer/recharge',
    data
  )
  return response
}
