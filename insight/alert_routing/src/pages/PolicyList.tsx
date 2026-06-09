import React, { useEffect, useState } from 'react';
import { usePolicyStore } from '@/store/policyStore';
import { 
  RefreshCw,
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  X, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Folder,
  FolderOpen,
  FileCode,
  ArrowUpToLine,
  ArrowDownToLine,
  FolderPlus
} from 'lucide-react';
import { Policy } from '../../shared/types';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import PolicyForm from './PolicyForm';

interface FlattenedPolicy {
  policy: Policy;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
}

export default function PolicyList() {
  const navigate = useNavigate();
  const { policies, loading, fetchPolicies, savePolicyTree, updatePolicy, deletePolicy, reorderPolicies } = usePolicyStore();
  // YAML text is maintained internally for code-level use only (not shown in UI)
  const [yamlText, setYamlText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ matched: boolean; results?: { policyName: string; path: string[] }[] } | null>(null);
  const [showTestMenu, setShowTestMenu] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const isGlobalEnabled = true;

  // Collapsible tree node IDs
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('alert_routing_collapsed_ids');
    return saved ? JSON.parse(saved) : {};
  });

  const defaultTestData = '[\n  {\n    "labels": { "alertname": "TestAlert", "severity": "critical", "cluster_name": "prod" },\n    "annotations": { "summary": "This is a test alert" }\n  }\n]';
  const [showTestDataModal, setShowTestDataModal] = useState(false);
  const [testDataStr, setTestDataStr] = useState(defaultTestData);

  // Modal State for PolicyForm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  // insertPosition: 'child' | 'sibling-above' | 'sibling-below'
  const [insertPosition, setInsertPosition] = useState<'child' | 'sibling-above' | 'sibling-below'>('child');
  // Reference policy id for sibling insert (the current node, not its parent)
  const [insertRefId, setInsertRefId] = useState<string | null>(null);

  // + dropdown menu open state per policy id
  const [openPlusMenuId, setOpenPlusMenuId] = useState<string | null>(null);

  const toggleConfirmPolicy = null;
  const showGlobalConfirm = false;

  const handleCreateChildPolicy = (parentId: string) => {
    setEditingPolicyId(null);
    setAddingParentId(parentId);
    setInsertPosition('child');
    setInsertRefId(null);
    setIsFormOpen(true);
    setOpenPlusMenuId(null);
  };

  const handleCreateSiblingPolicy = (policy: Policy, position: 'sibling-above' | 'sibling-below') => {
    setEditingPolicyId(null);
    // Sibling shares the same parent
    setAddingParentId(policy.parentId ?? null);
    setInsertPosition(position);
    setInsertRefId(policy.id);
    setIsFormOpen(true);
    setOpenPlusMenuId(null);
  };

  const handleEditPolicy = (policyId: string) => {
    setEditingPolicyId(policyId);
    setAddingParentId(null);
    setIsFormOpen(true);
    setOpenPlusMenuId(null);
  };

  const handleFormSuccess = async (newPolicyId?: string) => {
    setIsFormOpen(false);
    await fetchPolicies();
    // After create, reorder if needed for sibling insert
    if (newPolicyId && insertRefId && (insertPosition === 'sibling-above' || insertPosition === 'sibling-below')) {
      // Get fresh policies after fetch
      const store = usePolicyStore.getState();
      const freshPolicies = store.policies;
      const refPolicy = freshPolicies.find(p => p.id === insertRefId);
      if (refPolicy && refPolicy.parentId) {
        const parent = freshPolicies.find(p => p.id === refPolicy.parentId);
        if (parent && parent.children) {
          const siblings = parent.children.map(c => c.id).filter(id => id !== newPolicyId);
          const refIndex = siblings.indexOf(insertRefId);
          if (refIndex !== -1) {
            const insertAt = insertPosition === 'sibling-above' ? refIndex : refIndex + 1;
            siblings.splice(insertAt, 0, newPolicyId);
            await reorderPolicies(siblings);
            await fetchPolicies();
          }
        }
      }
    }
    setTimeout(() => refreshYamlText(), 100);
  };

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const convertToYaml = (policyData: Policy[]): string => {
    const rootPolicies = policyData.filter(p => !p.parentId);
    
    const cleanPolicy = (p: Policy): any => {
      const { id, parentId, createdAt, children, ...rest } = p;
      const cleaned: any = { ...rest };
      if (children && children.length > 0) {
        cleaned.routes = children.map(cleanPolicy);
      }
      return cleaned;
    };

    const treeData = rootPolicies.map(cleanPolicy);
    return yaml.dump(treeData, { indent: 2, noRefs: true });
  };

  useEffect(() => {
    if (policies.length > 0 && !yamlText) {
      setYamlText(convertToYaml(policies));
    }
  }, [policies, yamlText]);

  // Update yaml text (code-level only, not shown in UI)
  const refreshYamlText = () => {
    setYamlText(convertToYaml(policies));
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('alert_routing_collapsed_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDelete = async (policy: Policy) => {
    if (policy.isDefault) {
      alert('无法删除默认策略');
      return;
    }
    const message = policy.children && policy.children.length > 0
      ? `确定要删除策略 "${policy.name}" 及其所有子策略吗？`
      : `确定要删除策略 "${policy.name}" 吗？`;
    if (confirm(message)) {
      try {
        await deletePolicy(policy.id);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        refreshYamlText();
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  const handleCancel = () => {
    navigate('/alerts');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const parsed = yaml.load(yamlText) as any[];
      if (!Array.isArray(parsed)) throw new Error('YAML 必须是一个策略数组');

      const flatList: Policy[] = [];
      const processNode = (node: any, parentId: string | null = null): string => {
        const id = uuidv4();
        const { routes, ...rest } = node;
        const policy: Policy = {
          ...rest,
          id,
          parentId,
          createdAt: new Date().toISOString(),
          children: []
        };
        flatList.push(policy);
        if (routes && Array.isArray(routes)) {
          routes.forEach((child: any) => {
            processNode(child, id);
          });
        }
        return id;
      };

      parsed.forEach(node => processNode(node));
      
      if (!flatList.some(p => p.isDefault)) {
          const existingDefault = policies.find(p => p.isDefault);
          if (existingDefault) {
              flatList.unshift(existingDefault);
          }
      }

      await savePolicyTree(flatList);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDryRun = (mode: number) => {
    setShowTestMenu(false);
    if (mode === 0) {
      setTestResult({
        matched: false,
        results: []
      });
    } else if (mode === 1) {
      setTestResult({
        matched: true,
        results: [
          {
            policyName: 'Critical Alerts - PROD',
            path: ['Default (Root)', 'Critical Alerts', 'Critical Alerts - PROD']
          }
        ]
      });
    } else {
      setTestResult({
        matched: true,
        results: [
          {
            policyName: 'Critical Alerts - PROD',
            path: ['Default (Root)', 'Critical Alerts', 'Critical Alerts - PROD']
          },
          {
            policyName: 'Team Routing - PROD',
            path: ['Default (Root)', 'Team Routing', 'Team Routing - PROD']
          }
        ]
      });
    }
  };

  // Helper: flatten tree to render table
  const getFlattenedPolicies = (policyList: Policy[]): FlattenedPolicy[] => {
    const roots = policyList.filter(p => !p.parentId);
    const result: FlattenedPolicy[] = [];

    const traverse = (p: Policy, depth: number) => {
      const hasChildren = !!(p.children && p.children.length > 0);
      const isCollapsed = !!collapsedIds[p.id];
      
      result.push({
        policy: p,
        depth,
        hasChildren,
        isCollapsed
      });

      if (hasChildren && !isCollapsed) {
        p.children!.forEach(child => traverse(child, depth + 1));
      }
    };

    roots.forEach(root => traverse(root, 0));
    return result;
  };

  const flattenedPolicies = getFlattenedPolicies(policies);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">通知策略配置</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => setShowTestDataModal(true)}
          >
            <Edit3 className="w-4 h-4" />
            编辑测试数据
          </button>
          <div className="relative">
            <button
              onClick={() => setShowTestMenu(!showTestMenu)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 text-sm font-medium rounded-md hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              测试
            </button>
            {showTestMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTestMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
                  <button onClick={() => handleDryRun(0)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">未匹配任何策略</button>
                  <button onClick={() => handleDryRun(1)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">匹配1条策略</button>
                  <button onClick={() => handleDryRun(2)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">匹配2条策略</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

          {showBanner && (
        <div className="bg-[#e6f4ff] border border-[#91caff] rounded-md px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 fill-[#1677ff] text-white flex-shrink-0" />
            <span className="text-sm text-gray-800">
              通知策略内容及测试数据内容可参考<a href="#" className="text-[#1677ff] hover:underline cursor-pointer">通知策略配置</a>。
            </span>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center gap-3 flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 flex items-center gap-3 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-700">配置保存成功！</p>
        </div>
      )}

      {testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[90vw] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-600" /> 测试结果
              </h3>
              <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">匹配状态:</span>
                  {testResult.results && testResult.results.length > 0 ? (
                    <span className="ml-2 text-green-600 font-bold">已匹配 {testResult.results.length} 条策略</span>
                  ) : (
                    <span className="ml-2 text-red-500 font-bold">未匹配任何策略</span>
                  )}
                </div>
                
                {testResult.results?.map((res, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-md p-4 space-y-4">
                    <div className="font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      匹配结果 {idx + 1}
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium block mb-2">匹配路径:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {res.path.map((step, i) => (
                          <React.Fragment key={i}>
                            <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-indigo-800">{step}</span>
                            {i < res.path.length - 1 && <span className="text-indigo-300">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium block mb-2">最终策略:</span>
                      <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-200 font-medium">
                        {res.policyName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="w-[35%] px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">策略名称</th>
                  <th className="w-[25%] px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">匹配条件</th>
                  <th className="w-[20%] px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">通知方式</th>
                  <th className="w-[15%] px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">发送间隔 / 模板</th>
                  <th className="w-[150px] px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && flattenedPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                      加载策略中...
                    </td>
                  </tr>
                ) : flattenedPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                      暂无通知策略配置，请点击顶部按钮“新增根策略”开始创建。
                    </td>
                  </tr>
                ) : (
                  flattenedPolicies.map(({ policy, depth, hasChildren, isCollapsed }) => (
                    <tr 
                      key={policy.id} 
                      className={cn(
                        "hover:bg-blue-50/20 transition-colors group",
                        policy.isDefault ? "bg-gray-50/50 font-medium" : ""
                      )}
                    >
                      {/* Name with indentation and folder icons */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                          <div className="w-5 h-5 flex items-center justify-center mr-1">
                            {hasChildren ? (
                              <button 
                                onClick={() => toggleCollapse(policy.id)} 
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <div className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="mr-2 flex-shrink-0">
                            {hasChildren ? (
                              isCollapsed ? (
                                <Folder className="w-4 h-4 text-blue-400 fill-blue-50" />
                              ) : (
                                <FolderOpen className="w-4 h-4 text-blue-500 fill-blue-50" />
                              )
                            ) : (
                              <FileCode className="w-4 h-4 text-gray-400" />
                            )}
                          </span>
                          <span className="truncate" title={policy.name}>{policy.name}</span>
                          {policy.isDefault && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 rounded">
                              默认根
                            </span>
                          )}
                          {policy.continue && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded">
                              继续匹配
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Matchers list */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {policy.matchers && policy.matchers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto">
                            {policy.matchers.map((m, idx) => (
                              <span 
                                key={idx} 
                                className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs whitespace-nowrap"
                              >
                                <span className="font-semibold text-gray-600">{m.label}</span>
                                <span className="mx-1 text-gray-400">{m.operator}</span>
                                <span className="text-gray-800">{m.values.join(', ')}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">默认（匹配所有）</span>
                        )}
                      </td>

                      {/* Notification actions */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {policy.actions && policy.actions.length > 0 ? (
                          <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
                            {policy.actions.map((action, idx) => {
                              const channelColor = 
                                action.channel === 'email' ? "bg-sky-50 text-sky-700 border-sky-200" :
                                action.channel === 'feishu' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                "bg-purple-50 text-purple-700 border-purple-200";
                              return (
                                <div key={idx} className="flex items-center text-xs gap-1.5">
                                  <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight", channelColor)}>
                                    {action.channel}
                                  </span>
                                  <span className="text-gray-600 truncate max-w-[120px]" title={action.receivers.join(', ')}>
                                    {action.receivers.length <= 2 
                                      ? action.receivers.join(', ') 
                                      : `${action.receivers.slice(0, 2).join(', ')} +${action.receivers.length - 2}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">继承父节点配置</span>
                        )}
                      </td>

                      {/* Template & Interval */}
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div>
                            <span className="text-gray-400 font-medium">模板:</span>
                            <span className="font-semibold text-gray-700">
                              {policy.messageTemplate === 'default' ? '默认模板' : 
                               policy.messageTemplate === 'template1' ? '告警模板 1' : 
                               policy.messageTemplate === 'template2' ? '告警模板 2' : 
                               policy.messageTemplate || '继承父级'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">间隔:</span>
                            {policy.repeatIntervalType === 'custom' && policy.customIntervals ? (
                              <span className="font-semibold text-indigo-600" title={`紧急:${policy.customIntervals.critical}h / 警告:${policy.customIntervals.warning}h / 提示:${policy.customIntervals.info}h`}>
                                自定义 ({policy.customIntervals.critical}/{policy.customIntervals.warning}/{policy.customIntervals.info}h)
                              </span>
                            ) : policy.repeatIntervalType === 'default' ? (
                              <span className="font-semibold text-gray-700">默认 (1小时)</span>
                            ) : (
                              <span className="text-gray-400 italic">继承父级</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Operations */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3 text-gray-400">
                          {/* + Dropdown Menu */}
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setOpenPlusMenuId(openPlusMenuId === policy.id ? null : policy.id)}
                              className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                              title="新增：子节点 / 上方兄弟节点 / 下方兄弟节点"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {openPlusMenuId === policy.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenPlusMenuId(null)} />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-30 py-1 text-left">
                                  {!policy.isDefault && (
                                    <>
                                      <button
                                        onClick={() => handleCreateSiblingPolicy(policy, 'sibling-above')}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                      >
                                        <ArrowUpToLine className="w-3.5 h-3.5 flex-shrink-0" />
                                        在上方插入兄弟节点
                                      </button>
                                      <button
                                        onClick={() => handleCreateSiblingPolicy(policy, 'sibling-below')}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                      >
                                        <ArrowDownToLine className="w-3.5 h-3.5 flex-shrink-0" />
                                        在下方插入兄弟节点
                                      </button>
                                      <div className="border-t border-gray-100 my-1" />
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleCreateChildPolicy(policy.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5 flex-shrink-0" />
                                    添加子节点
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Edit Policy (edit icon) */}
                          <button 
                            type="button"
                            onClick={() => handleEditPolicy(policy.id)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="编辑策略"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>

                          {/* Delete Policy (trash icon) */}
                          {!policy.isDefault ? (
                            <button 
                              onClick={() => handleDelete(policy)} 
                              className="p-1 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="删除策略"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          ) : (
                            <div className="w-6 h-6" /> // Placeholder to keep spacing
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Modals for testing & data simulation */}
      {showTestDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[90vw] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">编辑测试数据</h2>
              <button onClick={() => setShowTestDataModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1">
              <textarea
                value={testDataStr}
                onChange={(e) => setTestDataStr(e.target.value)}
                className="w-full h-[400px] p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end items-center gap-3">
              <button
                onClick={() => setShowTestDataModal(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setTestDataStr(defaultTestData)}
                className="flex items-center gap-2 px-4 py-2 bg-[#e8e9eb] text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                还原默认值
              </button>
              <button
                onClick={() => {
                  try {
                    JSON.parse(testDataStr);
                    setShowTestDataModal(false);
                  } catch (e) {
                    alert('JSON 格式不正确，请检查！');
                  }
                }}
                className="flex items-center gap-2 px-8 py-2 bg-[#3b66d4] text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PolicyForm Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[95vw] border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <PolicyForm 
              policyId={editingPolicyId}
              parentId={addingParentId}
              onClose={() => setIsFormOpen(false)}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
