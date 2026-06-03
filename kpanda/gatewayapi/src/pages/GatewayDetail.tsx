import { useState, useEffect } from 'react';
import { Settings, RotateCw, HelpCircle, MoreVertical, X, Check } from 'lucide-react';
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

  interface PodInstance {
    name: string;
    status: string;
    containers: string;
    ip: string;
    node: string;
    restarts: number;
    cpu: string;
    memory: string;
    createdAt: string;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null);
  const [deletePod, setDeletePod] = useState<PodInstance | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [toast, setToast] = useState('');

  const initialInstances = [
    {
      name: 'vminsert-insight-victoria-metrics-k8s-stack-79d4c6598-kwsfg',
      status: '正常',
      containers: '3/3',
      ip: '10.244.0.15',
      node: 'node-1',
      restarts: 0,
      cpu: '0.5 Core / 2 Core',
      memory: '0.5 Gi / 4 Gi',
      createdAt: '2026-06-02 15:57'
    }
  ];

  const [instances, setInstances] = useState(initialInstances);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleRefresh = () => {
    setInstances(initialInstances);
    setSearchQuery('');
    showToast('数据已刷新');
  };

  const handleConfirmDelete = () => {
    if (deletePod) {
      setInstances(instances.filter(inst => inst.name !== deletePod.name));
      showToast(`${deletePod.name} 已删除`);
      setDeletePod(null);
      setDeleteConfirmText('');
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownIdx(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const filteredInstances = instances.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    },
    {
      key: 'associatedInstances',
      title: t.gateway.associatedInstances,
      content: (
        <div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .status-spinner {
              width: 12px;
              height: 12px;
              border: 2px solid #ccc;
              border-top-color: transparent;
              border-radius: 50%;
              display: inline-block;
              animation: spin 1s linear infinite;
            }
          `}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '14px' }}>🔍</span>
              <input 
                type="text" 
                placeholder={t.gateway.searchPodPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  padding: '6px 12px 6px 30px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px', 
                  fontSize: '13px', 
                  width: '100%', 
                  outline: 'none' 
                }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                title="Settings"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}
              >
                <Settings size={16} />
              </button>
              <button 
                title="Refresh"
                onClick={handleRefresh}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}
              >
                <RotateCw size={16} />
              </button>
            </div>
          </div>

          <table className="content-table">
            <thead>
              <tr>
                <th>{t.gateway.podName}</th>
                <th>{t.gateway.podStatus}</th>
                <th>{t.gateway.containers}</th>
                <th>{t.gateway.podIp}</th>
                <th>{t.gateway.node}</th>
                <th>{t.gateway.restarts}</th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t.gateway.cpuReqLimit}
                    <HelpCircle size={14} style={{ color: '#999', cursor: 'help' }} />
                  </span>
                </th>
                <th>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t.gateway.memReqLimit}
                    <HelpCircle size={14} style={{ color: '#999', cursor: 'help' }} />
                  </span>
                </th>
                <th>{t.gateway.createdAt}</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredInstances.length > 0 ? (
                filteredInstances.map((inst, idx) => (
                  <tr key={idx} style={{ verticalAlign: 'middle' }}>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{inst.name}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {inst.status === '正常' ? (
                          <span className="status-dot success"></span>
                        ) : (
                          <span className="status-spinner"></span>
                        )}
                        {inst.status}
                      </span>
                    </td>
                    <td>{inst.containers}</td>
                    <td>{inst.ip}</td>
                    <td>{inst.node}</td>
                    <td>{inst.restarts}</td>
                    <td>{inst.cpu}</td>
                    <td>{inst.memory}</td>
                    <td>{inst.createdAt}</td>
                    <td>
                      <div className="dropdown-container" style={{ position: 'relative' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownIdx(activeDropdownIdx === idx ? null : idx);
                          }}
                          className="btn-icon-clear" 
                          style={{ padding: '4px' }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeDropdownIdx === idx && (
                          <div 
                            className="dropdown-menu visible" 
                            style={{ 
                              position: 'absolute', 
                              right: 0, 
                              top: '100%', 
                              display: 'block', 
                              zIndex: 100 
                            }}
                          >
                            <span className="dropdown-item">{t.gateway.console}</span>
                            <span className="dropdown-item">{t.gateway.viewYaml}</span>
                            <span className="dropdown-item">{t.gateway.monitoring}</span>
                            <span className="dropdown-item">{t.gateway.logs}</span>
                            <span className="dropdown-item">{t.gateway.uploadFile}</span>
                            <span className="dropdown-item">{t.gateway.downloadFile}</span>
                            <span className="dropdown-item">{t.gateway.containerList}</span>
                            <span className="dropdown-item">{t.gateway.events}</span>
                            <div className="dropdown-divider"></div>
                            <span 
                              className="dropdown-item danger" 
                              onClick={() => {
                                setDeletePod(inst);
                                setDeleteConfirmText('');
                                setActiveDropdownIdx(null);
                              }}
                            >
                              {t.gateway.delete}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#666' }}>
            <div>
              {t.gateway.totalCount.replace('{count}', String(filteredInstances.length))}
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button disabled style={{ border: '1px solid #d9d9d9', background: '#f5f5f5', color: '#ccc', borderRadius: '4px', padding: '2px 8px', cursor: 'not-allowed' }}>⟨</button>
                <span>1 / 1</span>
                <button disabled style={{ border: '1px solid #d9d9d9', background: '#f5f5f5', color: '#ccc', borderRadius: '4px', padding: '2px 8px', cursor: 'not-allowed' }}>⟩</button>
              </div>
              <div style={{ border: '1px solid #d9d9d9', padding: '4px 8px', borderRadius: '4px', background: '#fff' }}>
                {t.gateway.itemsPerPage}
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div>
      {toast && (
        <div className="toast-notification">
          <Check size={16} /> {toast}
        </div>
      )}
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

      {/* Delete Confirmation Modal */}
      {deletePod && (
        <div className="modal-overlay" onClick={() => setDeletePod(null)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 600 }}>
                {t.gateway.deletePodTitle} {deletePod.name.length > 25 ? deletePod.name.substring(0, 25) + '...' : deletePod.name}
              </h3>
              <button className="btn-icon-clear" onClick={() => setDeletePod(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning" style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#666' }}>
                <p style={{ marginBottom: '16px' }}>
                  {t.gateway.deletePodWarning.replace('{name}', deletePod.name)}
                </p>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ marginBottom: '8px' }}>
                    {t.gateway.deletePodConfirmHint.replace('{name}', deletePod.name)}
                  </p>
                  <input 
                    type="text" 
                    className="delete-confirm-input" 
                    placeholder="" 
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e8e8e8', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                className="btn-danger" 
                disabled={deleteConfirmText !== deletePod.name}
                onClick={handleConfirmDelete}
                style={{ 
                  opacity: deleteConfirmText === deletePod.name ? 1 : 0.5,
                  cursor: deleteConfirmText === deletePod.name ? 'pointer' : 'not-allowed'
                }}
              >
                {t.gateway.delete}
              </button>
              <button className="btn-default" onClick={() => setDeletePod(null)}>
                {t.gateway.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
