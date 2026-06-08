import { useState, useEffect, useCallback } from 'react'
import {
  Typography, Button, Space, Row, Table, Tag, Modal, Form, Input,
  Select, Switch, DatePicker, Dropdown, App, Radio, TimePicker, Drawer,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, DownOutlined, ExclamationCircleOutlined, UpOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DiscountRateRule, TimePeriodItem } from '@/types/discountRate'
import {
  fetchDiscountRateRules,
  createDiscountRateRule,
  updateDiscountRateRule,
  deleteDiscountRateRule,
} from '@/services/discountRate'
import axios from 'axios'

const { Title } = Typography


// ========== 辅助方法：拆分逗号字符串并检查是否有交集 ==========
function hasOverlap(val1: string, val2: string): boolean {
  const set1 = new Set(val1.split(',').filter(Boolean))
  const set2 = new Set(val2.split(',').filter(Boolean))
  for (const item of set1) {
    if (set2.has(item)) return true
  }
  return false
}

// ========== 时间段重合校验 ==========
function checkTimePeriodsOverlap(tp1: TimePeriodItem, tp2: TimePeriodItem): boolean {
  const isCycle1 = tp1.timeStart !== undefined && tp1.timeEnd !== undefined
  const isCycle2 = tp2.timeStart !== undefined && tp2.timeEnd !== undefined

  const getDayjsTime = (val: string) => {
    if (val === 'now') return dayjs()
    if (val === 'forever') return dayjs('9999-12-31T23:59:59')
    return dayjs(val)
  }

  const getDayjsDate = (val: string) => {
    if (val === 'now') return dayjs().startOf('day')
    if (val === 'forever') return dayjs('9999-12-31')
    return dayjs(val).startOf('day')
  }

  const timeStringToMinutes = (timeStr: string) => {
    const parts = timeStr.split(':')
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  }

  if (!isCycle1 && !isCycle2) {
    // Both are Absolute
    const s1 = getDayjsTime(tp1.start)
    const e1 = getDayjsTime(tp1.end)
    const s2 = getDayjsTime(tp2.start)
    const e2 = getDayjsTime(tp2.end)
    return (s1.isBefore(e2) || s1.isSame(e2)) && (s2.isBefore(e1) || s2.isSame(e1))
  }

  if (isCycle1 && isCycle2) {
    // Both are Cycle
    const ds1 = getDayjsDate(tp1.start)
    const de1 = getDayjsDate(tp1.end)
    const ds2 = getDayjsDate(tp2.start)
    const de2 = getDayjsDate(tp2.end)
    const dateOverlap = (ds1.isBefore(de2) || ds1.isSame(de2)) && (ds2.isBefore(de1) || ds2.isSame(de1))

    if (!dateOverlap) return false

    const ts1 = timeStringToMinutes(tp1.timeStart!)
    const te1 = timeStringToMinutes(tp1.timeEnd!)
    const ts2 = timeStringToMinutes(tp2.timeStart!)
    const te2 = timeStringToMinutes(tp2.timeEnd!)
    return ts1 <= te2 && ts2 <= te1
  }

  // One is Absolute, one is Cycle
  const abs = !isCycle1 ? tp1 : tp2
  const cyc = isCycle1 ? tp1 : tp2

  const s_abs = getDayjsTime(abs.start)
  const e_abs = getDayjsTime(abs.end)

  const ds_cyc = getDayjsDate(cyc.start)
  const de_cyc = getDayjsDate(cyc.end)

  const ds_abs = s_abs.startOf('day')
  const de_abs = e_abs.startOf('day')

  // Find overlap of date ranges
  const overlapStart = ds_abs.isAfter(ds_cyc) ? ds_abs : ds_cyc
  const overlapEnd = de_abs.isBefore(de_cyc) ? de_abs : de_cyc

  if (overlapStart.isAfter(overlapEnd)) return false

  // If the overlap of dates spans more than 2 days, they definitely overlap
  if (overlapEnd.diff(overlapStart, 'day') >= 2) return true

  // Check the specific days (overlapStart and overlapEnd)
  const ts_cyc = timeStringToMinutes(cyc.timeStart!)
  const te_cyc = timeStringToMinutes(cyc.timeEnd!)

  const daysToCheck = [overlapStart]
  if (!overlapEnd.isSame(overlapStart, 'day')) {
    daysToCheck.push(overlapEnd)
  }

  for (const d of daysToCheck) {
    const start_min = s_abs.isAfter(d.startOf('day')) ? (s_abs.hour() * 60 + s_abs.minute()) : 0
    const end_min = e_abs.isBefore(d.endOf('day')) ? (e_abs.hour() * 60 + e_abs.minute()) : 1440
    if (start_min <= te_cyc && ts_cyc <= end_min) {
      return true
    }
  }

  return false
}

// ========== 冲突规则检测 ==========
function checkDiscountRuleConflict(
  rule: Partial<DiscountRateRule>,
  allRules: DiscountRateRule[],
  excludeId?: string
): boolean {
  if (!rule.enabled) return false

  return allRules.some((r) => {
    if (r.id === excludeId) return false
    if (!r.enabled) return false

    // Check same mainAccount and same skuId (handles potential legacy multi-value split)
    if (hasOverlap(r.mainAccount, rule.mainAccount || '') && hasOverlap(r.skuId, rule.skuId || '')) {
      const rulePeriods = rule.timePeriods || []
      const existingPeriods = r.timePeriods || []
      for (const tp1 of rulePeriods) {
        for (const tp2 of existingPeriods) {
          if (checkTimePeriodsOverlap(tp1, tp2)) {
            return true
          }
        }
      }
    }
    return false
  })
}

// ========== 副本名称解析 ==========
function parseBaseName(name: string): { baseName: string } {
  const match = name.match(/^(.+)-副本\d+$/)
  return { baseName: match ? match[1] : name }
}

