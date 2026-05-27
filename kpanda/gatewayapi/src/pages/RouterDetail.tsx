import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';
import { useI18n } from '../I18nContext';

export default function RouterDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.router.name, value: 'http-route' },
    { label: t.router.status, value: t.common.statusNormal, status: 'success' as const },
    { label: t.router.alias, value: 'API Route' },
    { label: t.router.namespace, value: 'bs-system' },
    { label: t.router.createdAt, value: '2026-01-18 23:32' }
  ];

  const gatewayConfigInfo = [
    { label: t.router.routeType, value: 'HTTPRoute' },
    { label: t.router.gatewayTarget, value: '本命名空间' },
    { label: t.router.parentGateway, value: 'test-gw' },
    { label: t.router.hostnameMatch, value: 'hr.daocloud.test' }
  ];

  const mockRules = [
    {
      name: '01',
      matches: {
        pathType: '前缀匹配',
        pathValue: '/api',
        methods: ['POST', 'GET'],
        headers: [
          { key: 'X-Api-Version', type: '等于', value: 'v2' }
        ],
        queryParams: [
          { name: 'debug', type: '等于', value: 'true' }
        ]
      },
      filters: {
        reqHeaderRewrite: {
          enabled: true,
          actions: [
            { action: '添加', key: 'x-internal-source', value: 'gateway-api' },
            { action: '设置', key: 'x-app-id', value: 'shopping-cart-v1' },
            { action: '删除', key: 'x-debug-token', value: '-' }
          ]
        },
        resHeaderRewrite: {
          enabled: true,
          actions: [
            { action: '添加', key: 'x-response-time', value: '10ms' }
          ]
        },
        urlRewrite: {
          enabled: true,
          originalPath: '/api',
          rewritePath: '/v2'
        }
      },
      backends: [
        { name: 'ht-backend', port: 8080, weight: 100, mirror: false },
        { name: 'mirror-backend', port: 8081, weight: 0, mirror: true }
      ]
    }
  ];

  const tabs = [
    {
      key: 'rules',
      title: t.router.rules,
      content: (
        <div>
          {mockRules.map((rule, i) => (
            <div key={i} className="listener-card">
              <div className="listener-header">
                <span>{t.router.rule} {rule.name}</span>
              </div>
              <div className="listener-body">
                
                {/* Traffic Match Conditions */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>{t.router.trafficMatch}</div>
                  <div className="tls-card" style={{ marginTop: 0 }}>
                    <div className="listener-info-grid" style={{ marginBottom: 0 }}>
                      <div className="info-item">
                        <div className="info-label">{t.router.path}</div>
                        <div className="info-value">{rule.matches.pathType} {rule.matches.pathValue}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">{t.router.method}</div>
                        <div className="info-value">{rule.matches.methods.join(', ') || '-'}</div>
                      </div>
                    </div>
                    
                    {rule.matches.headers.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="info-label" style={{ marginBottom: '8px' }}>{t.router.headers}</div>
                        <table className="inner-table">
                          <thead>
                            <tr>
                              <th>{t.router.headerKey}</th>
                              <th>{t.router.matchType}</th>
                              <th>{t.router.headerValue}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rule.matches.headers.map((h, idx) => (
                              <tr key={idx}>
                                <td>{h.key}</td>
                                <td>{h.type}</td>
                                <td>{h.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {rule.matches.queryParams.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <div className="info-label" style={{ marginBottom: '8px' }}>{t.router.queryParams}</div>
                        <table className="inner-table">
                          <thead>
                            <tr>
                              <th>{t.router.queryName}</th>
                              <th>{t.router.matchType}</th>
                              <th>{t.router.headerValue}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rule.matches.queryParams.map((q, idx) => (
                              <tr key={idx}>
                                <td>{q.name}</td>
                                <td>{q.type}</td>
                                <td>{q.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters */}
                { (rule.filters.reqHeaderRewrite.enabled || rule.filters.resHeaderRewrite.enabled || rule.filters.urlRewrite.enabled) && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>{t.router.filters}</div>
                    <div className="tls-card" style={{ marginTop: 0 }}>
                      
                      {rule.filters.reqHeaderRewrite.enabled && (
                        <div style={{ marginBottom: '16px' }}>
                          <div className="info-label" style={{ marginBottom: '8px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {t.router.reqHeaderRewrite}
                          </div>
                          <table className="inner-table">
                            <thead>
                              <tr>
                                <th>{t.router.action}</th>
                                <th>{t.router.key}</th>
                                <th>{t.router.value}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rule.filters.reqHeaderRewrite.actions.map((a, idx) => (
                                <tr key={idx}>
                                  <td>{a.action}</td>
                                  <td>{a.key}</td>
                                  <td>{a.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {rule.filters.resHeaderRewrite.enabled && (
                        <div style={{ marginBottom: '16px' }}>
                          <div className="info-label" style={{ marginBottom: '8px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {t.router.resHeaderRewrite}
                          </div>
                          <table className="inner-table">
                            <thead>
                              <tr>
                                <th>{t.router.action}</th>
                                <th>{t.router.key}</th>
                                <th>{t.router.value}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rule.filters.resHeaderRewrite.actions.map((a, idx) => (
                                <tr key={idx}>
                                  <td>{a.action}</td>
                                  <td>{a.key}</td>
                                  <td>{a.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {rule.filters.urlRewrite.enabled && (
                        <div>
                          <div className="info-label" style={{ marginBottom: '8px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {t.router.urlRewrite}
                          </div>
                          <div className="listener-info-grid" style={{ marginBottom: 0 }}>
                            <div className="info-item">
                              <div className="info-label">{t.router.originalPath}</div>
                              <div className="info-value">{rule.filters.urlRewrite.originalPath}</div>
                            </div>
                            <div className="info-item">
                              <div className="info-label">{t.router.rewritePath}</div>
                              <div className="info-value">{rule.filters.urlRewrite.rewritePath}</div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Backend Services */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>{t.router.backendRefs}</div>
                  <div className="tls-card" style={{ marginTop: 0 }}>
                    <div className="info-label" style={{ marginBottom: '8px' }}>{t.router.targetServices}</div>
                    <table className="inner-table">
                      <thead>
                        <tr>
                          <th>{t.router.serviceName}</th>
                          <th>{t.router.port}</th>
                          <th>{t.router.weight}</th>
                          <th>{t.router.trafficMirror}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rule.backends.map((b, idx) => (
                          <tr key={idx}>
                            <td>{b.name}</td>
                            <td>{b.port}</td>
                            <td>{b.weight}</td>
                            <td>{b.mirror ? t.router.enable : t.router.disable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div>
      <Header
        cluster="cluster"
        namespace="bs-system"
        type="Route"
        name="http-route"
        mockLabels={[
          { key: 'app', value: 'frontend' }
        ]}
        mockAnnotations={[
          { key: 'external-dns.alpha.kubernetes.io/hostname', value: 'hr.daocloud.test' }
        ]}
        yamlContent={`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: http-route
  namespace: bs-system
  labels:
    app: frontend
spec:
  parentRefs:
    - name: test-gw
      namespace: bs-system
  hostnames:
    - hr.daocloud.test
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
          method: POST
          headers:
            - type: Exact
              name: X-Api-Version
              value: v2
          queryParams:
            - type: Exact
              name: debug
              value: "true"
      filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Internal-Source
                value: gateway-api
            set:
              - name: X-App-Id
                value: shopping-cart-v1
            remove:
              - X-Debug-Token
        - type: ResponseHeaderModifier
          responseHeaderModifier:
            add:
              - name: X-Response-Time
                value: 10ms
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefix: /v2
      backendRefs:
        - name: ht-backend
          port: 8080
          weight: 100`}
      />
      <BasicInfoCard items={basicInfo} />
      <BasicInfoCard items={gatewayConfigInfo} title={t.router.gatewayConfig} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
