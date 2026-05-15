import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { useI18n } from '../I18nContext';

export default function GatewayClassDetail() {
  const t = useI18n();

  const basicInfo = [
    { label: t.gatewayClass.name, value: 'envoy-internet' },
    { label: t.gatewayClass.status, value: 'Accepted', status: 'success' as const },
    { label: t.gatewayClass.alias, value: '-' },
    { label: t.gatewayClass.controller, value: 'gateway.envoyproxy.io/gatewayclass-controller' },
    { label: t.gatewayClass.createdAt, value: '2026-01-18 12:32' }
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
      
      <div className="info-card" style={{ display: 'block' }}>
        <div className="section-title" style={{ marginBottom: '20px' }}>{t.gatewayClass.parametersRef}</div>
        <div className="listener-info-grid" style={{ marginBottom: 0 }}>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.apiGroup}</div>
            <div className="info-value">gateway.envoyproxy.io</div>
          </div>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.kind}</div>
            <div className="info-value">EnvoyProxy</div>
          </div>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.namespace}</div>
            <div className="info-value">envoy-gateway-system</div>
          </div>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.resourceName}</div>
            <div className="info-value">custom-proxy-config</div>
          </div>
        </div>
      </div>

    </div>
  );
}