function getNextCopyName(baseName: string, allRules: DiscountRateRule[]): string {
  let maxNum = 0
  for (const r of allRules) {
    const match = r.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-副本(\\d+)$`))
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10))
    }
  }
  return `${baseName}-副本${maxNum + 1}`
}

// ========== 步进器辅助组件 (数字在前，上下排列的加减按钮在后) ==========
function Stepper({
  value,
  onChange,
  onUp,
  onDown,
  width,
  maxLength,
}: {
  value: string
  onChange: (val: string) => void
  onUp: () => void
  onDown: () => void
  width: number
  maxLength: number
}) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      backgroundColor: '#fff',
      overflow: 'hidden',
      height: 32,
    }}>
      <Input
        style={{
          width,
          textAlign: 'center',
          border: 'none',
          boxShadow: 'none',
          padding: '4px 8px',
        }}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        borderLeft: '1px solid #d9d9d9',
        height: '100%',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
      }}>
        <button
          type="button"
          onClick={onUp}
          style={{
            height: 15,
            width: 22,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #d9d9d9',
            padding: 0,
            outline: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <UpOutlined style={{ fontSize: 7, color: '#666' }} />
        </button>
        <button
          type="button"
          onClick={onDown}
          style={{
            height: 15,
            width: 22,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            outline: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <DownOutlined style={{ fontSize: 7, color: '#666' }} />
        </button>
      </div>
    </div>
  )
}

// ========== 折扣率拆分输入组件 ==========
function DiscountRateInput({
  value,
  onChange,
}: {
  value?: string
  onChange?: (val: string) => void
}) {
  const parts = (value || '0.00').split('.')
  const [intPart, setIntPart] = useState(parts[0] || '0')
  const [decPart, setDecPart] = useState(parts[1] || '00')

  useEffect(() => {
    const p = (value || '0.00').split('.')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntPart(p[0] || '0')
    setDecPart(p[1] || '00')
  }, [value])

  const emit = (i: string, d: string) => {
    let intVal = parseInt(i, 10) || 0
    if (intVal < 0) intVal = 0
    if (intVal > 1) intVal = 1
    
    let nextDec = d
    if (intVal === 1) {
      nextDec = '00'
    }
    
    const padded = nextDec.length === 1 ? nextDec + '0' : nextDec || '00'
    onChange?.(`${intVal}.${padded}`)
  }

  const changeInt = (diff: number) => {
    const current = parseInt(intPart, 10) || 0
    let next = current + diff
    if (next < 0) next = 0
    if (next > 1) next = 1
    
    let nextDec = decPart
    if (next === 1) {
      nextDec = '00'
      setDecPart('00')
    }
    setIntPart(String(next))
    emit(String(next), nextDec)
  }

  const changeDec = (diff: number) => {
    if (intPart === '1') {
      return
    }
    const current = parseInt(decPart, 10) || 0
    let next = current + diff
    if (next < 0) next = 0
    if (next > 99) next = 99
    const nextStr = String(next).padStart(2, '0')
    setDecPart(nextStr)
    emit(intPart, nextStr)
  }

  return (
    <Space size={4} align="center">
      <Stepper
        value={intPart}
        onChange={(v) => {
          const cleaned = v.replace(/\D/g, '').slice(0, 1)
          let nextInt = cleaned || '0'
          if (nextInt !== '0' && nextInt !== '1') {
            nextInt = '0'
          }
          setIntPart(nextInt)
          if (nextInt === '1') {
            setDecPart('00')
            emit(nextInt, '00')
          } else {
            emit(nextInt, decPart)
          }
        }}
        onUp={() => changeInt(1)}
        onDown={() => changeInt(-1)}
        width={45}
        maxLength={1}
      />
      <span style={{ fontSize: 18, fontWeight: 'bold', margin: '0 2px', userSelect: 'none' }}>.</span>
      <Stepper
        value={decPart}
        onChange={(v) => {
          const cleaned = v.replace(/\D/g, '').slice(0, 2)
          if (intPart === '1') {
            setDecPart('00')
            emit('1', '00')
          } else {
            setDecPart(cleaned)
            emit(intPart, cleaned)
          }
        }}
        onUp={() => changeDec(1)}
        onDown={() => changeDec(-1)}
        width={55}
        maxLength={2}
      />
    </Space>
  )
}

// ========== 删除确认弹窗 ==========
function DeleteConfirmModal({
  open,
  ruleName,
  onConfirm,
  onCancel,
  annotationMode,
  onBadgeClick,
}: {
  open: boolean
  ruleName: string
  onConfirm: () => void
  onCancel: () => void
  annotationMode: boolean
  onBadgeClick?: (id: number) => void
}) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setInputValue('')
  }, [open])

  return (
    <Modal
      title="确认删除"
      open={open}
      onCancel={onCancel}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        annotationMode && (
          <span
            key="delete-badge"
            onClick={() => onBadgeClick?.(8)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: '#fa8c16',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              cursor: 'pointer',
              animation: 'annotation-pulse 2s infinite',
              marginRight: 12,
              marginLeft: 4,
              verticalAlign: 'middle',
              boxShadow: '0 0 0 2px rgba(250, 140, 22, 0.2)',
            }}
          >
            8
          </span>
        ),
        <Button
          key="delete"
          danger
          type="primary"
          disabled={inputValue !== ruleName}
          onClick={onConfirm}
        >
          确认删除
        </Button>,
      ]}
    >
      <p>您正在删除折扣率规则：<strong>{ruleName}</strong></p>
      <p>请输入规则名称以确认删除：</p>
      <Input
        placeholder="请输入规则名称以确认删除"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </Modal>
  )
}

// ========== 辅助方法：计算 Select 动态宽度以实现横向自适应扩展 ==========
function getSelectWidth(selectedList: string[]): number {
  if (!selectedList || selectedList.length === 0) return 140
  
  const displayedItems = selectedList.slice(0, selectedList.length <= 3 ? selectedList.length : 2)
  
  let totalTagWidth = 0
  displayedItems.forEach(item => {
    // 字符平均宽度估算为 7.5px，加上 Tag 组件的 padding/关闭按钮/margin 约 36px
    totalTagWidth += item.length * 7.5 + 36
  })
  
  if (selectedList.length > 3) {
    // 加上 +X 标签的宽度（大约 40px）
    totalTagWidth += 40
  }
  
  // Select 外壳 padding、清空按钮与下拉箭头的预留宽度（约 48px），加上 12px 的安全余量
  const computedWidth = totalTagWidth + 48 + 12
  
  // 限制宽度范围在 140px 到 450px 之间
  return Math.max(140, Math.min(450, Math.round(computedWidth)))
}

// ========== 主页面 ==========
export default function DiscountRulesPage() {
  const { modal, message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [nextId, setNextId] = useState<string>('7')

  // Modal 状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingRule, setEditingRule] = useState<DiscountRateRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // 时间段选择状态: absolute (指定时间范围), cycle (每日固定时间段)
  const [timePeriodType, setTimePeriodType] = useState<'absolute' | 'cycle'>('absolute')

  // 多时间段状态列表
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timePeriodsList, setTimePeriodsList] = useState<any[]>([
    {
      startType: 'now',
      startTime: null,
      endType: 'forever',
      endTime: null,
      cycleDateStartType: 'now',
      cycleDateStartTime: null,
      cycleDateEndType: 'forever',
      cycleDateEndTime: null,
      cycleTime: null
    }
  ])

  // 批注模式相关状态
  const [annotationMode, setAnnotationMode] = useState(false)
  const [annotationDrawerOpen, setAnnotationDrawerOpen] = useState(false)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number>(1)

  // 删除确认弹窗
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingRule, setDeletingRule] = useState<DiscountRateRule | null>(null)

  // 下拉选项数据
  const [mockUsers, setMockUsers] = useState<{ label: string; value: string }[]>([])
  const [mockSkus, setMockSkus] = useState<{ label: string; value: string }[]>([])

  // 全量数据（用于重复校验 & 副本命名 & 本地搜索过滤）
  const [allRules, setAllRules] = useState<DiscountRateRule[]>([])

  // 搜索过滤状态
  const [filterName, setFilterName] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAccounts, setFilterAccounts] = useState<string[]>([])
  const [filterSkus, setFilterSkus] = useState<string[]>([])

  // 根据当前过滤条件与分页，计算在 Table 中实际显示的数据
  const filteredRules = allRules.filter((rule) => {
    // 1. 折扣规则名称模糊搜索
    if (filterName && !rule.name.toLowerCase().includes(filterName.toLowerCase())) {
      return false
    }
    // 2. 状态筛选
    if (filterStatus && filterStatus !== 'all') {
      const isEnabled = filterStatus === 'enabled'
      if (rule.enabled !== isEnabled) {
        return false
      }
    }
    // 3. 主账号多选筛选 (规则的主账号在已选择的账号列表中，支持多选筛选，对逗号分隔的数据做交集判定)
    if (filterAccounts && filterAccounts.length > 0) {
      const ruleAccs = rule.mainAccount.split(',').filter(Boolean)
      if (!ruleAccs.some((acc) => filterAccounts.includes(acc))) {
        return false
      }
    }
    // 4. SKU 多选筛选 (规则的 SKU 在已选择的 SKU 列表中，支持多选筛选，对逗号分隔的数据做交集判定)
    if (filterSkus && filterSkus.length > 0) {
      const ruleSkus = rule.skuId.split(',').filter(Boolean)
      if (!ruleSkus.some((sku) => filterSkus.includes(sku))) {
        return false
      }
    }
    return true
  })

  const displayData = filteredRules.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  )

  // 注入批注模式脉冲动画的样式
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `
      @keyframes annotation-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.6);
          transform: scale(1);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(250, 140, 22, 0);
          transform: scale(1.1);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(250, 140, 22, 0);
          transform: scale(1);
        }
      }
      .horizontal-select .ant-select-selection-overflow {
        flex-wrap: nowrap !important;
        overflow: hidden !important;
      }
    `
    document.head.appendChild(styleEl)
    return () => {
      document.head.removeChild(styleEl)
    }
  }, [])

  // 批注卡片数据定义
  const ANNOTATIONS = [
    {
      id: 1,
      title: '折扣率管理背景与目标',
      prdRef: 'PRD 第 1 & 2 节',
      content: (
        <div>
          <p><strong>业务背景</strong>：Leopard 计费系统此前仅能在编辑 SKU 时手动绑定折扣 ID，缺少统一管理视图，无法全盘查看、创建和管控折扣策略，也无法直观地了解每条规则的生效范围。</p>
          <p style={{ marginTop: 8 }}><strong>业务目标</strong>：提供统一的管理后台，支持多维定向条件的折扣规则创建、安全编辑、快捷复制、冲突拦截以及防误删控制。</p>
          <p style={{ marginTop: 8 }}><strong>菜单入口</strong>：位于左侧导航「产品管理」分组最末项。</p>
        </div>
      ),
    },
    {
      id: 2,
      title: '新增规则与 ID 自增',
      prdRef: 'PRD 第 3.1.1 & 3.2.1 节',
      content: (
        <div>
          <p><strong>操作说明</strong>：点击右上角「添加」按钮打开新建弹窗。</p>
          <p style={{ marginTop: 8 }}><strong>ID 自动生成</strong>：ID 格式为纯自增数字（如 <code>1</code>, <code>2</code>, <code>3</code>），由后台系统唯一自增分配，前端不可编辑，且已被物理删除的旧 ID 绝不会重复回收利用，实现审计安全性。</p>
          <p style={{ marginTop: 8 }}><strong>初始状态</strong>：新建的规则默认处于「停用」状态，避免直接影响线上计费，保障系统安全。</p>
        </div>
      ),
    },
    {
      id: 3,
      title: '折扣率分段步进与 0.00-1.00 闭区间限制',
      prdRef: 'PRD 第 3.2.2 节',
      content: (
        <div>
          <p><strong>数值规范</strong>：折扣率以小数表述，精确到小数点后两位，限制在 <code>0.00</code> ~ <code>1.00</code> 闭区间内。</p>
          <p style={{ marginTop: 8 }}><strong>步进输入设计</strong>：提供精美一体的左右步进调节按钮。整数部分点击可加减 1；小数部分点击可步进加减 1 位（例如在 79 点击 + 变 80），防错能力拉满。</p>
          <p style={{ marginTop: 8 }}><strong>区间联动锁定</strong>：若整数部分被设为 <code>1</code>（即折扣率 <code>1.00</code>），小数部分会自动重置并锁定为 <code>00</code>，且小数位修改功能锁定，防止输入越界值。</p>
          <p style={{ marginTop: 8 }}><strong>自动补零补全</strong>：如果小数位只手动输入了 1 位（例如输入 <code>7</code>），系统在失去焦点（onBlur）或最终提交时会自动补 <code>0</code> 变 <code>70</code>（即折扣率 <code>0.70</code>），提升输入容错率。</p>
        </div>
      ),
    },
    {
      id: 4,
      title: '规则生效多维定向条件与命名规范',
      prdRef: 'PRD 第 3.2.1 节',
      content: (
        <div>
          <p><strong>单选定向维度</strong>：支持指定 <code>主账号</code> 和 <code>SKU</code> 组合进行**单选**定向生效。主账号和 SKU 均为必填项，且不允许设为“不限”。</p>
          <p style={{ marginTop: 8 }}><strong>下拉数据源格式</strong>：</p>
          <ul>
            <li>主账号：模糊搜索并匹配 Ghippo 用户列表，已统一展示并提交为英文 <code>username</code>（如 <code>admin</code>、<code>DaoCloud_Partner</code>），确保与列表视觉统一。</li>
            <li>SKU：模糊搜索并匹配 SKU 标识，已统一展示并提交为 SKU 编号 ID（如 <code>sku-101</code>，去除了中文描述前缀），保持视觉整齐划一。</li>
          </ul>
        </div>
      ),
    },
    {
      id: 5,
      title: '时间段控制与单时间段规范',
      prdRef: 'PRD 第 3.1.1 & 3.2.1 节',
      content: (
        <div>
          <p><strong>双类型模式</strong>：时间段设置统一为两个选项：</p>
          <ul>
            <li><strong>指定时间范围</strong>：可选具体日期时间，或快捷勾选开始为“现在”、结束为“永久”。</li>
            <li><strong>每日固定时间段</strong>：支持设置生效 of 日期范围（可勾选“现在”/“永久”），以及每日生效的循环时间段（步长15分钟）。</li>
          </ul>
          <p style={{ marginTop: 8 }}><strong>单时间段限制</strong>：每个折扣规则仅允许配置一个生效时间段，不再支持添加多个时段，防止配置歧义。</p>
        </div>
      ),
    },
    {
      id: 6,
      title: '复制规则与副本命名算法',
      prdRef: 'PRD 第 3.4 节',
      content: (
        <div>
          <p><strong>一键复制</strong>：点击列表操作列的「复制」按钮，系统会基于当前规则的核心业务条件，立即克隆一条新数据，且初始状态固定为安全「停用」。</p>
          <p style={{ marginTop: 8 }}><strong>副本命名算法</strong>：系统会自动识别基础名称并扫描全局最大副本序号：</p>
          <ul>
            <li>复制 <code>规则A</code> &rarr; 生成 <code>规则A-副本1</code></li>
            <li>再次复制 <code>规则A</code> 或复制 <code>规则A-副本1</code> &rarr; 自动识别基础名，自增生成 <code>规则A-副本2</code>，规避 <code>规则A-副本1-副本1</code> 这种逆天层级。</li>
          </ul>
          <p style={{ marginTop: 8 }}><strong>启用限制</strong>：由于克隆出的副本条件与原规则完全相同，若不做编辑直接启用会被冲突拦截，必须编辑并修改至少一个业务字段后方可激活启用。</p>
        </div>
      ),
    },
    {
      id: 7,
      title: '冲突拦截与时间重合校验',
      prdRef: 'PRD 第 3.7 节',
      content: (
        <div>
          <p><strong>时间重合拦截</strong>：为了防止计费冲突，系统会校验同一“主账号 + SKU”的启用规则在时间段上不能重叠。</p>
          <p style={{ marginTop: 8 }}><strong>时间轴交叉比对</strong>：支持对“绝对时间”与“每日循环时间”进行智能混合重叠判定，一旦检测到相同账号/SKU的启用规则在时间段上有重合，则弹窗警告并阻断操作。</p>
          <p style={{ marginTop: 8 }}><strong>触发场景</strong>：新建保存（设为启用时）、编辑保存（设为启用时）或一键启用已停用的规则时均会触发校验。创建时若选择“停用”则免检。</p>
        </div>
      ),
    },
    {
      id: 8,
      title: '安全防误删确认机制',
      prdRef: 'PRD 第 3.6 节',
      content: (
        <div>
          <p><strong>安全考量</strong>：防止运营人员误将线上正在生效的折扣规则删除，导致绑定客户的费用结算无征兆恢复原价从而引发账单客诉。</p>
          <p style={{ marginTop: 8 }}><strong>居中提醒</strong>：所有删除、二次取消框均采用**完美居中对齐方式**，视觉焦点更加稳重。</p>
          <p style={{ marginTop: 8 }}><strong>确认机制</strong>：点击「删除」后弹出二次防误删输入窗，必须在输入框中完整拼写并录入该规则的名称。</p>
        </div>
      ),
    },
    {
      id: 9,
      title: '取消创建与数据二次防丢',
      prdRef: 'PRD 第 3.2.4 节',
      content: (
        <div>
          <p><strong>体验守护</strong>：考虑到折扣规则包含很多繁杂的多维搜索下拉条件（如主账号、SKU 等），为了防止运营人员填写了一大堆内容后，因为不小心点到弹窗外部空白区域、右上角“X”或下方的“取消”导致数据丢失，从而引发二次录入烦恼。</p>
          <p style={{ marginTop: 8 }}><strong>居中提示</strong>：二次确认框均会在**画面正中心**展示，点击确定后方可丢弃数据并真正关闭弹窗。</p>
        </div>
      ),
    },
    {
      id: 10,
      title: '极值折扣率（0.00/1.00）启用二次确认',
      prdRef: '新增安全审计需求',
      content: (
        <div>
          <p><strong>防高危操作机制</strong>：为防止误操作导致损失或结算问题，设定折扣率为极值（<code>0.00</code> 完全免费，或 <code>1.00</code> 恢复原价）在提交保存启用或在列表启用时，均会弹出二次确认确认框：</p>
          <ul>
            <li><code>0.00</code> 警告：<code>当前折扣率为 0.00，启用后该主账号下该 SKU 在生效时间段内将免费提供服务。是否确认启用？</code></li>
            <li><code>1.00</code> 警告：<code>当前折扣率为 1.00，启用后该主账号下该 SKU 在生效时间段内将按原价计费。是否确认启用？</code></li>
          </ul>
        </div>
      ),
    },
    {
      id: 11,
      title: '列表高级筛选与宽度自适应拉伸',
      prdRef: '新增体验优化需求',
      content: (
        <div>
          <p><strong>检索多维支持</strong>：列表顶部新增规则名称模糊搜索、启用/停用状态单选、主账号搜索多选以及 SKU 搜索多选四大筛选框。</p>
          <p style={{ marginTop: 8 }}><strong>标签防抖与自适应</strong>：多选框选择 3 个以内全显，3 个以上第 3 个开始以 <code>+X</code> 折叠。组件内部强制不换行，宽度自适应所选标签长度横向扩展（140px~450px），防止因换行导致列表抖动与高度变化。</p>
        </div>
      ),
    },
  ]

  // 渲染批注 Badge 的辅助组件
  const AnnotationBadge = ({
    number,
    style,
  }: {
    number: number
    style?: React.CSSProperties
  }) => {
    return (
      <span
        onClick={(e) => {
          e.stopPropagation()
          setSelectedAnnotationId(number)
          setAnnotationDrawerOpen(true)
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#fa8c16',
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: 'pointer',
          animation: 'annotation-pulse 2s infinite',
          marginLeft: 6,
          verticalAlign: 'middle',
          userSelect: 'none',
          boxShadow: '0 0 0 2px rgba(250, 140, 22, 0.2)',
          ...style,
        }}
      >
        {number}
      </span>
    )
  }

  // ---- 加载列表 ----
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchDiscountRateRules(1, 10000)
      setAllRules(res.items || [])
      setPagination(prev => ({ ...prev, total: (res.items || []).length }))
      if (res.nextId) {
        setNextId(res.nextId)
      }
    } catch {
      message.error('获取折扣率规则列表失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  // ---- 加载下拉选项 ----
  useEffect(() => {
    loadData()
    // 加载用户列表（复用 ghippo mock 接口）
    axios.get('/api/ghippo/users?page=1&pageSize=100').then((res) => {
      const users = (res.data.items || []).map((u: { username: string; name?: string }) => ({ label: u.username, value: u.username }))
      setMockUsers(users)
    }).catch(() => {})
    // 加载 SKU 列表（容器实例为例）
    axios.post('/api/leopard/products/skus', { product: 'zestu-container-instance', page: 1, pageSize: 100 }).then((res) => {
      const skus = (res.data.items || []).map((s: { id: string; specName?: string }) => ({ label: s.id, value: s.id }))
      setMockSkus(skus)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- 打开新增 Modal ----
  const handleAdd = () => {
    setModalMode('add')
    setEditingRule(null)
    setTimePeriodType('absolute')
    setTimePeriodsList([{
      startType: 'now',
      startTime: null,
      endType: 'forever',
      endTime: null,
      cycleDateStartType: 'now',
      cycleDateStartTime: null,
      cycleDateEndType: 'forever',
      cycleDateEndTime: null,
      cycleTime: null
    }])
    form.resetFields()
    form.setFieldsValue({
      enabled: false,
      discountRate: '0.80',
    })
    setModalOpen(true)
  }

  // ---- 打开编辑 Modal ----
  const handleEdit = (record: DiscountRateRule) => {
    setModalMode('edit')
    setEditingRule(record)
    form.resetFields()
    form.setFieldsValue({
      name: record.name,
      enabled: record.enabled,
      discountRate: record.discountRate,
      mainAccount: record.mainAccount ? record.mainAccount.split(',').filter(Boolean)[0] : undefined,
      skuId: record.skuId ? record.skuId.split(',').filter(Boolean)[0] : undefined,
    })

    if (record.timePeriods && record.timePeriods.length > 0) {
      const first = record.timePeriods[0]
      const isCycle = first.timeStart !== undefined
      setTimePeriodType(isCycle ? 'cycle' : 'absolute')

      const converted = record.timePeriods.map((tp) => {
        if (isCycle) {
          return {
            cycleDateStartType: tp.start === 'now' ? 'now' : 'custom',
            cycleDateStartTime: tp.start === 'now' ? null : dayjs(tp.start),
            cycleDateEndType: tp.end === 'forever' ? 'forever' : 'custom',
            cycleDateEndTime: tp.end === 'forever' ? null : dayjs(tp.end),
            cycleTime: (tp.timeStart && tp.timeEnd) ? [
              dayjs(`2026-06-01 ${tp.timeStart}`, 'YYYY-MM-DD HH:mm:ss'),
              dayjs(`2026-06-01 ${tp.timeEnd}`, 'YYYY-MM-DD HH:mm:ss'),
            ] : null
          }
        } else {
          return {
            startType: tp.start === 'now' ? 'now' : 'custom',
            startTime: tp.start === 'now' ? null : dayjs(tp.start),
            endType: tp.end === 'forever' ? 'forever' : 'custom',
            endTime: tp.end === 'forever' ? null : dayjs(tp.end)
          }
        }
      })
      setTimePeriodsList(converted)
    } else {
      setTimePeriodType('absolute')
      setTimePeriodsList([{
        startType: 'now',
        startTime: null,
        endType: 'forever',
        endTime: null,
        cycleDateStartType: 'now',
        cycleDateStartTime: null,
        cycleDateEndType: 'forever',
        cycleDateEndTime: null,
        cycleTime: null
      }])
    }
    setModalOpen(true)
  }

  // ---- 取消（二次确认，完美居中） ----
  const handleCancel = () => {
    modal.confirm({
      title: '确认',
      icon: <ExclamationCircleOutlined />,
      content: '您是否要取消创建？',
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        setModalOpen(false)
        form.resetFields()
      },
    })
  }

  // ---- 提交 ----
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const formattedPeriods: TimePeriodItem[] = []
      
      if (timePeriodType === 'absolute') {
        const item = timePeriodsList[0]
        if (item) {
          if (item.startType === 'custom' && !item.startTime) {
            message.warning('请选择指定开始时间')
            return
          }
          if (item.endType === 'custom' && !item.endTime) {
            message.warning('请选择指定结束时间')
            return
          }
          const startVal = item.startType === 'now' ? 'now' : item.startTime.toISOString()
          const endVal = item.endType === 'forever' ? 'forever' : item.endTime.toISOString()
          
          if (item.startType === 'custom' && item.endType === 'custom' && item.startTime.isAfter(item.endTime)) {
            message.warning('结束时间不能早于开始时间')
            return
          }
          formattedPeriods.push({ start: startVal, end: endVal })
        }
      } else if (timePeriodType === 'cycle') {
        const item = timePeriodsList[0]
        if (item) {
          if (item.cycleDateStartType === 'custom' && !item.cycleDateStartTime) {
            message.warning('请选择指定开始日期')
            return
          }
          if (item.cycleDateEndType === 'custom' && !item.cycleDateEndTime) {
            message.warning('请选择指定结束日期')
            return
          }
          if (!item.cycleTime || !item.cycleTime[0] || !item.cycleTime[1]) {
            message.warning('请选择每日固定时段')
            return
          }
          const startVal = item.cycleDateStartType === 'now' ? 'now' : item.cycleDateStartTime.format('YYYY-MM-DD')
          const endVal = item.cycleDateEndType === 'forever' ? 'forever' : item.cycleDateEndTime.format('YYYY-MM-DD')
          
          if (item.cycleDateStartType === 'custom' && item.cycleDateEndType === 'custom' && item.cycleDateStartTime.isAfter(item.cycleDateEndTime)) {
            message.warning('结束日期不能早于开始日期')
            return
          }
          
          formattedPeriods.push({
            start: startVal,
            end: endVal,
            timeStart: item.cycleTime[0].format('HH:mm:ss'),
            timeEnd: item.cycleTime[1].format('HH:mm:ss'),
          })
        }
      }

      const payload = {
        name: values.name,
        enabled: values.enabled ?? false,
        discountRate: values.discountRate || '0.00',
        mainAccount: values.mainAccount || '',
        skuId: values.skuId || '',
        timePeriods: formattedPeriods,
      }

      const doSubmit = async () => {
        setSubmitting(true)
        try {
          if (modalMode === 'add') {
            await createDiscountRateRule(payload)
            message.success('规则创建成功')
          } else if (editingRule) {
            await updateDiscountRateRule(editingRule.id, payload)
            message.success('规则更新成功')
          }
          setModalOpen(false)
          form.resetFields()
          loadData()
        } catch {
          message.error('操作失败')
        } finally {
          setSubmitting(false)
        }
      }

      if (payload.enabled) {
        const excludeId = modalMode === 'edit' ? editingRule?.id : undefined
        if (checkDiscountRuleConflict(payload, allRules, excludeId)) {
          modal.warning({
            title: '冲突提示',
            content: '同一主账号下，该 SKU 的折扣率规则与现有规则时间段重叠，请修改时间段。',
            centered: true,
          })
          return
        }

        if (payload.discountRate === '0.00' || payload.discountRate === '1.00') {
          const isZero = payload.discountRate === '0.00'
          const titleText = isZero ? '折扣率 0.00' : '折扣率 1.00'
          const contentText = isZero
            ? '当前折扣率为 0.00，启用后该主账号下该 SKU 在生效时间段内将免费提供服务。是否确认启用？'
            : '当前折扣率为 1.00，启用后该主账号下该 SKU 在生效时间段内将按原价计费。是否确认启用？'

          modal.confirm({
            title: titleText,
            content: contentText,
            centered: true,
            okText: '确定启用',
            cancelText: '取消',
            onOk: () => {
              doSubmit()
            }
          })
          return
        }
      }

      await doSubmit()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return // 表单验证不通过
      message.error('操作失败')
    }
  }

  // ---- 复制 ----
  const handleCopy = async (record: DiscountRateRule) => {
    const { baseName } = parseBaseName(record.name)
    const copyName = getNextCopyName(baseName, allRules)
    try {
      await createDiscountRateRule({
        name: copyName,
        enabled: false,
        discountRate: record.discountRate,
        mainAccount: record.mainAccount,
        skuId: record.skuId,
        timePeriods: record.timePeriods,
      })
      message.success(`已复制为「${copyName}」`)
      loadData()
    } catch {
      message.error('复制失败')
    }
  }

  // ---- 启用/停用 ----
  const handleToggleEnabled = async (record: DiscountRateRule) => {
    const newEnabled = !record.enabled
    if (newEnabled) {
      // 启用时做重合校验
      if (checkDiscountRuleConflict({ ...record, enabled: newEnabled }, allRules, record.id)) {
        modal.warning({
          title: '冲突提示',
          content: '同一主账号下，该 SKU 的折扣率规则与现有规则时间段重叠，请修改时间段。',
          centered: true,
        })
        return
      }

      const doToggle = async () => {
        try {
          await updateDiscountRateRule(record.id, { enabled: newEnabled })
          message.success('规则已启用')
          loadData()
        } catch {
          message.error('操作失败')
        }
      }

      if (record.discountRate === '0.00' || record.discountRate === '1.00') {
        const isZero = record.discountRate === '0.00'
        const titleText = isZero ? '折扣率 0.00' : '折扣率 1.00'
        const contentText = isZero
          ? '当前折扣率为 0.00，启用后该主账号下该 SKU 在生效时间段内将免费提供服务。是否确认启用？'
          : '当前折扣率为 1.00，启用后该主账号下该 SKU 在生效时间段内将按原价计费。是否确认启用？'

        modal.confirm({
          title: titleText,
          content: contentText,
          centered: true,
          okText: '确定启用',
          cancelText: '取消',
          onOk: () => {
            doToggle()
          }
        })
        return
      }

      await doToggle()
    } else {
      try {
        await updateDiscountRateRule(record.id, { enabled: newEnabled })
        message.success('规则已停用')
        loadData()
      } catch {
        message.error('操作失败')
      }
    }
  }

  // ---- 删除 ----
  const handleDeleteClick = (record: DiscountRateRule) => {
    setDeletingRule(record)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRule) return
    try {
      await deleteDiscountRateRule(deletingRule.id)
      message.success('规则已删除')
      setDeleteModalOpen(false)
      setDeletingRule(null)
      loadData()
    } catch {
      message.error('删除失败')
    }
  }


  // ---- 表格列 ----
  const columns: ColumnsType<DiscountRateRule> = [
    {
      title: (
        <span>
          ID
          {annotationMode && <AnnotationBadge number={2} />}
        </span>
      ),
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    { title: '折扣规则名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    {
      title: (
        <span>
          状态
          {annotationMode && <AnnotationBadge number={7} />}
        </span>
      ),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: (
        <span>
          折扣率
          {annotationMode && <AnnotationBadge number={3} />}
        </span>
      ),
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 100,
    },
    {
      title: (
        <span>
          主账号
          {annotationMode && <AnnotationBadge number={4} />}
        </span>
      ),
      dataIndex: 'mainAccount',
      key: 'mainAccount',
      width: 200,
      render: (v: string) => {
        if (!v) return '不限'
        return (
          <Space size={[0, 4]} wrap>
            {v.split(',').filter(Boolean).map((acc) => (
              <Tag key={acc} color="purple">{acc}</Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: 'SKU',
      dataIndex: 'skuId',
      key: 'skuId',
      width: 160,
      render: (v: string) => {
        if (!v) return '不限'
        return (
          <Space size={[0, 4]} wrap>
            {v.split(',').filter(Boolean).map((sku) => (
              <Tag key={sku} color="cyan">{sku}</Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: (
        <span>
          时间段
          {annotationMode && <AnnotationBadge number={5} />}
        </span>
      ),
      dataIndex: 'timePeriods',
      key: 'timePeriods',
      width: 280,
      render: (tps: DiscountRateRule['timePeriods']) => {
        if (!tps || tps.length === 0) return '不限'
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {tps.map((tp, idx) => {
              const fmt = (s: string) => {
                if (s === 'now') return '现在'
                if (s === 'forever') return '永久'
                if (/^\d{2}:\d{2}/.test(s) && !s.includes('-')) {
                  const parts = s.split(':')
                  if (parts.length >= 2) {
                    return `${parts[0]}:${parts[1]}`
                  }
                  return s
                }
                const d = dayjs(s)
                if (!d.isValid()) return s
                return d.hour() === 0 && d.minute() === 0 && d.second() === 0
                  ? d.format('YYYY-MM-DD')
                  : d.format('YYYY-MM-DD HH:mm')
              }

              if (tp.timeStart && tp.timeEnd) {
                const formatDay = (dayStr: string) => {
                  if (dayStr === 'now') return '现在'
                  if (dayStr === 'forever') return '永久'
                  const d = dayjs(dayStr)
                  return d.isValid() ? d.format('YYYY-MM-DD') : dayStr
                }
                const formatTime = (timeStr: string) => {
                  const parts = timeStr.split(':')
                  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr
                }
                const isNowToForever = tp.start === 'now' && tp.end === 'forever'
                return (
                  <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                    {isNowToForever ? (
                      `每日 ${formatTime(tp.timeStart)}~${formatTime(tp.timeEnd)}`
                    ) : (
                      `${formatDay(tp.start)}~${formatDay(tp.end)} ： ${formatTime(tp.timeStart)}~${formatTime(tp.timeEnd)}`
                    )}
                  </div>
                )
              }

              return (
                <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                  {fmt(tp.start)} ~ {fmt(tp.end)}
                </div>
              )
            })}
          </Space>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: DiscountRateRule, index: number) => {
        const isEnabled = record.enabled
        const dropdownItems: MenuProps['items'] = [
          {
            key: 'toggle',
            label: (
              <span style={{ color: isEnabled ? '#ff4d4f' : '#52c41a' }}>
                {isEnabled ? '停用' : '启用'}
              </span>
            ),
            onClick: () => handleToggleEnabled(record),
          },
          {
            key: 'delete',
            label: <span style={{ color: '#ff4d4f' }}>删除</span>,
            onClick: () => handleDeleteClick(record),
          },
        ]
        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
            <Space size={0}>
              <Button type="link" size="small" onClick={() => handleCopy(record)}>复制</Button>
              {annotationMode && index === 0 && <AnnotationBadge number={6} style={{ marginLeft: -2, marginRight: 2 }} />}
            </Space>
            <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
              <Button type="link" size="small">更多 <DownOutlined /></Button>
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  const scrollX = columns.reduce((acc, col) => acc + (Number(col.width) || 100), 0)

  // ---- 渲染 ----
  return (
    <div>
      {/* 标题行 */}
      <div style={{ marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          折扣率管理
          {annotationMode && <AnnotationBadge number={1} />}
        </Title>
      </div>

      {/* 筛选框 + 操作按钮同行：左侧筛选，右侧按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap size={8}>
          {annotationMode && <AnnotationBadge number={11} style={{ marginRight: 4 }} />}
          <Input
            placeholder="搜索规则名称..."
            allowClear
            value={filterName}
            onChange={(e) => {
              setFilterName(e.target.value)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
            style={{ width: 160 }}
          />

          <Select
            placeholder="状态筛选"
            value={filterStatus}
            onChange={(value) => {
              setFilterStatus(value)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
            style={{ width: 110 }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ]}
          />

          <Select
            mode="multiple"
            maxTagCount={filterAccounts.length <= 3 ? 3 : 2}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            placeholder="选择主账号"
            value={filterAccounts}
            onChange={(values) => {
              setFilterAccounts(values)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
            className="horizontal-select"
            style={{ width: getSelectWidth(filterAccounts), minWidth: 140 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={mockUsers}
          />

          <Select
            mode="multiple"
            maxTagCount={filterSkus.length <= 3 ? 3 : 2}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            placeholder="选择 SKU"
            value={filterSkus}
            onChange={(values) => {
              setFilterSkus(values)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
            className="horizontal-select"
            style={{ width: getSelectWidth(filterSkus), minWidth: 140 }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={mockSkus}
          />

          {(filterName || filterStatus !== 'all' || filterAccounts.length > 0 || filterSkus.length > 0) && (
            <Button
              type="link"
              onClick={() => {
                setFilterName('')
                setFilterStatus('all')
                setFilterAccounts([])
                setFilterSkus([])
                setPagination(prev => ({ ...prev, current: 1 }))
              }}
              style={{ padding: 0 }}
            >
              重置
            </Button>
          )}
        </Space>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
          {annotationMode && <AnnotationBadge number={2} style={{ marginLeft: -4 }} />}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={displayData}
        rowKey="id"
        loading={loading}
        scroll={{ x: scrollX }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredRules.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({
              current: page,
              pageSize: pageSize,
              total: filteredRules.length,
            })
          },
        }}
      />

      {/* 新增/编辑 Modal */}
      <Modal
        title={modalMode === 'add' ? '新增折扣率规则' : '编辑折扣率规则'}
        open={modalOpen}
        onCancel={handleCancel}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          annotationMode && (
            <AnnotationBadge
              key="cancel-badge"
              number={9}
              style={{ marginRight: 12, marginLeft: 4, verticalAlign: 'middle' }}
            />
          ),
          annotationMode && (
            <AnnotationBadge
              key="extremum-badge"
              number={10}
              style={{ marginRight: 12, marginLeft: 4, verticalAlign: 'middle' }}
            />
          ),
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            确认
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* ID */}
          <Form.Item label="ID">
            <Input
              disabled
              value={modalMode === 'edit' ? editingRule?.id : nextId}
            />
          </Form.Item>

          {/* 折扣规则名称 */}
          <Form.Item name="name" label="折扣规则名称" rules={[{ required: true, message: '请输入折扣规则名称' }]}>
            <Input placeholder="请输入折扣规则名称" maxLength={50} />
          </Form.Item>

          {/* 状态 */}
          <Form.Item
            name="enabled"
            valuePropName="checked"
            label={
              <span>
                状态
                {annotationMode && <AnnotationBadge number={7} />}
              </span>
            }
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>

          {/* 主账号 (单选模式, 必填) */}
          <Form.Item
            name="mainAccount"
            label={
              <span>
                主账号
                {annotationMode && <AnnotationBadge number={4} />}
              </span>
            }
            rules={[{ required: true, message: '请选择主账号' }]}
          >
            <Select
              placeholder="请选择主账号"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={mockUsers}
            />
          </Form.Item>

          {/* SKU (单选模式, 必填) */}
          <Form.Item
            name="skuId"
            label="SKU"
            rules={[{ required: true, message: '请选择 SKU' }]}
          >
            <Select
              placeholder="请选择 SKU"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={mockSkus}
            />
          </Form.Item>

          {/* 时间段设置 */}
          <Form.Item
            label={
              <span>
                时间段设置
                {annotationMode && <AnnotationBadge number={5} />}
              </span>
            }
          >
            <Radio.Group
              value={timePeriodType}
              onChange={(e) => {
                setTimePeriodType(e.target.value as 'absolute' | 'cycle')
                setTimePeriodsList([{
                  startType: 'now',
                  startTime: null,
                  endType: 'forever',
                  endTime: null,
                  cycleDateStartType: 'now',
                  cycleDateStartTime: null,
                  cycleDateEndType: 'forever',
                  cycleDateEndTime: null,
                  cycleTime: null
                }])
              }}
              style={{ marginBottom: 12 }}
            >
              <Radio value="absolute">指定时间范围</Radio>
              <Radio value="cycle">每日固定时间段</Radio>
            </Radio.Group>

            {timePeriodsList.map((item, index) => (
              <div key={index} style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                position: 'relative',
                backgroundColor: '#fafafa'
              }}>


                {timePeriodType === 'absolute' ? (
                  <Space direction="vertical" style={{ width: '90%' }} size={12}>
                    <div>
                      <span style={{ marginRight: 8, fontWeight: '500' }}>开始时间:</span>
                      <Radio.Group
                        value={item.startType}
                        onChange={(e) => {
                          const newList = [...timePeriodsList]
                          newList[index].startType = e.target.value
                          if (e.target.value === 'now') newList[index].startTime = null
                          setTimePeriodsList(newList)
                        }}
                      >
                        <Radio value="now">现在</Radio>
                        <Radio value="custom">指定时间</Radio>
                      </Radio.Group>
                      {item.startType === 'custom' && (
                        <DatePicker
                          showTime={{ format: 'HH:mm', minuteStep: 15 }}
                          format="YYYY-MM-DD HH:mm"
                          value={item.startTime}
                          style={{ marginLeft: 8, marginTop: 4 }}
                          onChange={(val) => {
                            const newList = [...timePeriodsList]
                            newList[index].startTime = val
                            setTimePeriodsList(newList)
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span style={{ marginRight: 8, fontWeight: '500' }}>结束时间:</span>
                      <Radio.Group
                        value={item.endType}
                        onChange={(e) => {
                          const newList = [...timePeriodsList]
                          newList[index].endType = e.target.value
                          if (e.target.value === 'forever') newList[index].endTime = null
                          setTimePeriodsList(newList)
                        }}
                      >
                        <Radio value="forever">永久</Radio>
                        <Radio value="custom">指定时间</Radio>
                      </Radio.Group>
                      {item.endType === 'custom' && (
                        <DatePicker
                          showTime={{ format: 'HH:mm', minuteStep: 15 }}
                          format="YYYY-MM-DD HH:mm"
                          value={item.endTime}
                          style={{ marginLeft: 8, marginTop: 4 }}
                          onChange={(val) => {
                            const newList = [...timePeriodsList]
                            newList[index].endTime = val
                            setTimePeriodsList(newList)
                          }}
                        />
                      )}
                    </div>
                  </Space>
                ) : (
                  <Space direction="vertical" style={{ width: '90%', gap: 10 }} size={12}>
                    <div>
                      <span style={{ marginRight: 8, fontWeight: '500' }}>开始日期:</span>
                      <Radio.Group
                        value={item.cycleDateStartType}
                        onChange={(e) => {
                          const newList = [...timePeriodsList]
                          newList[index].cycleDateStartType = e.target.value
                          if (e.target.value === 'now') newList[index].cycleDateStartTime = null
                          setTimePeriodsList(newList)
                        }}
                      >
                        <Radio value="now">现在</Radio>
                        <Radio value="custom">指定日期</Radio>
                      </Radio.Group>
                      {item.cycleDateStartType === 'custom' && (
                        <DatePicker
                          format="YYYY-MM-DD"
                          value={item.cycleDateStartTime}
                          style={{ marginLeft: 8, marginTop: 4 }}
                          onChange={(val) => {
                            const newList = [...timePeriodsList]
                            newList[index].cycleDateStartTime = val
                            setTimePeriodsList(newList)
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span style={{ marginRight: 8, fontWeight: '500' }}>结束日期:</span>
                      <Radio.Group
                        value={item.cycleDateEndType}
                        onChange={(e) => {
                          const newList = [...timePeriodsList]
                          newList[index].cycleDateEndType = e.target.value
                          if (e.target.value === 'forever') newList[index].cycleDateEndTime = null
                          setTimePeriodsList(newList)
                        }}
                      >
                        <Radio value="forever">永久</Radio>
                        <Radio value="custom">指定日期</Radio>
                      </Radio.Group>
                      {item.cycleDateEndType === 'custom' && (
                        <DatePicker
                          format="YYYY-MM-DD"
                          value={item.cycleDateEndTime}
                          style={{ marginLeft: 8, marginTop: 4 }}
                          onChange={(val) => {
                            const newList = [...timePeriodsList]
                            newList[index].cycleDateEndTime = val
                            setTimePeriodsList(newList)
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span style={{ marginRight: 8, fontWeight: '500' }}>每日固定时段:</span>
                      <TimePicker.RangePicker
                        format="HH:mm"
                        minuteStep={15}
                        showSecond={false}
                        value={item.cycleTime}
                        placeholder={['开始时间', '结束时间']}
                        style={{ marginTop: 4 }}
                        onChange={(val) => {
                          const newList = [...timePeriodsList]
                          newList[index].cycleTime = val
                          setTimePeriodsList(newList)
                        }}
                      />
                    </div>
                  </Space>
                )}
              </div>
            ))}


          </Form.Item>

          {/* 折扣率 */}
          <Form.Item
            name="discountRate"
            rules={[{ required: true, message: '请输入折扣率' }]}
            label={
              <span>
                折扣率
                {annotationMode && <AnnotationBadge number={3} />}
              </span>
            }
          >
            <DiscountRateInput />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        ruleName={deletingRule?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRule(null) }}
        annotationMode={annotationMode}
        onBadgeClick={(id) => {
          setSelectedAnnotationId(id)
          setAnnotationDrawerOpen(true)
        }}
      />

      {/* 批注侧边栏 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: '#fa8c16',
              color: '#fff',
              fontSize: 13,
              fontWeight: 'bold'
            }}>
              {selectedAnnotationId}
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {ANNOTATIONS.find(a => a.id === selectedAnnotationId)?.title}
            </span>
          </div>
        }
        placement="right"
        onClose={() => setAnnotationDrawerOpen(false)}
        open={annotationDrawerOpen}
        width={420}
        footer={
          <Row justify="space-between" align="middle" style={{ padding: '8px 4px' }}>
            <Button
              disabled={selectedAnnotationId <= 1}
              onClick={() => setSelectedAnnotationId(prev => prev - 1)}
            >
              上一个批注
            </Button>
            <Button
              disabled={selectedAnnotationId >= ANNOTATIONS.length}
              type="primary"
              onClick={() => setSelectedAnnotationId(prev => prev + 1)}
            >
              下一个批注
            </Button>
          </Row>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="orange" style={{ borderRadius: 4, padding: '2px 8px' }}>
            PRD 参考：{ANNOTATIONS.find(a => a.id === selectedAnnotationId)?.prdRef}
          </Tag>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: '#333' }}>
          {ANNOTATIONS.find(a => a.id === selectedAnnotationId)?.content}
        </div>
      </Drawer>

      {/* 悬浮原型演示批注模式开关 (符合原型演示悬浮感，置于页面右下角) */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1001,
          backgroundColor: '#fff',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          borderRadius: '24px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1.5px solid #fa8c16',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 140, 22, 0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}
      >
        <span style={{ fontSize: 16 }}>💡</span>
        <span style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: 13, userSelect: 'none' }}>原型批注模式</span>
        <Switch size="small" checked={annotationMode} onChange={(val) => setAnnotationMode(val)} />
      </div>
    </div>
  )
}
