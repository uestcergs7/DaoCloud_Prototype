import { HelpCircle } from 'lucide-react';

export interface InfoItem {
  label: string;
  value: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'default';
  help?: boolean;
}

export function BasicInfoCard({ items }: { items: InfoItem[] }) {
  return (
    <div>
      <div className="section-title">基本信息</div>
      <div className="info-card">
        {items.map((item, index) => (
          <div className="info-item" key={index}>
            <div className="info-value">
              {item.status && <span className={`status-dot ${item.status}`} />}
              {item.value}
            </div>
            <div className="info-label">
              {item.label}
              {item.help && <HelpCircle size={14} color="#999" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
