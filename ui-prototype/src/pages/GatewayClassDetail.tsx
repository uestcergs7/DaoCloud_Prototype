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
      {/* ConfigMap 示例 */}
      <div className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>{t.gatewayClass.parametersRef} (ConfigMap示例)</div>
      <div className="info-card" style={{ display: 'block' }}>
        <div className="listener-info-grid" style={{ marginBottom: 0 }}>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.refType}</div>
            <div className="info-value">ConfigMap</div>
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

      {/* Secret 示例 */}
      <div className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>{t.gatewayClass.parametersRef} (Secret示例)</div>
      <div className="info-card" style={{ display: 'block' }}>
        <div className="listener-info-grid" style={{ marginBottom: 0 }}>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.refType}</div>
            <div className="info-value">Secret</div>
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

      {/* 自定义资源 示例 */}
      <div className="section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>{t.gatewayClass.parametersRef} ({t.gatewayClass.customResource}示例)</div>
      <div className="info-card" style={{ display: 'block' }}>
        <div className="listener-info-grid" style={{ marginBottom: 0 }}>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.refType}</div>
            <div className="info-value">test-resource-name</div>
          </div>
          <div className="info-item">
            <div className="info-label">{t.gatewayClass.apiGroup}</div>
            <div className="info-value">gateway.envoyproxy.io</div>
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
