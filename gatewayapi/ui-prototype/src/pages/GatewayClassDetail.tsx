import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';

export default function GatewayClassDetail() {
  const basicInfo = [
    { label: '名称', value: 'envoy-internet' },
    { label: '状态', value: 'Accepted', status: 'success' as const },
    { label: '别名', value: '-' },
    { label: '控制器', value: 'gateway.envoyproxy.io/gatewayclass-controller' },
    { label: '配置参数', value: '-' },
    { label: '创建时间', value: '2026-01-18 12:32' }
  ];

  const tabs = [
    {
      key: 'parameters',
      title: '引用资源 (ParametersRef)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>API 组 (Group)</th>
              <th>资源类型 (Kind)</th>
              <th>资源名称 (Name)</th>
              <th>命名空间 (Namespace)</th>
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
      />
      <BasicInfoCard items={basicInfo} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
