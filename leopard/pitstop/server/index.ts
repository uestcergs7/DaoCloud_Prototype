import express from 'express'
import path from 'path'
import https from 'https'
import crypto from 'crypto'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { tokenManager } from './tokenManager.js'
import { createProxyRoutes } from './proxyRoutes.js'
import { sessionManager } from './sessionManager.js'
import { copySafeResponseHeaders } from './proxyHeaders.js'
import * as mockData from './mockData.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PROXY_PORT || process.env.PORT || 3001
const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || ''
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || ''
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || ''
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || `http://localhost:${PORT}/api/v1/auth/callback`

const API_BASE_URL = (OIDC_ISSUER_URL && OIDC_ISSUER_URL !== 'mock') ? new URL(OIDC_ISSUER_URL).origin : 'https://localhost:8080'

let oidcConfig = {
    authorization_endpoint: '',
    token_endpoint: '',
    userinfo_endpoint: '',
    end_session_endpoint: '',
}

interface AuthSession {
    username: string
    accessToken: string
    refreshToken: string
    exp: number
}

type AuthenticatedRequest = express.Request & {
    session?: AuthSession
}

function httpsRequest(url: string, options: {
    method?: string
    headers?: Record<string, string>
    body?: string
}): Promise<{ status: number; data: string }> {
    const parsed = new URL(url)
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            rejectUnauthorized: false,
        }, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => resolve({ status: res.statusCode || 500, data }))
        })
        req.on('error', reject)
        if (options.body) req.write(options.body)
        req.end()
    })
}

async function initOIDC() {
    if (OIDC_ISSUER_URL === 'mock' || !OIDC_ISSUER_URL) {
        console.log('[OIDC] Running in Mock Offline Mode. Skipping OIDC discovery.')
        return
    }
    console.log(`[OIDC] Discovering endpoints from ${OIDC_ISSUER_URL}`)
    const wellKnownUrl = `${OIDC_ISSUER_URL}/.well-known/openid-configuration`
    const { data } = await httpsRequest(wellKnownUrl, {})
    const config = JSON.parse(data)
    oidcConfig = {
        authorization_endpoint: config.authorization_endpoint,
        token_endpoint: config.token_endpoint,
        userinfo_endpoint: config.userinfo_endpoint,
        end_session_endpoint: config.end_session_endpoint,
    }
    console.log('[OIDC] Endpoints discovered:', Object.keys(oidcConfig).map(k => `${k}: ${oidcConfig[k as keyof typeof oidcConfig]}`).join('\n  '))
}

await initOIDC()
await tokenManager.init(API_BASE_URL)

app.use(express.json())

// Serve runtime config for both dev and prod (mirrors docker-entrypoint.sh)
app.get('/config.js', (_req, res) => {
    res.type('application/javascript')
    res.send(`window.__RUNTIME_CONFIG__ = ${JSON.stringify({
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? '',
        APP_NAME: process.env.APP_NAME ?? '',
        APP_BRAND: process.env.APP_BRAND ?? '',
    })};`)
})

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) return {}
    return Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...val] = c.trim().split('=')
            return [key, val.join('=')]
        })
    )
}

function setSessionCookie(res: express.Response, sessionToken: string) {
    res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: sessionManager.getTTLMs(),
        path: '/',
    })
}

function parseJwtExpiryMs(token: string): number | null {
    if (!token) return null
    const segments = token.split('.')
    if (segments.length < 2) return null

    try {
        const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString())
        if (typeof payload.exp !== 'number') return null
        return payload.exp * 1000
    } catch {
        return null
    }
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_CLIENT_SECRET,
        refresh_token: refreshToken,
    }).toString()

    const tokenRes = await httpsRequest(oidcConfig.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    })

    if (tokenRes.status !== 200) {
        throw new Error(`[Auth] Refresh token exchange failed: ${tokenRes.status} ${tokenRes.data}`)
    }

    const tokens = JSON.parse(tokenRes.data)
    if (!tokens.access_token) {
        throw new Error('[Auth] Refresh token exchange missing access_token')
    }

    return {
        accessToken: String(tokens.access_token),
        refreshToken: String(tokens.refresh_token || refreshToken),
    }
}

