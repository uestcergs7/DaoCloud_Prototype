import { Router, Request, Response, NextFunction } from 'express'
import https from 'https'
import { tokenManager } from './tokenManager.js'
import { copySafeResponseHeaders } from './proxyHeaders.js'

// 手动实现代理，避免 http-proxy-middleware 的路径问题
async function proxyRequest(
    req: Request,
    res: Response,
    targetPath: string,
    userToken: string,
    apiBaseUrl: string
) {
    const url = new URL(targetPath, apiBaseUrl)

    // 保留查询参数
    const queryString = new URL(req.url, 'http://localhost').search
    url.search = queryString

    console.log(`[Proxy] Forwarding to: ${url.href}`)

    const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: req.method,
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
        },
        rejectUnauthorized: false,
    }

    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`[Proxy] Response status: ${proxyRes.statusCode}`)

        res.status(proxyRes.statusCode || 500)

        // 仅透传安全响应头，避免污染浏览器 Cookie
        copySafeResponseHeaders(proxyRes.headers, res)

        proxyRes.pipe(res)
    })

    proxyReq.on('error', (e) => {
        console.error(`[Proxy] Request error:`, e)
        res.status(500).json({ error: 'Proxy error', detail: String(e) })
    })

    proxyReq.end()
}

export function createProxyRoutes(apiBaseUrl: string) {
    const router = Router()

    // 通用中间件：获取用户 token
    const getUserToken = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.params.userId as string
        const callerToken = (req as any).session?.accessToken || ''
        const callerUsername = (req as any).session?.username || ''
        console.log(`[Proxy] Incoming request: ${req.method} ${req.originalUrl}`)
        console.log(`[Proxy] User ID: ${userId}, Caller: ${callerUsername}`)

        try {
            const token = await tokenManager.getOrCreateToken(userId, callerToken, callerUsername)
                ; (req as any).userToken = token
            console.log(`[Proxy] Token obtained for user ${userId}`)
            next()
        } catch (e) {
            console.error('[Proxy] Failed to get user token:', e)
            const detail = String(e)
            const status = detail.includes('HTTP 401') || detail.includes('HTTP 403') ? 401 : 500
            const error = status === 401 ? 'Unauthorized' : 'Failed to get user token'
            res.status(status).json({ error, detail })
        }
    }

    // 用户订单
    router.get('/users/:userId/orders', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/orders', (req as any).userToken, apiBaseUrl)
    })

    // 用户收支明细
    router.get('/users/:userId/transactions', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/transactions', (req as any).userToken, apiBaseUrl)
    })

    // 用户账单
    router.get('/users/:userId/bills', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/bills', (req as any).userToken, apiBaseUrl)
    })

    // 用户钱包余额
    router.get('/users/:userId/wallet/balance', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/wallet/balance', (req as any).userToken, apiBaseUrl)
    })

    // 用户代金券（活跃）
    router.get('/users/:userId/vouchers', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/vouchers/active', (req as any).userToken, apiBaseUrl)
    })

    // 用户代金券（过期）
    router.get('/users/:userId/vouchers/expired', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/vouchers/expired', (req as any).userToken, apiBaseUrl)
    })

    // 子账号成员列表
    router.get('/users/:userId/members', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/accounts/current/members', (req as any).userToken, apiBaseUrl)
    })

    // 订单详情
    router.get('/users/:userId/orders/:orderId', getUserToken, async (req, res) => {
        await proxyRequest(req, res, `/apis/leopard.io/v1alpha1/orders/${req.params.orderId}`, (req as any).userToken, apiBaseUrl)
    })

    // 月账单列表
    router.get('/users/:userId/monthly-bills', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/bills/monthly', (req as any).userToken, apiBaseUrl)
    })

    // 月账单详情
    router.get('/users/:userId/monthly-bills/:billingMonth', getUserToken, async (req, res) => {
        await proxyRequest(req, res, `/apis/leopard.io/v1alpha1/bills/monthly/${req.params.billingMonth}`, (req as any).userToken, apiBaseUrl)
    })

    // === 导出接口 ===

    // 导出订单
    router.get('/users/:userId/export/orders', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/export/orders', (req as any).userToken, apiBaseUrl)
    })

    // 导出收支明细
    router.get('/users/:userId/export/transactions', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/export/transactions', (req as any).userToken, apiBaseUrl)
    })

    // 导出账单
    router.get('/users/:userId/export/bills', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/export/bills', (req as any).userToken, apiBaseUrl)
    })

    // 导出月账单
    router.get('/users/:userId/export/monthly-bills', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/export/bills/monthly', (req as any).userToken, apiBaseUrl)
    })

    // === Current User API (ghippo) ===

    // 获取用户账户状态（主账号/子账号/认证状态等）
    router.get('/users/:userId/current-user', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/ghippo.io/v1alpha1/current-user', (req as any).userToken, apiBaseUrl)
    })

    // 获取用户实名认证详情（用户 token，走 current-user 域）
    router.get('/users/:userId/certify', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/ghippo.io/v1alpha1/current-user/certify', (req as any).userToken, apiBaseUrl)
    })

    // 代金券统计（余额和张数）
    router.get('/users/:userId/vouchers/stat', getUserToken, async (req, res) => {
        await proxyRequest(req, res, '/apis/leopard.io/v1alpha1/vouchers/stat', (req as any).userToken, apiBaseUrl)
    })

    return router
}
