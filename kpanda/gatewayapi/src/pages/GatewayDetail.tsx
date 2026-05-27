import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';
import { useI18n } from '../I18nContext';

export default function GatewayDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.gateway.name, value: 'test-gw' },
    { label: t.gateway.status, value: t.common.statusNormal, status: 'success' as const },
    { label: t.gateway.alias, value: '-' },
    { label: t.gateway.gatewayClass, value: 'envoy-gateway' },
    { label: t.gateway.namespace, value: 'bs-system' },
    { label: t.gateway.createdAt, value: '2026-01-18 23:32' },
    { label: t.gateway.externalAddress, value: '10.23.44.12' }
  ];

  const tabs = [
    {
      key: 'listeners',
      title: t.gateway.listeners,
      content: (
        <div>
          {[
            {
              name: 'http',
              port: 80,
              protocol: 'HTTP',
              hostname: '',
              tlsMode: '',
              tlsRefs: [],
              tlsOptions: [],
              allowedNamespaces: '当前',
              nsSelector: [],
              allowedKinds: [{ crd: 'gateway.networking.k8s.io', cr: 'HTTPRoute' }]
            },
            {
              name: 'https-api',
              port: 443,
              protocol: 'HTTPS',
              hostname: 'api.example.com',
              tlsMode: 'Terminate',
              tlsRefs: [
                { kind: 'Secret', group: 'core', name: 'api-example-com-tls', namespace: 'bs-system' }
              ],
              tlsOptions: [
                { key: 'networking.istio.io/tls-min-version', value: 'TLSv1_3' }
              ],
              allowedNamespaces: '指定 NS 范围',
              nsSelector: [
                { key: 'exposed-to-gateway', value: 'true' }
              ],
              allowedKinds: [
                { crd: 'gateway.networking.k8s.io', cr: 'HTTPRoute' },
                { crd: 'gateway.networking.k8s.io', cr: 'GRPCRoute' }
              ]
            }
          ].map((l, i) => (
            <div key={i} className="listener-card">
              <div className="listener-header">
                <span>监听器 {String(i + 1).padStart(2, '0')} - {l.name}</span>
              </div>
              <div className="listener-body">
                <div className="listener-info-grid">
                  <div className="info-item">
                    <div className="info-label">{t.gateway.name}</div>
                    <div className="info-value">{l.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t.gateway.port}</div>
                    <div className="info-value">{l.port}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t.gateway.protocol}</div>
                    <div className="info-value">{l.protocol}</div>
                  </div>
                  {['HTTP', 'HTTPS', 'TLS'].includes(l.protocol) && (
                    <div className="info-item">
                      <div className="info-label">{t.gateway.hostname}</div>
                      <div className="info-value">{l.hostname || '-'}</div>
                    </div>
                  )}
                  {['HTTPS', 'TLS'].includes(l.protocol) && (
                    <div className="info-item">
                      <div className="info-label">{t.gateway.tlsMode}</div>
                      <div className="info-value">{l.tlsMode || '-'}</div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-label">{t.gateway.allowedNamespaces}</div>
                    <div className="info-value">{l.allowedNamespaces}</div>
                  </div>
                </div>

                {/* TLS Settings Block */}
                {['HTTPS', 'TLS'].includes(l.protocol) && l.tlsMode && (
                  <div className="tls-card">
                    {l.tlsRefs && l.tlsRefs.length > 0 && (
                      <div>
                        <div className="tls-section-title">{t.gateway.tlsRefs}</div>
                        <table className="inner-table">
                          <thead>
                            <tr>
                              <th>{t.gateway.kind}</th>
                              <th>{t.gateway.group}</th>
                              <th>{t.gateway.secretName}</th>
                              <th>{t.gateway.secretNamespace}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {l.tlsRefs.map((ref, idx) => (
                              <tr key={idx}>
                                <td>{ref.kind}</td>
                                <td>{ref.group}</td>
                                <td>{ref.name}</td>
                                <td>{ref.namespace}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {l.tlsOptions && l.tlsOptions.length > 0 && (
                      <div>
                        <div className="tls-section-title">{t.gateway.tlsOptions}</div>
                        <table className="inner-table">
                          <thead>
                            <tr>
                              <th>{t.header.key}</th>
                              <th>{t.header.value}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {l.tlsOptions.map((opt, idx) => (
                              <tr key={idx}>
                                <td>{opt.key}</td>
                                <td>{opt.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {l.allowedNamespaces === '指定 NS 范围' && l.nsSelector && l.nsSelector.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div className="info-label" style={{ marginBottom: '8px' }}>{t.gateway.nsSelector}</div>
                    <table className="inner-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>{t.header.key}</th>
                          <th>{t.header.value}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {l.nsSelector.map((sel, idx) => (
                          <tr key={idx}>
                            <td>{sel.key}</td>
                            <td>{sel.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <div className="info-label" style={{ marginBottom: '8px' }}>{t.gateway.allowedKinds}</div>
                  <table className="inner-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>{t.gateway.crd}</th>
                        <th>{t.gateway.cr}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.allowedKinds.map((k, idx) => (
                        <tr key={idx}>
                          <td>{k.crd}</td>
                          <td>{k.cr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        type="Gateway"
        name="test-gw"
        mockLabels={[
          { key: 'gateway', value: 'test-gw' },
          { key: 'environment', value: 'production' }
        ]}
        mockAnnotations={[
          { key: 'kapnda.io/alias-name', value: 'Production API Gateway' },
          { key: 'service.beta.kubernetes.io/load-balancer-type', value: 'external' }
        ]}
        yamlContent={`apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: test-gw
  namespace: bs-system
  labels:
    gateway: test-gw
    environment: production
  annotations:
    kapnda.io/alias-name: Production API Gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Same
    - name: https-api
      port: 443
      protocol: HTTPS
      hostname: api.example.com
      tls:
        mode: Terminate
        certificateRefs:
          - name: api-example-com-tls
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              exposed-to-gateway: "true"
  addresses:
    - type: IPAddress
      value: 10.23.44.12`}
      />
      <BasicInfoCard items={basicInfo} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
