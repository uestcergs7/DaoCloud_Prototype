import { useState, useEffect } from 'react'
import { Table, Input, Space, message, Row, Col, Button, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import axios from 'axios'

interface Member {
    id: string
    name: string
}

interface UserMembersProps {
    userId: string
    isMainAccount?: boolean
}

export default function UserMembers({ userId, isMainAccount }: UserMembersProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Member[]>([])
    const [total, setTotal] = useState(0)

    const [params, setParams] = useState({
        page: 1,
        pageSize: 10,
        search: '',
    })

    const loadData = async () => {
        if (!userId || !isMainAccount) return
        setLoading(true)
        try {
            const response = await axios.get(`/proxy/users/${userId}/members?page=1&pageSize=100000`)
            let items = response.data.items || []

            // 前端搜索过滤
            if (params.search) {
                items = items.filter((m: Member) =>
                    m.name.toLowerCase().includes(params.search.toLowerCase()) ||
                    m.id.toLowerCase().includes(params.search.toLowerCase())
                )
            }

            // 前端分页
            const startIdx = (params.page - 1) * params.pageSize
            const paginatedItems = items.slice(startIdx, startIdx + params.pageSize)

            setData(paginatedItems)
            setTotal(items.length)
        } catch (error) {
            message.error('获取子账号列表失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [params, userId])

    const columns: ColumnsType<Member> = [
        {
            title: '用户ID',
            dataIndex: 'id',
            key: 'id',
            width: 350,
        },
        {
            title: '用户名',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => {
                // 包含#时显示完整，但高亮#后面的部分
                if (name.includes('#')) {
                    const [prefix, ...rest] = name.split('#')
                    return (
                        <span>
                            <span style={{ color: '#999' }}>{prefix}#</span>
                            <span>{rest.join('#')}</span>
                        </span>
                    )
                }
                return name
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Link to={`/users/${record.id}`}>查看详情</Link>
            ),
        },
    ]

    const handleSearch = (value: string) => {
        setParams((prev) => ({ ...prev, page: 1, search: value }))
    }

    // 子账号无权限查看成员列表
    if (!isMainAccount) {
        return (
            <Alert
                message="无权限"
                description="只有主账号才能查看和管理子账号列表。"
                type="info"
                showIcon
            />
        )
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Input
                        placeholder="搜索用户名或ID"
                        allowClear
                        onChange={(e) => handleSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </Col>
                <Col>
                    <Button icon={<ReloadOutlined />} onClick={loadData}>
                        刷新
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: params.page,
                    pageSize: params.pageSize,
                    total: total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                        setParams((prev) => ({ ...prev, page, pageSize }))
                    },
                }}
            />
        </Space>
    )
}
