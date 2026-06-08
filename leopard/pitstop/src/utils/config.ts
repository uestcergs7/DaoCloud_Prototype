interface RuntimeConfig {
    VITE_API_BASE_URL?: string
    APP_NAME?: string
    APP_BRAND?: string
}

const rc = (): RuntimeConfig => (window as unknown as { __RUNTIME_CONFIG__: RuntimeConfig }).__RUNTIME_CONFIG__ ?? {}

export const appName = () => rc().APP_NAME || 'Pitstop'
export const appBrand = () => rc().APP_BRAND || 'D.Run'
