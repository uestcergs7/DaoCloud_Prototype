import React, { useState, useEffect } from 'react';
import { usePolicyStore } from '@/store/policyStore';
import { Policy, Matcher, Action, ChannelReceivers } from '../../shared/types';
import { Plus, Trash, ArrowLeft, Save, AlertCircle, RefreshCw, ChevronUp, ChevronDown, X, Search, ExternalLink, Info } from 'lucide-react';

const CHANNELS: { key: keyof ChannelReceivers; label: string; mockOptions: string[] }[] = [
  { key: 'email',    label: '邮件',   mockOptions: ['sre-team@example.com', 'ops@example.com', 'alert@example.com'] },
  { key: 'dingtalk', label: '钉钉',   mockOptions: ['dingding-group-1', 'ops-alert-group'] },
  { key: 'wechat',   label: '企业微信', mockOptions: ['wecom-ops', 'wecom-sre'] },
  { key: 'feishu',   label: '飞书',   mockOptions: ['test-lark', 'sre-lark', 'ops-lark'] },
  { key: 'webhook',  label: 'Webhook', mockOptions: ['http://hook.example.com/alert', 'http://pagerduty.example.com'] },
  { key: 'insite',   label: '站内信',  mockOptions: ['admin', 'sre-user', 'ops-user'] },
  { key: 'sms',      label: '短信',   mockOptions: ['13800138000', '13900139000'] },
];

const DEFAULT_CHANNEL_RECEIVERS: ChannelReceivers = {
  email: [], dingtalk: [], wechat: [], feishu: [], webhook: [], insite: [], sms: [],
};

const OPERATORS = [
  { value: '=', label: '=', desc: '等于' },
  { value: '!=', label: '!=', desc: '不等于' },
  { value: '=~', label: '=~', desc: '正则匹配' },
  { value: '!~', label: '!~', desc: '正则不匹配' }
];

interface PolicyFormProps {
  policyId?: string | null;
  parentId?: string | null;
  onClose: () => void;
  onSuccess: (newPolicyId?: string) => void;
}

