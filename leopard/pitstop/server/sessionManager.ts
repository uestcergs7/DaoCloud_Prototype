import crypto from 'crypto'

const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
const TTL_HOURS = parseInt(process.env.SESSION_TTL_HOURS || '24', 10)

interface Session {
    username: string
    accessToken: string
    refreshToken: string
    exp: number
}

function sign(data: string): string {
    return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}

export const sessionManager = {
    createSession(username: string, accessToken: string, refreshToken: string): string {
        const session: Session = {
            username,
            accessToken,
            refreshToken,
            exp: Date.now() + TTL_HOURS * 60 * 60 * 1000
        }
        const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
        const signature = sign(payload)
        return `${payload}.${signature}`
    },

    verifySession(token: string): Session | null {
        try {
            const [payload, signature] = token.split('.')
            if (!payload || !signature) return null

            if (sign(payload) !== signature) {
                console.log('[Session] Invalid signature')
                return null
            }

            const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
            if (session.exp < Date.now()) {
                console.log('[Session] Token expired')
                return null
            }

            return session
        } catch (e) {
            console.error('[Session] Verification error:', e)
            return null
        }
    },

    getTTLMs(): number {
        return TTL_HOURS * 60 * 60 * 1000
    }
}
