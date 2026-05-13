import { MoreHorizontal, X, Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../I18nContext';

interface HeaderProps {
  cluster: string;
  namespace: string;
  type: string;
  name: string;
  mockLabels?: { key: string; value: string }[];
  mockAnnotations?: { key: string; value: string }[];
  yamlContent?: string;
}

type ModalType = 'none' | 'labels' | 'viewYaml' | 'editYaml' | 'update' | 'delete';

export function Header({ cluster, namespace, type, name, mockLabels = [], mockAnnotations = [], yamlContent = '' }: HeaderProps) {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [labels, setLabels] = useState(mockLabels);
  const [annotations, setAnnotations] = useState(mockAnnotations);
  const [editableYaml, setEditableYaml] = useState(yamlContent);
  const [toast, setToast] = useState('');
  const t = useI18n();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const closeModal = () => setActiveModal('none');

  // Labels handlers
  const addLabel = () => setLabels([...labels, { key: '', value: '' }]);
  const removeLabel = (idx: number) => setLabels(labels.filter((_, i) => i !== idx));
  const updateLabel = (idx: number, field: 'key' | 'value', val: string) => {
    const next = [...labels];
    next[idx] = { ...next[idx], [field]: val };
    setLabels(next);
  };

  // Annotations handlers
  const addAnnotation = () => setAnnotations([...annotations, { key: '', value: '' }]);
  const removeAnnotation = (idx: number) => setAnnotations(annotations.filter((_, i) => i !== idx));
  const updateAnnotation = (idx: number, field: 'key' | 'value', val: string) => {
    const next = [...annotations];
    next[idx] = { ...next[idx], [field]: val };
    setAnnotations(next);
  };

  return (
    <div className="header-area">
      {/* Toast notification */}
      {toast && <div className="toast-notification"><Check size={16} /> {toast}</div>}

      <div className="breadcrumb">
        <span className="icon">❖</span>
        <span className="label">{t.header.cluster}:</span>
        <span className="value">{cluster}</span>
        <span className="separator">/</span>
        <span className="label">{t.header.namespace}:</span>
        <span className="value">{namespace}</span>
        <span className="separator">/</span>
        <span className="value">Gateway API</span>
        <span className="separator">/</span>
        <span className="value">{type}</span>
        <span className="separator">/</span>
        <span className="value">{name}</span>
      </div>
      <div className="header-actions">
        <button className="btn-default" onClick={() => setActiveModal('update')}>{t.header.update}</button>
        <button className="btn-default" onClick={() => { setEditableYaml(yamlContent); setActiveModal('viewYaml'); }}>{t.header.viewYaml}</button>
        
        <div className="dropdown-container">
          <button className="btn-default btn-icon"><MoreHorizontal size={16} /></button>
          <div className="dropdown-menu">
            <span className="dropdown-item" onClick={() => { setEditableYaml(yamlContent); setActiveModal('editYaml'); }}>{t.header.editYaml}</span>
            <span className="dropdown-item" onClick={() => setActiveModal('labels')}>{t.header.labelsAnnotations}</span>
            <div className="dropdown-divider"></div>
            <span className="dropdown-item danger" onClick={() => setActiveModal('delete')}>{t.header.delete}</span>
          </div>
        </div>
      </div>

      {/* ===== Labels & Annotations Modal ===== */}
      {activeModal === 'labels' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.header.editLabelsAnnotations}</h3>
              <button className="btn-icon-clear" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="kv-section">
                <div className="kv-title">{t.header.labels}</div>
                <div className="kv-row header">
                  <div className="kv-col">{t.header.key}</div>
                  <div className="kv-col">{t.header.value}</div>
                  <div className="kv-col action"></div>
                </div>
                {labels.length > 0 ? labels.map((label, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" value={label.key} onChange={e => updateLabel(idx, 'key', e.target.value)} placeholder="key" />
                    <input type="text" className="kv-input" value={label.value} onChange={e => updateLabel(idx, 'value', e.target.value)} placeholder="value" />
                    <button className="btn-icon-clear danger" onClick={() => removeLabel(idx)}><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>{t.header.noLabels}</div>
                )}
                <button className="btn-text" onClick={addLabel}><Plus size={14} /> {t.header.addLabel}</button>
              </div>

              <div className="kv-section" style={{ marginTop: '24px' }}>
                <div className="kv-title">{t.header.annotations}</div>
                <div className="kv-row header">
                  <div className="kv-col">{t.header.key}</div>
                  <div className="kv-col">{t.header.value}</div>
                  <div className="kv-col action"></div>
                </div>
                {annotations.length > 0 ? annotations.map((anno, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" value={anno.key} onChange={e => updateAnnotation(idx, 'key', e.target.value)} placeholder="key" />
                    <input type="text" className="kv-input" value={anno.value} onChange={e => updateAnnotation(idx, 'value', e.target.value)} placeholder="value" />
                    <button className="btn-icon-clear danger" onClick={() => removeAnnotation(idx)}><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>{t.header.noAnnotations}</div>
                )}
                <button className="btn-text" onClick={addAnnotation}><Plus size={14} /> {t.header.addAnnotation}</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={closeModal}>{t.header.cancel}</button>
              <button className="btn-primary" onClick={() => { closeModal(); showToast('标签与注解已保存'); }}>{t.header.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== View YAML Modal (Read-only) ===== */}
      {activeModal === 'viewYaml' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.header.viewYaml}</h3>
              <button className="btn-icon-clear" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <pre className="yaml-viewer">{yamlContent}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={() => { navigator.clipboard.writeText(yamlContent); showToast('YAML 已复制到剪贴板'); }}>复制</button>
              <button className="btn-primary" onClick={closeModal}>{t.header.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit YAML Modal ===== */}
      {activeModal === 'editYaml' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.header.editYaml}</h3>
              <button className="btn-icon-clear" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <textarea
                className="yaml-editor"
                value={editableYaml}
                onChange={e => setEditableYaml(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={closeModal}>{t.header.cancel}</button>
              <button className="btn-primary" onClick={() => { closeModal(); showToast('YAML 已保存'); }}>{t.header.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Update Confirmation Modal ===== */}
      {activeModal === 'update' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.header.update} {type}</h3>
              <button className="btn-icon-clear" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="confirm-text">确认要更新资源 <strong>{name}</strong> 吗？系统将重新同步该资源的最新配置。</p>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={closeModal}>{t.header.cancel}</button>
              <button className="btn-primary" onClick={() => { closeModal(); showToast(`${name} 已成功更新`); }}>{t.header.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {activeModal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#d32f2f' }}>{t.header.delete} {type}</h3>
              <button className="btn-icon-clear" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <p>⚠️ 此操作不可撤销。即将永久删除以下资源：</p>
                <div className="delete-target">
                  <div><strong>{type}</strong>: {name}</div>
                  <div>Namespace: {namespace}</div>
                  <div>Cluster: {cluster}</div>
                </div>
                <p style={{ marginTop: 12 }}>请输入资源名称 <strong>{name}</strong> 以确认删除：</p>
                <input type="text" className="delete-confirm-input" id="delete-confirm-input" placeholder={name} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={closeModal}>{t.header.cancel}</button>
              <button className="btn-danger" onClick={() => {
                const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                if (input?.value === name) {
                  closeModal();
                  showToast(`${name} 已删除`);
                } else {
                  input?.classList.add('shake');
                  setTimeout(() => input?.classList.remove('shake'), 500);
                }
              }}>{t.header.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
