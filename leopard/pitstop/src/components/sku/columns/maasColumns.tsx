import type { ColumnType } from 'antd/es/table'
import { Tag } from 'antd'
import type { SKU } from '@/types/sku'
import { statusColumn } from './common'

// 模型名称列（直接使用 specField: model-name）
const modelNameColumn: ColumnType<SKU> = {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 220,
    sorter: (a: SKU, b: SKU) => (a.modelName || '').localeCompare(b.modelName || ''),
    defaultSortOrder: 'ascend',
}

// Token 类型列（直接使用 specField: token-type）
const tokenTypeColumn: ColumnType<SKU> = {
    title: 'Token 类型',
    dataIndex: 'tokenType',
    key: 'tokenType',
    width: 100,
    render: (type: string) => {
        if (type === 'input') return <Tag color="blue">Input</Tag>
        if (type === 'output') return <Tag color="orange">Output</Tag>
        return <Tag>{type || '-'}</Tag>
    },
}

// MaaS 价格列
const maasPriceColumn: ColumnType<SKU> = {
    title: '价格（微元）',
    dataIndex: 'price',
    key: 'price',
    width: 150,
    render: (price: number) => {
        const yuan = price / 1000000
        return (
            <div>
                <div>{price} 微元</div>
                <div style={{ color: '#999', fontSize: 12 }}>≈ ¥{yuan.toFixed(6)}</div>
            </div>
        )
    },
}

// MaaS 列配置（无区域列，按模型名排序聚合）
export const maasColumns: ColumnType<SKU>[] = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
    },
    modelNameColumn,
    tokenTypeColumn,
    maasPriceColumn,
    statusColumn,
]
