import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';
import { useI18n } from '../I18nContext';

export default function GatewayClassDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.gatewayClass.name, value: 'envoy-internet' },
    { label: t.gatewayClass.status, value: 'Accepted', status: 'success' as const },
    { label: t.gatewayClass.alias, value: '-' },
    { label: t.gatewayClass.controller, value: 'gateway.envoyproxy.io/gatewayclass-controller' },
    { label: t.gatewayClass.configParams, value: '-' },
    { label: t.gatewayClass.createdAt, value: '2026-01-18 12:32' }
  ];

  const tabs = [
    {
      key: 'parameters',
      title: t.gatewayClass.parametersRef,
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>{t.gatewayClass.apiGroup}</th>
              <th>{t.gatewayClass.kind}</th>
              <th>{t.gatewayClass.resourceName}</th>
              <th>{t.gatewayClass.namespace}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>gateway.envoyproxy.io</td>
              <td>EnvoyProxy</td>
              <td>custom-proxy-config</td>
              <td>envoy-gateway-system</td>
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
        type="GatewayClass"
        name="envoy-internet"
        mockLabels={[
          { key: 'app.kubernetes.io/managed-by', value: 'envoy-gateway' }
        ]}
        mockAnnotations={[
          { key: 'gateway.networking.k8s.io/is-default-class', value: 'true' }
        ]}
        yamlContent={`apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy-internet
  labels:
    app.kubernetes.io/managed-by: envoy-gateway
  annotations:
    gateway.networking.k8s.io/is-default-class: "true"
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
  parametersRef:
    group: gateway.envoyproxy.io
    kind: EnvoyProxy
    name: custom-proxy-config
    namespace: envoy-gateway-system`}
      />
      <BasicInfoCard items={basicInfo} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