export default function PolicyForm({ policyId, parentId, onClose, onSuccess }: PolicyFormProps) {
  const { policies, createPolicy, updatePolicy, fetchPolicies } = usePolicyStore();
  
  const isEditMode = !!policyId;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openOperatorDropdownIdx, setOpenOperatorDropdownIdx] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<Policy>>({
    name: '',
    description: '',
    enabled: true,
    matchers: [],
    actions: [],
    notificationMode: 'none',
    channelReceivers: { ...DEFAULT_CHANNEL_RECEIVERS },
    messageTemplate: '',
    repeatIntervalType: 'default',
    customIntervals: {
      critical: 1,
      warning: 2,
      info: 3,
    },
    grouping: {
      groupBy: [],
      groupWait: '30s',
      groupInterval: '5m',
      repeatInterval: '4h',
    },
    parentId: null,
    continue: false,
  });

  useEffect(() => {
    if (policies.length === 0) fetchPolicies();
  }, [fetchPolicies, policies.length]);

  // Reset form data and initialize
  useEffect(() => {
    if (isEditMode && policyId) {
      const policy = policies.find(p => p.id === policyId);
      if (policy) {
        setFormData(JSON.parse(JSON.stringify(policy))); // Deep copy
      }
    } else {
      const defaultPolicy = policies.find(p => p.isDefault);
      setFormData({
        name: '',
        description: '',
        enabled: true,
        matchers: [],
        actions: [],
        notificationMode: 'none',
        channelReceivers: { ...DEFAULT_CHANNEL_RECEIVERS },
        messageTemplate: '',
        repeatIntervalType: 'default',
        customIntervals: {
          critical: 1,
          warning: 2,
          info: 3,
        },
        grouping: {
          groupBy: [],
          groupWait: '30s',
          groupInterval: '5m',
          repeatInterval: '4h',
        },
        parentId: parentId || (defaultPolicy ? defaultPolicy.id : null),
        continue: false,
      });
      setSubmitError(null);
    }
  }, [isEditMode, policyId, policies, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate new fields
    if (!formData.messageTemplate) {
        setSubmitError('请选择消息模板');
        return;
    }

    if (!formData.repeatIntervalType) {
        setSubmitError('请选择通知发送间隔类型');
        return;
    }

    if (formData.repeatIntervalType === 'custom' && formData.customIntervals) {
        const { critical, warning, info } = formData.customIntervals;
        if (critical < 1 || warning < 1 || info < 1) {
            setSubmitError('发送间隔必须大于等于 1 小时');
            return;
        }
    }

    try {
      if (isEditMode && policyId) {
        await updatePolicy(policyId, formData);
        onSuccess();
      } else {
        const newId = await createPolicy(formData);
        onSuccess(newId ?? undefined);
      }
    } catch (error) {
      setSubmitError((error as Error).message);
    }
  };

  const addMatcher = () => {
    setFormData({
      ...formData,
      matchers: [...(formData.matchers || []), { label: '', operator: '=', values: [] }]
    });
  };

  const removeMatcher = (index: number) => {
    const newMatchers = [...(formData.matchers || [])];
    newMatchers.splice(index, 1);
    setFormData({ ...formData, matchers: newMatchers });
  };

  const updateMatcher = (index: number, field: keyof Matcher, value: any) => {
    const newMatchers = [...(formData.matchers || [])];
    if (field === 'values') {
        newMatchers[index] = { ...newMatchers[index], values: [value] };
    } else {
        newMatchers[index] = { ...newMatchers[index], [field]: value };
    }
    setFormData({ ...formData, matchers: newMatchers });
  };

  const updateChannelReceivers = (key: keyof ChannelReceivers, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      channelReceivers: {
        ...(prev.channelReceivers ?? DEFAULT_CHANNEL_RECEIVERS),
        [key]: values,
      },
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg max-h-[85vh] overflow-y-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {isEditMode ? '编辑策略' : '新增策略'}
        </h1>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">基本信息</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                策略名称
                <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${formData.isDefault ? 'bg-gray-100' : ''}`}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                readOnly={formData.isDefault}
                placeholder="名称不能为空; 可含空格但首尾不得为空格; 长度 1-255 字符; 建议使用驼峰命名。"
              />
              <p className="mt-1 text-xs text-gray-500">
                名称不能为空; 可含空格但首尾不得为空格; 长度 1-255 字符; 建议使用驼峰命名。
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                描述
              </label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述可包含任意字符，最长 1024 个字符"
              />
              <p className="mt-1 text-xs text-gray-500">
                描述可包含任意字符，最长 1024 个字符
              </p>
            </div>
            
            <div className="col-span-2 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                    type="checkbox" 
                    checked={formData.continue || false} 
                    onChange={e => setFormData({ ...formData, continue: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    disabled={formData.isDefault}
                 />
                 <span className="text-sm font-medium text-gray-700">继续匹配</span>
              </label>
              <p className="ml-2 text-xs text-gray-500">
                如果启用，匹配成功后将继续匹配其他兄弟节点。
              </p>
            </div>
          </div>
        </div>

        {/* Matchers */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-medium text-gray-900">匹配条件</h3>
                <button type="button" onClick={addMatcher} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> 添加条件
                </button>
            </div>

            {formData.matchers?.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center py-2">暂无匹配条件</p>
            )}

            {formData.matchers?.map((matcher, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                <input 
                  type="text" 
                  placeholder="标签键 (如 severity)" 
                  className="w-1/3 rounded-md border-gray-300 border p-2 text-sm"
                  value={matcher.label}
                  onChange={e => updateMatcher(idx, 'label', e.target.value)}
                />
                <div className="relative w-28 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenOperatorDropdownIdx(openOperatorDropdownIdx === idx ? null : idx)}
                    className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span className="font-mono font-medium">{matcher.operator}</span>
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {openOperatorDropdownIdx === idx && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setOpenOperatorDropdownIdx(null)} 
                      />
                      <div className="absolute left-0 mt-1 w-48 rounded-md bg-white border border-gray-200 shadow-lg z-30 py-1 max-h-60 overflow-y-auto">
                        {OPERATORS.map(op => {
                          const isSelected = matcher.operator === op.value;
                          return (
                            <button
                              key={op.value}
                              type="button"
                              onClick={() => {
                                updateMatcher(idx, 'operator', op.value);
                                setOpenOperatorDropdownIdx(null);
                              }}
                              className={`w-full text-left px-3 py-1.5 flex flex-col transition-colors hover:bg-gray-50 ${
                                isSelected ? "border-l-4 border-[#f96132] bg-gray-50/50 font-semibold" : "border-l-4 border-transparent"
                              }`}
                            >
                              <span className="font-mono font-bold text-sm text-gray-900">{op.label}</span>
                              <span className="text-xs text-gray-500 mt-0.5 font-normal">{op.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="标签值" 
                  className="flex-1 rounded-md border-gray-300 border p-2 text-sm"
                  value={matcher.values[0] ?? ''}
                  onChange={e => updateMatcher(idx, 'values', e.target.value)}
                />
                <button type="button" onClick={() => removeMatcher(idx)} className="text-red-500 hover:text-red-700">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>

        {/* Notification Mode */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-medium text-gray-900">通知方式</h3>
          </div>

          {/* Radio: 不通知 / 通知 */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-700 mr-3">
              通知方式
              <span className="text-red-500 ml-1">*</span>
            </span>
            {(['none', 'notify'] as const).map(mode => (
              <label key={mode} className="flex items-center gap-1.5 cursor-pointer mr-6">
                <span
                  onClick={() => setFormData({ ...formData, notificationMode: mode })}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 ${
                    formData.notificationMode === mode
                      ? "border-blue-500 bg-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.notificationMode === mode && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                  )}
                </span>
                <input
                  type="radio"
                  className="sr-only"
                  name="notificationMode"
                  value={mode}
                  checked={formData.notificationMode === mode}
                  onChange={() => setFormData({ ...formData, notificationMode: mode })}
                />
                <span className="text-sm text-gray-700">{mode === 'none' ? '不通知' : '通知'}</span>
              </label>
            ))}
          </div>

          {/* Channels panel — shown only when mode = notify */}
          {formData.notificationMode === 'notify' && (
            <div className="space-y-3">
              {/* 通知对象 label + info banner */}
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0 mt-2.5">
                  通知对象
                  <span className="text-red-500 ml-0.5">*</span>
                </span>
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-md px-4 py-2.5 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    在选择告警通知方式时，请确保您已经提前完成了各种通知方式的配置。如若未提前配置，请前往
                    <a href="#" className="text-blue-600 hover:underline mx-0.5">告警中心 > 通知配置</a>
                    进行相关配置。可同时配置多种及多个通知对象。
                  </p>
                </div>
              </div>

              {/* Channel rows */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {CHANNELS.map((ch, idx) => {
                  const selected = formData.channelReceivers?.[ch.key] ?? [];
                  return (
                    <div
                      key={ch.key}
                      className={`flex items-center gap-4 px-6 py-3 ${
                        idx !== CHANNELS.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      {/* Channel label */}
                      <span className="w-20 text-right text-sm font-medium text-gray-700 flex-shrink-0">
                        {ch.label}
                      </span>

                      {/* Receiver dropdown (multi-select via native with custom overlay) */}
                      <div className="relative flex-1">
                        <select
                          multiple
                          className="w-full rounded-md border border-gray-300 bg-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 appearance-none opacity-0 absolute inset-0 cursor-pointer z-10"
                          value={selected}
                          onChange={e => {
                            const vals = Array.from(e.target.selectedOptions).map(o => o.value);
                            updateChannelReceivers(ch.key, vals);
                          }}
                          size={1}
                        >
                          {ch.mockOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {/* Custom display overlay */}
                        <div className="w-full rounded-md border border-gray-300 bg-white text-sm px-3 py-1.5 h-9 flex items-center pointer-events-none">
                          {selected.length > 0 ? (
                            <span className="text-sm text-gray-700 truncate">
                              {selected.length <= 2 
                                ? selected.join(', ') 
                                : `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">请选择</span>
                          )}
                        </div>
                      </div>

                      {/* Refresh + Add link */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="刷新接收对象列表"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <a
                          href="#"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          添加{ch.label}接收对象
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* New Config Section: Template & Interval */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
           
           {/* Message Template */}
           <div className="flex items-center gap-4">
              <label className="w-24 text-right text-sm font-medium text-gray-700">
                消息模板
                <span className="text-red-600 ml-1">*</span>
              </label>
              <div className="flex-1 flex items-center gap-2">
                 <select
                    className="flex-1 rounded-md border-gray-300 border p-2 text-sm"
                    value={formData.messageTemplate || ''}
                    onChange={e => setFormData({ ...formData, messageTemplate: e.target.value })}
                 >
                    <option value="">请选择消息模板</option>
                    <option value="default">默认模板</option>
                    <option value="template1">告警模板 1</option>
                    <option value="template2">告警模板 2</option>
                 </select>
                 <a href="#" className="text-sm text-blue-600 hover:underline flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1" /> 添加消息模板
                 </a>
              </div>
           </div>

           {/* Interval Type */}
           <div className="flex items-start gap-4">
              <label className="w-24 text-right text-sm font-medium text-gray-700 mt-0.5">
                通知发送间隔
                <span className="text-red-600 ml-1">*</span>
              </label>
              <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-6">
                     <label className="inline-flex items-center">
                       <input
                         type="radio"
                         className="form-radio text-blue-600 h-4 w-4 border-gray-300 focus:ring-blue-500"
                         name="intervalType"
                         value="default"
                         checked={formData.repeatIntervalType === 'default'}
                         onChange={() => setFormData({ ...formData, repeatIntervalType: 'default' })}
                       />
                       <span className="ml-2 text-sm text-gray-700">默认发送间隔</span>
                     </label>
                     <label className="inline-flex items-center">
                       <input
                         type="radio"
                         className="form-radio text-blue-600 h-4 w-4 border-gray-300 focus:ring-blue-500"
                         name="intervalType"
                         value="custom"
                         checked={formData.repeatIntervalType === 'custom'}
                         onChange={() => setFormData({ ...formData, repeatIntervalType: 'custom' })}
                       />
                       <span className="ml-2 text-sm text-gray-700">自定义发送间隔</span>
                     </label>
                  </div>
                  {formData.repeatIntervalType === 'default' && (
                      <p className="text-xs text-gray-500">
                          默认发送间隔使用 Alertmanager 中的全局配置，默认发送间隔为 1 小时
                      </p>
                  )}
              </div>
           </div>

           {/* Custom Interval Inputs */}
           {formData.repeatIntervalType === 'custom' && (
             <div className="bg-gray-50 p-4 rounded-md ml-28 space-y-3">
                {(['critical', 'warning', 'info'] as const).map(type => (
                    <div key={type} className="flex items-center gap-2">
                       <label className="w-20 text-right text-sm text-gray-600">
                          {{ critical: '紧急告警', warning: '警告告警', info: '提示告警' }[type]}
                          <span className="text-red-600 ml-1">*</span>
                       </label>
                       <div className="flex items-center gap-2">
                           <div className="relative flex items-center border border-gray-300 rounded-md bg-white w-24">
                               <input 
                                  type="number" 
                                  min="1"
                                  className="w-full p-2 pr-8 text-sm border-none focus:ring-0 appearance-none rounded-md"
                                  value={formData.customIntervals?.[type] || 1}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setFormData({
                                      ...formData,
                                      customIntervals: {
                                        ...formData.customIntervals!,
                                        [type]: val
                                      }
                                    });
                                  }}
                                  onBlur={e => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      setFormData({
                                        ...formData,
                                        customIntervals: {
                                          ...formData.customIntervals!,
                                          [type]: val
                                        }
                                      });
                                  }}
                               />
                               <div className="absolute right-0 inset-y-0 flex flex-col border-l border-gray-200">
                                   <button
                                      type="button"
                                      onClick={() => setFormData({
                                        ...formData,
                                        customIntervals: {
                                          ...formData.customIntervals!,
                                          [type]: (formData.customIntervals?.[type] || 0) + 1
                                        }
                                      })}
                                      className="flex-1 px-1 hover:bg-gray-50 text-gray-500 border-b border-gray-200"
                                   >
                                      <ChevronUp className="w-3 h-3" />
                                   </button>
                                   <button
                                      type="button"
                                      onClick={() => setFormData({
                                        ...formData,
                                        customIntervals: {
                                          ...formData.customIntervals!,
                                          [type]: Math.max(1, (formData.customIntervals?.[type] || 0) - 1)
                                        }
                                      })}
                                      disabled={(formData.customIntervals?.[type] || 1) <= 1}
                                      className="flex-1 px-1 hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                   >
                                      <ChevronDown className="w-3 h-3" />
                                   </button>
                               </div>
                           </div>
                           <span className="text-sm text-gray-600">小时</span>
                       </div>
                    </div>
                ))}
             </div>
           )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            取消
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