const pendingStates = new Map<string, { createdAt: number }>()
const refreshLocks = new Map<string, Promise<{ accessToken: string; refreshToken: string }>>()


app.get('/api/v1/auth/login', (_req, res) => {
    if (OIDC_ISSUER_URL === 'mock') {
        const sessionToken = sessionManager.createSession('admin', 'mock-admin-token', 'mock-refresh-token')
        setSessionCookie(res, sessionToken)
        const frontendUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/'
        res.redirect(frontendUrl)
        return
    }

    const state = crypto.randomBytes(16).toString('hex')
    pendingStates.set(state, { createdAt: Date.now() })


    const now = Date.now()
    for (const [k, v] of pendingStates) {
        if (now - v.createdAt > 5 * 60 * 1000) pendingStates.delete(k)
    }

    const params = new URLSearchParams({
        client_id: OIDC_CLIENT_ID,
        redirect_uri: OIDC_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile email',
        state,
    })

    const authUrl = `${oidcConfig.authorization_endpoint}?${params}`
    console.log(`[Auth] Redirecting to OIDC login: ${authUrl}`)
    res.redirect(authUrl)
})


app.get('/api/v1/auth/callback', async (req, res) => {
    const { code, state, error } = req.query

    if (error) {
        console.error(`[Auth] OIDC error: ${error}`)
        res.status(400).send(`Authentication error: ${error}`)
        return
    }

    if (!state || !pendingStates.has(state as string)) {
        console.error('[Auth] Invalid or expired state')
        res.status(400).send('Invalid or expired state')
        return
    }
    pendingStates.delete(state as string)

    if (!code) {
        res.status(400).send('Missing authorization code')
        return
    }

    try {

        const tokenBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: OIDC_CLIENT_ID,
            client_secret: OIDC_CLIENT_SECRET,
            code: code as string,
            redirect_uri: OIDC_REDIRECT_URI,
        }).toString()

        const tokenRes = await httpsRequest(oidcConfig.token_endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody,
        })

        if (tokenRes.status !== 200) {
            console.error(`[Auth] Token exchange failed: ${tokenRes.status} ${tokenRes.data}`)
            res.status(500).send('Token exchange failed')
            return
        }

        const tokens = JSON.parse(tokenRes.data)
        const accessToken = String(tokens.access_token || '')
        const refreshToken = String(tokens.refresh_token || '')

        if (!accessToken) {
            console.error('[Auth] Missing access_token in callback response')
            res.status(500).send('Invalid token response')
            return
        }


        const userInfoRes = await httpsRequest(oidcConfig.userinfo_endpoint, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (userInfoRes.status !== 200) {
            console.error(`[Auth] UserInfo failed: ${userInfoRes.status}`)
            res.status(500).send('Failed to get user info')
            return
        }

        const userInfo = JSON.parse(userInfoRes.data)
        const username = userInfo.preferred_username || userInfo.name || userInfo.sub

        console.log(`[Auth] OIDC login success: ${username}`)


        const sessionToken = sessionManager.createSession(username, accessToken, refreshToken)
        setSessionCookie(res, sessionToken)


        const frontendUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/'
        res.redirect(frontendUrl)
    } catch (e) {
        console.error('[Auth] Callback error:', e)
        res.status(500).send('Authentication failed')
    }
})


app.get('/api/v1/auth/check', (req, res) => {
    if (OIDC_ISSUER_URL === 'mock') {
        res.json({ authenticated: true, username: 'admin' })
        return
    }
    const cookies = parseCookies(req.headers.cookie)
    const session = cookies.session ? sessionManager.verifySession(cookies.session) : null

    if (session) {
        res.json({ authenticated: true, username: session.username })
    } else {
        res.json({ authenticated: false })
    }
})

