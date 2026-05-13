import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';
import { useI18n } from '../I18nContext';

export default function GatewayDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.gateway.name, value: 'test-gw' },
    { label: t.gateway.status, value: '正常', status: 'success' as const },
    { label: t.gateway.alias, value: '-' },
    { label: t.gateway.gatewayClass, value: 'envoy-gateway' },
    { label: t.gateway.namespace, value: 'bs-system' },
    { label: t.gateway.createdAt, value: '2026-01-18 23:32' }
  ];

  const tabs = [
    {
      key: 'listeners',
      title: t.gateway.listeners,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.gateway.name}</th>
              <th>{t.gateway.port}</th>
              <th>{t.gateway.protocol}</th>
              <th>{t.gateway.hostname}</th>
              <th>{t.gateway.tlsMode}</th>
              <th>{t.gateway.tlsOptions}</th>
              <th>{t.gateway.allowedNamespaces}</th>
              <th>{t.gateway.allowedKinds}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>http</td>
              <td>80</td>
              <td>HTTP</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>Same Namespace</td>
              <td>HTTPRoute</td>
            </tr>
            <tr>
              <td>https-api</td>
              <td>443</td>
              <td>HTTPS</td>
              <td>api.example.com</td>
              <td>Terminate / api-example-com-tls</td>
              <td><span className="badge">networking.istio.io/tls-min-version</span>: TLSv1_3</td>
              <td>Selector (exposed-to-gateway=true)</td>
              <td>HTTPRoute, GRPCRoute</td>
            </tr>
          </tbody>
        </table>
      )
    },
    {
      key: 'addresses',
      title: t.gateway.externalAddresses,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.gateway.type}</th>
              <th>{t.gateway.value}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>IPAddress</td>
              <td>10.23.44.12</td>
            </tr>
          </tbody>
        </table>
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
