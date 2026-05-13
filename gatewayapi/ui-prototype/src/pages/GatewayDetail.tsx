import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';

export default function GatewayDetail() {
  const basicInfo = [
    { label: '名称', value: 'test-gw' },
    { label: '状态', value: '正常', status: 'success' as const },
    { label: '别名', value: '-' },
    { label: 'GatewayClass', value: 'envoy-gateway' },
    { label: '命名空间', value: 'bs-system' },
    { label: '创建时间', value: '2026-01-18 23:32' }
  ];

  const tabs = [
    {
      key: 'listeners',
      title: '监听端口 (Listeners)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>端口</th>
              <th>协议</th>
              <th>Hostname</th>
              <th>TLS 模式 / 证书引用</th>
              <th>允许的路由 (Allowed Routes)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>http</td>
              <td>80</td>
              <td>HTTP</td>
              <td>-</td>
              <td>-</td>
              <td>Same Namespace</td>
            </tr>
            <tr>
              <td>https-api</td>
              <td>443</td>
              <td>HTTPS</td>
              <td>api.example.com</td>
              <td>Terminate / api-example-com-tls</td>
              <td>Selector (exposed-to-gateway=true)</td>
            </tr>
          </tbody>
        </table>
      )
    },
    {
      key: 'addresses',
      title: '外部地址 (External Addresses)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>类型 (Type)</th>
              <th>值 (Value)</th>
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
      />
      <BasicInfoCard items={basicInfo} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