// GET not POST: 前端用 location.href 跳转，POST + fetch 会触发 React 重渲染竞态
app.get('/api/v1/logout', (req, res) => {
    if (OIDC_ISSUER_URL === 'mock') {
        res.clearCookie('session', { path: '/' })
        const loginUrl = process.env.NODE_ENV === 'production'
            ? '/login'
            : 'http://localhost:5173/login'
        res.redirect(loginUrl)
        return
    }
    const cookies = parseCookies(req.headers.cookie)
    const session = cookies.session ? sessionManager.verifySession(cookies.session) : null

    res.clearCookie('session', { path: '/' })


    if (session && oidcConfig.end_session_endpoint) {
        const postLogoutUri = process.env.NODE_ENV === 'production'
            ? OIDC_REDIRECT_URI.replace('/api/v1/auth/callback', '/login')
            : 'http://localhost:5173/login'
        const params = new URLSearchParams({
            client_id: OIDC_CLIENT_ID,
            post_logout_redirect_uri: postLogoutUri,
        })
        const logoutUrl = `${oidcConfig.end_session_endpoint}?${params}`
        console.log(`[Auth] Logout: redirecting to ${logoutUrl}`)
        res.redirect(logoutUrl)
    } else {
        const loginUrl = process.env.NODE_ENV === 'production'
            ? '/api/v1/auth/login'
            : 'http://localhost:5173/'
        res.redirect(loginUrl)
    }
})



async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (OIDC_ISSUER_URL === 'mock') {
        const cookies = parseCookies(req.headers.cookie)
        let session = cookies.session ? sessionManager.verifySession(cookies.session) as AuthSession | null : null
        if (!session) {
            const sessionToken = sessionManager.createSession('admin', 'mock-admin-token', 'mock-refresh-token')
            setSessionCookie(res, sessionToken)
            session = sessionManager.verifySession(sessionToken) as AuthSession | null
        }
        ;(req as AuthenticatedRequest).session = session!
        next()
        return
    }
    const cookies = parseCookies(req.headers.cookie)
    const session = cookies.session ? sessionManager.verifySession(cookies.session) as AuthSession | null : null

    if (!session) {
        console.log(`[Auth] Unauthorized access attempt: ${req.method} ${req.path}`)
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    try {
        let accessToken = session.accessToken || ''
        let refreshToken = session.refreshToken || ''

        const expiryMs = parseJwtExpiryMs(accessToken)
        const willExpireSoon = expiryMs !== null && expiryMs <= Date.now() + 60 * 1000

        if ((!accessToken || willExpireSoon) && refreshToken) {
            const lockKey = cookies.session
            let refreshPromise = refreshLocks.get(lockKey)

            if (!refreshPromise) {
                console.log(`[Auth] Refreshing access token for ${session.username}`)
                refreshPromise = refreshAccessToken(refreshToken).finally(() => {
                    refreshLocks.delete(lockKey)
                })
                refreshLocks.set(lockKey, refreshPromise)
            }

            const refreshed = await refreshPromise
            accessToken = refreshed.accessToken
            refreshToken = refreshed.refreshToken
            const refreshedSession = sessionManager.createSession(session.username, accessToken, refreshToken)
            setSessionCookie(res, refreshedSession)
        }

        if (willExpireSoon && !refreshToken) {
            throw new Error('[Auth] Access token expired and no refresh token available')
        }

        if (!accessToken) {
            throw new Error('[Auth] Missing access token in session')
        }

        const requestSession: AuthSession = {
            ...session,
            accessToken,
            refreshToken,
        }
            ; (req as AuthenticatedRequest).session = requestSession

        next()
    } catch (e) {
        console.error('[Auth] Failed to prepare auth context:', e)
        res.clearCookie('session', { path: '/' })
        res.status(401).json({ error: 'Session expired, please login again' })
    }
}


