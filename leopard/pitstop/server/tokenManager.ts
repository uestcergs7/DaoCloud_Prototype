import fs from 'fs'
import path from 'path'
import https from 'https'

const DATA_DIR = path.join(process.cwd(), 'data')
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json')

interface TokenRecord {
    userId: string
    aid: string
    expiry: number
}

interface TokenEntry extends TokenRecord {
    token: string
}

// 内存存储（包含实际 token）
// cache key: `${callerUsername}:${userId}` — 按调用者隔离
const tokenCache = new Map<string, TokenEntry>()

// 文件存储（只有 aid，用于重启清理）
function loadTokensFile(): Record<string, TokenRecord> {
    try {
        if (fs.existsSync(TOKENS_FILE)) {
            return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'))
        }
    } catch (e) {
        console.error('[TokenManager] Failed to load tokens file:', e)
    }
    return {}
}

function saveTokensFile(records: Record<string, TokenRecord>) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(TOKENS_FILE, JSON.stringify(records, null, 2))
    } catch (e) {
        console.error('[TokenManager] Failed to save tokens file:', e)
    }
}

function appendToFile(cacheKey: string, record: TokenRecord) {
    const records = loadTokensFile()
    records[cacheKey] = record
    saveTokensFile(records)
}

function removeFromFile(cacheKey: string) {
    const records = loadTokensFile()
    delete records[cacheKey]
    saveTokensFile(records)
}

// HTTP 请求工具（跳过自签名证书验证）
async function httpRequest(
    baseUrl: string,
    method: string,
    apiPath: string,
    token: string,
    body?: object
): Promise<any> {
    const url = new URL(apiPath, baseUrl)
    console.log(`[HTTP] ${method} ${url.href}`)

    return new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            rejectUnauthorized: false,
        }

        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => (data += chunk))
            res.on('end', () => {
                console.log(`[HTTP] Response ${res.statusCode}`)
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(data ? JSON.parse(data) : {})
                    } catch {
                        resolve({})
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`))
                }
            })
        })

        req.on('error', (e) => {
            console.error(`[HTTP] Request error:`, e)
            reject(e)
        })
        if (body) {
            req.write(JSON.stringify(body))
        }
        req.end()
    })
}

let apiBaseUrl = ''
let initialized = false
let initPromise: Promise<void> | null = null
let cleanupTimer: NodeJS.Timeout | null = null

export const tokenManager = {
    isInitialized(): boolean {
        return initialized
    },

    async init(baseUrl: string) {
        if (!baseUrl) {
            throw new Error('[TokenManager] init failed: empty baseUrl')
        }

        apiBaseUrl = baseUrl

        if (initialized) {
            return
        }

        if (initPromise) {
            await initPromise
            return
        }

        initPromise = (async () => {
            console.log('[TokenManager] Initializing...')
            console.log(`[TokenManager] API Base URL: ${baseUrl}`)

            // 清除上次残留记录（token 在 ghippo 侧会自然过期，无需主动删除）
            saveTokensFile({})

            if (!cleanupTimer) {
                const ttlHours = parseInt(process.env.USER_TOKEN_TTL_HOURS || '1', 10)
                cleanupTimer = setInterval(() => this.cleanup(), 10 * 60 * 1000)
                console.log(`[TokenManager] TTL: ${ttlHours} hour(s), cleanup interval: 10 min`)
            }

            initialized = true
        })()

        try {
            await initPromise
        } finally {
            initPromise = null
        }
    },

    async getOrCreateToken(userId: string, callerToken: string, callerUsername: string): Promise<string> {
        if (!apiBaseUrl) {
            throw new Error('[TokenManager] Not initialized: missing API base URL')
        }
        if (!callerToken) {
            throw new Error('[TokenManager] Missing caller token')
        }

        const cacheKey = `${callerUsername}:${userId}`
        console.log(`[TokenManager] getOrCreateToken for user: ${userId}, caller: ${callerUsername}`)

        // 检查缓存（按调用者隔离）
        const cached = tokenCache.get(cacheKey)
        if (cached && cached.expiry > Date.now()) {
            console.log(`[TokenManager] Cache hit: ${cacheKey}, expires in ${Math.round((cached.expiry - Date.now()) / 1000 / 60)} min`)
            return cached.token
        }

        if (cached) {
            console.log(`[TokenManager] Cache expired: ${cacheKey}`)
        }

        // 创建新 token
        const ttlHours = parseInt(process.env.USER_TOKEN_TTL_HOURS || '1', 10)
        const expiry = Date.now() + ttlHours * 60 * 60 * 1000
        const expiredAt = String(expiry)
        const tokenName = `pitstop-auto-${Date.now()}`

        console.log(`[TokenManager] Creating token for user ${userId}`)

        const result = await httpRequest(
            apiBaseUrl,
            'POST',
            `/apis/ghippo.io/v1alpha1/users/${userId}/accesstoken`,
            callerToken,
            { name: tokenName, expiredAt }
        )

        console.log(`[TokenManager] Token created: aid=${result.id}`)

        const entry: TokenEntry = {
            userId,
            aid: result.id,
            token: result.token,
            expiry,
        }

        tokenCache.set(cacheKey, entry)
        appendToFile(cacheKey, { userId, aid: result.id, expiry })

        return result.token
    },

    async cleanup() {
        console.log('[TokenManager] Running cleanup...')
        const now = Date.now()

        for (const [cacheKey, entry] of tokenCache.entries()) {
            if (entry.expiry <= now) {
                console.log(`[TokenManager] Expired: ${cacheKey}`)
                tokenCache.delete(cacheKey)
                removeFromFile(cacheKey)
            }
        }
        console.log('[TokenManager] Cleanup complete')
    },
}
