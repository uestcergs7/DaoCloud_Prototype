import type { Response } from 'express'
import type { OutgoingHttpHeaders } from 'http'

const BLOCKED_RESPONSE_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'proxy-connection',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'set-cookie',
    'set-cookie2',
])

export function copySafeResponseHeaders(headers: OutgoingHttpHeaders, res: Response) {
    for (const [key, value] of Object.entries(headers)) {
        if (!value) continue
        if (BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) continue
        res.setHeader(key, value)
    }
}
