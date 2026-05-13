import { Header } from '../components/Header';
import { BasicInfoCard } from '../components/BasicInfoCard';
import { TabsCard } from '../components/TabsCard';

export default function RouterDetail() {
  const basicInfo = [
    { label: '名称', value: 'http-route' },
    { label: '状态', value: '正常', status: 'success' as const },
    { label: '路由类型', value: 'HTTPRoute' },
    { label: '所属网关', value: 'test-gw (bs-system), backup-gw (default)' },
    { label: '域名匹配', value: 'hr.daocloud.test' },
    { label: '创建时间', value: '2026-01-18 23:32' }
  ];

  const tabs = [
    {
      key: 'matches',
      title: '路由规则 (Matches)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>路径 (Path)</th>
              <th>请求方法 (Method)</th>
              <th>请求头 (Headers)</th>
              <th>参数匹配 (Query Params)</th>
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
      title: '过滤器 (Filters)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>过滤器类型</th>
              <th>配置详情</th>
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
      title: '后端服务 (Backend Refs)',
      content: (
        <table className="content-table">
          <thead>
            <tr>
              <th>服务名称</th>
              <th>端口</th>
              <th>权重</th>
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
      />
      <BasicInfoCard items={basicInfo} />
      <TabsCard tabs={tabs} />
    </div>
  );
}
