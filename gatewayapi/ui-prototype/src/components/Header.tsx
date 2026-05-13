import { MoreHorizontal, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <div className="header-area">
      <div className="breadcrumb">
        <span className="icon">❖</span>
        <span className="label">集群:</span>
        <span className="value">{cluster}</span>
        <span className="separator">/</span>
        <span className="label">命名空间:</span>
        <span className="value">{namespace}</span>
        <span className="separator">/</span>
        <span className="value">Gateway API</span>
        <span className="separator">/</span>
        <span className="value">{type}</span>
        <span className="separator">/</span>
        <span className="value">{name}</span>
      </div>
      <div className="header-actions">
        <button className="btn-default">更新</button>
        <button className="btn-default">查看 YAML</button>
        
        <div className="dropdown-container">
          <button className="btn-default btn-icon"><MoreHorizontal size={16} /></button>
          <div className="dropdown-menu">
            <span className="dropdown-item">编辑 YAML</span>
            <span className="dropdown-item" onClick={() => setIsModalOpen(true)}>标签与注解</span>
            <div className="dropdown-divider"></div>
            <span className="dropdown-item danger">删除</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>编辑标签与注解</h3>
              <button className="btn-icon-clear" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="kv-section">
                <div className="kv-title">标签 (Labels)</div>
                <div className="kv-row header">
                  <div className="kv-col">键 (Key)</div>
                  <div className="kv-col">值 (Value)</div>
                  <div className="kv-col action"></div>
                </div>
                {mockLabels.length > 0 ? mockLabels.map((label, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" defaultValue={label.key} />
                    <input type="text" className="kv-input" defaultValue={label.value} />
                    <button className="btn-icon-clear danger"><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>暂无标签</div>
                )}
                <button className="btn-text"><Plus size={14} /> 添加标签</button>
              </div>

              <div className="kv-section" style={{ marginTop: '24px' }}>
                <div className="kv-title">注解 (Annotations)</div>
                <div className="kv-row header">
                  <div className="kv-col">键 (Key)</div>
                  <div className="kv-col">值 (Value)</div>
                  <div className="kv-col action"></div>
                </div>
                {mockAnnotations.length > 0 ? mockAnnotations.map((anno, idx) => (
                  <div className="kv-row" key={idx}>
                    <input type="text" className="kv-input" defaultValue={anno.key} />
                    <input type="text" className="kv-input" defaultValue={anno.value} />
                    <button className="btn-icon-clear danger"><Trash2 size={16} /></button>
                  </div>
                )) : (
                  <div style={{color: '#999', fontSize: 13, marginBottom: 8}}>暂无注解</div>
                )}
                <button className="btn-text"><Plus size={14} /> 添加注解</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={() => setIsModalOpen(false)}>取消</button>
              <button className="btn-primary" onClick={() => setIsModalOpen(false)}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
