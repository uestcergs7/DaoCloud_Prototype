import { useState } from 'react';

export interface Tab {
  key: string;
  title: string;
  content: React.ReactNode;
}

export function TabsCard({ tabs }: { tabs: Tab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);

  const activeTab = tabs.find(t => t.key === activeKey);

  return (
    <div>
      <div className="tabs-container">
        {tabs.map(tab => (
          <div 
            key={tab.key}
            className={`tab-item ${activeKey === tab.key ? 'active' : ''}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className="tab-content-card">
        {activeTab?.content}
      </div>
    </div>
  );
}
