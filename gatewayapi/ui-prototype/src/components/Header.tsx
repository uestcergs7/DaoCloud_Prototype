import { MoreHorizontal, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../I18nContext';

interface HeaderProps {
  cluster: string;
  namespace: string;
  type: string;
  name: string;
  mockLabels?: { key: string; value: string }[];
  mockAnnotations?: { key: string; value: string }[];
}

export function Header({ cluster, namespace, type, name, mockLabels = [], mockAnnotations = [] }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useI18n();

  return (
    <div className="header-area">
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
        <button className="btn-default">{t.header.update}</button>
        <button className="btn-default">{t.header.viewYaml}</button>
        
        <div className="dropdown-container">
          <button className="btn-default btn-icon"><MoreHorizontal size={16} /></button>
          <div className="dropdown-menu">
            <span className="dropdown-item">{t.header.editYaml}</span>
            <span className="dropdown-item" onClick={() => setIsModalOpen(true)}>{t.header.labelsAnnotations}</span>
            <div className="dropdown-divider"></div>
            <span className="dropdown-item danger">{t.header.delete}</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t.header.editLabelsAnnotations}</h3>
              <button className="btn-icon-clear" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="kv-section">
                <div className="kv-title">{t.header.labels}</div>
                <div className="kv-row header">
                  <div className="kv-col">{t.header.key}</div>
                  <div className="kv-col">{t.header.value}</div>
                  <div className="kv-col action"></div>
                </div>
                {mockLabels.length > 0 ? mockLabels.map((label, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" defaultValue={label.key} />
                    <input type="text" className="kv-input" defaultValue={label.value} />
                    <button className="btn-icon-clear danger"><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>{t.header.noLabels}</div>
                )}
                <button className="btn-text"><Plus size={14} /> {t.header.addLabel}</button>
              </div>

              <div className="kv-section" style={{ marginTop: '24px' }}>
                <div className="kv-title">{t.header.annotations}</div>
                <div className="kv-row header">
                  <div className="kv-col">{t.header.key}</div>
                  <div className="kv-col">{t.header.value}</div>
                  <div className="kv-col action"></div>
                </div>
                {mockAnnotations.length > 0 ? mockAnnotations.map((anno, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" defaultValue={anno.key} />
                    <input type="text" className="kv-input" defaultValue={anno.value} />
                    <button className="btn-icon-clear danger"><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>{t.header.noAnnotations}</div>
                )}
                <button className="btn-text"><Plus size={14} /> {t.header.addAnnotation}</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={() => setIsModalOpen(false)}>{t.header.cancel}</button>
              <button className="btn-primary" onClick={() => setIsModalOpen(false)}>{t.header.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
