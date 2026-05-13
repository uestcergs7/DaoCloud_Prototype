import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';
import { useI18n } from '../I18nContext';

export default function RouterDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.router.name, value: 'http-route' },
    { label: t.router.status, value: '正常', status: 'success' as const },
    { label: t.router.routeType, value: 'HTTPRoute' },
    { label: t.router.parentGateway, value: 'test-gw (bs-system)' },
    { label: t.router.hostnameMatch, value: 'hr.daocloud.test' },
    { label: t.router.namespace, value: 'bs-system' },
    { label: t.router.createdAt, value: '2026-01-18 23:32' }
  ];

  const tabs = [
    {
      key: 'matches',
      title: t.router.matches,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.router.path}</th>
              <th>{t.router.method}</th>
              <th>{t.router.headers}</th>
              <th>{t.router.queryParams}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge">PathPrefix</span>/api</td>
              <td>POST</td>
              <td><span className="badge">Exact</span>X-Api-Version: v2</td>
              <td><span className="badge">Exact</span>debug: true</td>
            </tr>
          </tbody>
        </table>
      )
    },
    {
      key: 'filters',
      title: t.router.filters,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.router.filterType}</th>
              <th>{t.router.filterConfig}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>RequestHeaderModifier</td>
              <td>
                <div><span className="badge blue">Add</span> X-Internal-Source: gateway-api</div>
                <div><span className="badge blue">Set</span> X-App-Id: shopping-cart-v1</div>
                <div><span className="badge blue">Remove</span> X-Debug-Token</div>
              </td>
            </tr>
            <tr>
              <td>URLRewrite</td>
              <td>
                <span className="badge blue">ReplacePrefixMatch</span> /v2
              </td>
            </tr>
            <tr>
              <td>ResponseHeaderModifier</td>
              <td>
                <div><span className="badge blue">Add</span> Cache-Control: no-cache</div>
                <div><span className="badge blue">Set</span> X-Response-Time: optimized</div>
              </td>
            </tr>
            <tr>
              <td>RequestMirror</td>
              <td>
                Mirror to: mirror-service:8080
              </td>
            </tr>
          </tbody>
        </table>
      )
    },
    {
      key: 'backend',
      title: t.router.backendRefs,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.router.serviceName}</th>
              <th>{t.router.port}</th>
              <th>{t.router.weight}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ht-backend</td>
              <td>8080</td>
              <td>100</td>
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
        type="Router"
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
      <TabsCard tabs={tabs} />
    </div>
  );
}
