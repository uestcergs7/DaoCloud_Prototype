export interface Matcher {
  label: string;
  operator: string;
  values: string[];
}

export interface Action {
  channel: string;
  receivers: string[];
}

export interface Grouping {
  groupBy: string[];
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
}

export interface CustomIntervals {
  critical: number;
  warning: number;
  info: number;
}

// Per-channel receiver selections for the new notification UI
export interface ChannelReceivers {
  email: string[];
  dingtalk: string[];
  wechat: string[];
  feishu: string[];
  webhook: string[];
  insite: string[];
  sms: string[];
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  // priority: number; // Removed in favor of tree structure
  matchers: Matcher[];
  actions?: Action[]; // Optional as it can be inherited
  grouping?: Grouping; // Optional as it can be inherited
  isDefault?: boolean;
  createdAt: string;
  
  // Tree structure
  parentId?: string | null;
  children?: Policy[];
  continue?: boolean; // Continue matching siblings

  // New Configuration Fields
  messageTemplate?: string;
  repeatIntervalType?: 'default' | 'custom';
  customIntervals?: CustomIntervals;

  // Notification mode
  notificationMode?: 'none' | 'notify';
  channelReceivers?: ChannelReceivers;
}