function manualProxy(req: express.Request, res: express.Response, targetPath: string) {
    const requestSession = (req as AuthenticatedRequest).session
    const accessToken = requestSession?.accessToken || ''
    if (!accessToken) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const url = new URL(targetPath, API_BASE_URL)
    const queryString = new URL(req.url, 'http://localhost').search
    url.search = queryString

    const bodyData = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null

    console.log(`[Admin Proxy] ${req.method} ${req.url} -> ${url.href}`)

    const headers: Record<string, string | number> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    }
    if (bodyData) {
        headers['Content-Length'] = Buffer.byteLength(bodyData)
    }

    const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: req.method,
        headers,
        rejectUnauthorized: false,
    }

    const proxyReq = https.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 500)
        copySafeResponseHeaders(proxyRes.headers, res)
        proxyRes.pipe(res)
    })

    proxyReq.on('error', (e) => {
        console.error(`[Admin Proxy] Error:`, e)
        res.status(500).json({ error: 'Proxy error', detail: String(e) })
    })

    if (bodyData) {
        proxyReq.write(bodyData)
    }
    proxyReq.end()
}


if (OIDC_ISSUER_URL === 'mock') {
    console.log('[Server] Mock mode routing initialized')
    
    // 1. Mock Leopard APIs (/api/leopard/*)
    app.use('/api/leopard', (req, res) => {
        const urlPath = req.path
        console.log(`[Mock API] Leopard: ${req.method} ${urlPath}`)
        
        if (urlPath === '/products/spec-field-keys') {
            res.json({ items: mockData.mockProducts })
            return
        }
        if (urlPath === '/products/regions') {
            res.json({ items: mockData.mockRegions })
            return
        }
        if (urlPath === '/products/specs') {
            res.json({ specFields: mockData.mockGpuModels })
            return
        }
        if (urlPath === '/products/spec-infos') {
            if (req.method === 'POST') {
                res.json({ id: Math.floor(Math.random() * 1000) + 200 })
                return
            }
            res.json({ items: mockData.mockSpecs })
            return
        }
        if (urlPath === '/products/skus') {
            const prod = req.body.product
            const region = req.body.regionId
            let filtered = mockData.mockSkus
            if (prod) {
                if (prod === 'zestu-container-instance') {
                    filtered = mockData.mockSkus.filter(s => s.id === 'sku-101' || s.id === 'sku-102' || s.id === 'sku-105' || s.id === 'sku-106' || s.id === 'sku-107')
                } else if (prod === 'hydra-maas') {
                    filtered = mockData.mockSkus.filter(s => s.id === 'sku-104')
                } else {
                    filtered = mockData.mockSkus.filter(s => s.id === 'sku-103')
                }
            }
            if (region) {
                filtered = filtered.filter(s => s.region === region)
            }
            res.json({
                items: filtered,
                pagination: { page: 1, pageSize: 10, total: filtered.length }
            })
            return
        }
        if (urlPath.startsWith('/products/sku-infos/')) {
            const id = urlPath.split('/').pop() || ''
            if (req.method === 'PUT') {
                if (mockData.mockSkuInfos[id]) {
                    Object.assign(mockData.mockSkuInfos[id], req.body)
                    const sku = mockData.mockSkus.find(s => s.id === id)
                    if (sku) {
                        sku.discountRuleId = req.body.discountRuleId
                    }
                }
                res.sendStatus(200)
                return
            }
            const info = mockData.mockSkuInfos[id]
            if (info) {
                res.json(info)
            } else {
                res.status(404).json({ error: 'SKU not found' })
            }
            return
        }
        if (urlPath.startsWith('/products/skus/')) {
            const id = urlPath.split('/').pop() || ''
            const sku = mockData.mockSkus.find(s => s.id === id)
            if (sku) {
                res.json(sku)
            } else {
                res.status(404).json({ error: 'SKU not found' })
            }
            return
        }
        if (urlPath.startsWith('/products/discounts/')) {
            const id = urlPath.split('/').pop() || ''
            const rule = mockData.mockDiscountRules[id]
            if (rule) {
                res.json(rule)
            } else {
                res.status(404).json({ error: 'Discount rule not found' })
            }
            return
        }
        if (urlPath === '/products/sku-infos') {
            if (req.method === 'POST') {
                const body = req.body
                const newId = `sku-${Date.now()}`
                const billingPolicyId = body.billingPolicyId || 1
                const newSkuInfo = {
                    id: newId,
                    specId: body.specId || 101,
                    productName: body.productName,
                    regionName: body.regionName,
                    price: body.price || '1000000',
                    billingPolicyId,
                    freeQuantity: body.freeQuantity || 0,
                    available: 0,
                    displayOrder: body.displayOrder || 0,
                    discountRuleId: body.discountRuleId,
                    description: body.description || ''
                }
                mockData.mockSkuInfos[newId] = newSkuInfo
                
                const spec = mockData.mockSpecs.find(s => s.id === body.specId)
                mockData.mockSkus.push({
                    id: newId,
                    region: body.regionName,
                    specName: spec ? spec.name : '新规格 SKU',
                    price: Number(body.price),
                    billingType: billingPolicyId === 8 ? 'SUBSCRIPTION_MONTHLY' : 'PAY_AS_YOU_GO',
                    discountRuleId: body.discountRuleId,
                    specFields: []
                })
                res.json({ id: newId })
                return
            }
        }
        // === 折扣率管理 API 与本地文件持久化 ===
        const DB_FILE = path.join(__dirname, 'db_discount_rate_rules.json')
        let currentAutoIncrement = 7

        // 辅助函数：从本地 JSON 读取规则
        const loadDiscountRateRules = () => {
            try {
                if (fs.existsSync(DB_FILE)) {
                    const content = fs.readFileSync(DB_FILE, 'utf8')
                    const parsed = JSON.parse(content)
                    if (Array.isArray(parsed.rules)) {
                        let mutated = false
                        const migratedRules = parsed.rules.map((r: any) => {
                            let idStr = String(r.id)
                            if (idStr.startsWith('discount-')) {
                                idStr = idStr.substring('discount-'.length)
                                mutated = true
                            }
                            const cleanRule: any = {
                                id: idStr,
                                name: r.name || '',
                                enabled: r.enabled ?? false,
                                discountRate: r.discountRate || '1.00',
                                mainAccount: r.mainAccount || '',
                                skuId: r.skuId || '',
                            }
                            if ('timePeriods' in r && Array.isArray(r.timePeriods)) {
                                cleanRule.timePeriods = r.timePeriods
                            } else {
                                mutated = true
                                if (r.timePeriod === null || r.timePeriod === undefined) {
                                    cleanRule.timePeriods = [{ start: 'now', end: 'forever' }]
                                } else {
                                    cleanRule.timePeriods = [r.timePeriod]
                                }
                            }
                            if ('region' in r || 'channelDomain' in r || 'timePeriod' in r) {
                                mutated = true
                            }
                            return cleanRule
                        })

                        mockData.mockDiscountRateRules.length = 0
                        mockData.mockDiscountRateRules.push(...migratedRules)

                        if (typeof parsed.autoIncrement === 'number') {
                            currentAutoIncrement = parsed.autoIncrement
                        } else {
                            currentAutoIncrement = Math.max(...mockData.mockDiscountRateRules.map((r: any) => parseInt(r.id, 10) || 0), 5) + 1
                        }

                        if (mutated) {
                            saveDiscountRateRules()
                        }
                    }
                } else {
                    saveDiscountRateRules()
                }
            } catch (e) {
                console.error('Failed to load mock rules from file:', e)
            }
        }

        // 辅助函数：将规则保存到本地 JSON
        const saveDiscountRateRules = () => {
            try {
                const dataToSave = {
                    rules: mockData.mockDiscountRateRules,
                    autoIncrement: currentAutoIncrement
                }
                fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf8')
            } catch (e) {
                console.error('Failed to save mock rules to file:', e)
            }
        }

        // 首次加载初始化
        loadDiscountRateRules()

        if (urlPath === '/products/discount-rate-rules') {
            if (req.method === 'GET') {
                loadDiscountRateRules()
                const page = Number(req.query.page) || 1
                const pageSize = Number(req.query.pageSize) || 10
                const start = (page - 1) * pageSize
                const items = mockData.mockDiscountRateRules.slice(start, start + pageSize)
                res.json({
                    items,
                    pagination: { page, pageSize, total: mockData.mockDiscountRateRules.length },
                    nextId: String(currentAutoIncrement)
                })
                return
            }
            if (req.method === 'POST') {
                loadDiscountRateRules()
                const body = req.body
                const newId = String(currentAutoIncrement++)
                const newRule = {
                    id: newId,
                    name: body.name || '',
                    enabled: body.enabled ?? false,
                    discountRate: body.discountRate || '1.00',
                    mainAccount: body.mainAccount || '',
                    skuId: body.skuId || '',
                    timePeriods: body.timePeriods || [{ start: 'now', end: 'forever' }],
                }
                mockData.mockDiscountRateRules.push(newRule)
                saveDiscountRateRules()
                res.json(newRule)
                return
            }
        }
        if (urlPath.startsWith('/products/discount-rate-rules/') && urlPath !== '/products/discount-rate-rules/') {
            const id = urlPath.split('/').pop() || ''
            loadDiscountRateRules()
            const idx = mockData.mockDiscountRateRules.findIndex((r: any) => r.id === id)
            if (req.method === 'PUT') {
                if (idx === -1) { res.status(404).json({ error: 'Rule not found' }); return }
                const updatedRule = {
                    ...mockData.mockDiscountRateRules[idx],
                    name: req.body.name !== undefined ? req.body.name : mockData.mockDiscountRateRules[idx].name,
                    enabled: req.body.enabled !== undefined ? req.body.enabled : mockData.mockDiscountRateRules[idx].enabled,
                    discountRate: req.body.discountRate !== undefined ? req.body.discountRate : mockData.mockDiscountRateRules[idx].discountRate,
                    mainAccount: req.body.mainAccount !== undefined ? req.body.mainAccount : mockData.mockDiscountRateRules[idx].mainAccount,
                    skuId: req.body.skuId !== undefined ? req.body.skuId : mockData.mockDiscountRateRules[idx].skuId,
                    timePeriods: req.body.timePeriods !== undefined ? req.body.timePeriods : mockData.mockDiscountRateRules[idx].timePeriods,
                }
                mockData.mockDiscountRateRules[idx] = updatedRule
                saveDiscountRateRules()
                res.json(updatedRule)
                return
            }
            if (req.method === 'DELETE') {
                if (idx === -1) { res.status(404).json({ error: 'Rule not found' }); return }
                mockData.mockDiscountRateRules.splice(idx, 1)
                saveDiscountRateRules()
                res.sendStatus(200)
                return
            }
        }
        if (urlPath === '/products/channel-domains') {
            res.json({ items: mockData.mockChannelDomains })
            return
        }
        res.status(404).json({ error: `Mock endpoint not found: ${req.method} ${urlPath}` })
    })

    // 2. Mock Ghippo APIs (/api/ghippo/*)
    app.use('/api/ghippo', (req, res) => {
        const urlPath = req.path
        console.log(`[Mock API] Ghippo: ${req.method} ${urlPath}`)
        
        if (urlPath === '/users') {
            const search = req.query.search as string
            let filtered = mockData.mockUsers
            if (search) {
                filtered = mockData.mockUsers.filter(u => u.username.includes(search) || u.name.includes(search))
            }
            res.json({
                items: filtered,
                pagination: { page: 1, pageSize: 10, total: filtered.length }
            })
            return
        }
        if (urlPath.startsWith('/users/')) {
            const id = urlPath.split('/').pop() || ''
            const user = mockData.mockUsers.find(u => u.id === id)
            if (user) {
                res.json(user)
            } else {
                res.status(404).json({ error: 'User not found' })
            }
            return
        }
        res.status(404).json({ error: `Mock endpoint not found: ${req.method} ${urlPath}` })
    })

    // 3. Mock User Proxy APIs (/proxy/*)
    app.use('/proxy', (req, res) => {
        const urlPath = req.path
        console.log(`[Mock Proxy] ${req.method} ${urlPath}`)
        
        const usersMatch = urlPath.match(/^\/users\/([^/]+)\/(.+)$/)
        if (usersMatch) {
            const userId = usersMatch[1]
            const subPath = usersMatch[2]
            
            if (subPath === 'orders') {
                const list = mockData.mockOrders[userId] || []
                res.json({
                    items: list,
                    pagination: { page: 1, pageSize: 10, total: list.length }
                })
                return
            }
            if (subPath.startsWith('orders/')) {
                const orderId = subPath.split('/').pop() || ''
                const detail = mockData.mockOrderDetails[orderId]
                if (detail) {
                    res.json(detail)
                } else {
                    res.status(404).json({ error: 'Order detail not found' })
                }
                return
            }
            if (subPath === 'bills') {
                const list = mockData.mockBills[userId] || []
                res.json({
                    items: list,
                    pagination: { page: 1, pageSize: 10, total: list.length }
                })
                return
            }
            if (subPath === 'transactions') {
                const list = mockData.mockTransactions[userId] || []
                res.json({
                    items: list,
                    pagination: { page: 1, pageSize: 10, total: list.length }
                })
                return
            }
            if (subPath === 'monthly-bills') {
                const list = mockData.mockMonthlyBills[userId] || []
                res.json({
                    items: list,
                    pagination: { page: 1, pageSize: 10, total: list.length }
                })
                return
            }
            if (subPath === 'vouchers') {
                res.json({
                    items: mockData.mockVouchers[userId] || [],
                    pagination: { page: 1, pageSize: 10, total: (mockData.mockVouchers[userId] || []).length }
                })
                return
            }
            if (subPath === 'vouchers/expired') {
                res.json({
                    items: mockData.mockExpiredVouchers[userId] || [],
                    pagination: { page: 1, pageSize: 10, total: (mockData.mockExpiredVouchers[userId] || []).length }
                })
                return
            }
            if (subPath === 'vouchers/stat') {
                res.json(mockData.mockVoucherStats[userId] || { amount: '0.00', count: 0 })
                return
            }
            if (subPath === 'wallet/balance') {
                res.json(mockData.mockWalletBalances[userId] || { balance: '0.00', isVirtual: false, alertsEnabled: false })
                return
            }
            if (subPath === 'members') {
                const list = mockData.mockMembers[userId] || []
                res.json({
                    items: list,
                    pagination: { page: 1, pageSize: 10, total: list.length }
                })
                return
            }
            if (subPath === 'certify') {
                res.json(mockData.mockCertifyInfos[userId] || { certName: '未实名', certNo: '', certTime: '', subject: 'Individual' })
                return
            }
            if (subPath === 'current-user') {
                const user = mockData.mockUsers.find(u => u.id === userId)
                res.json(user || { username: 'unknown' })
                return
            }
        }
        res.status(404).json({ error: `Mock proxy endpoint not found: ${req.method} ${urlPath}` })
    })
}


app.use('/proxy', requireAuth, createProxyRoutes(API_BASE_URL))


app.use('/api/leopard', requireAuth, (req, res) => {
    const targetPath = `/apis/leopard.io/v1alpha1${req.url}`
    manualProxy(req, res, targetPath)
})


app.use('/api/ghippo', requireAuth, (req, res) => {
    const targetPath = `/apis/ghippo.io/v1alpha1${req.url}`
    manualProxy(req, res, targetPath)
})


if (process.env.NODE_ENV === 'production') {

    const distPath = path.join(__dirname, '..')
    app.use(express.static(distPath))


    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'))
    })
}

app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`)
    console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`)
    console.log(`[Server] OIDC Issuer: ${OIDC_ISSUER_URL}`)
})
