import { create } from 'zustand';
import { Policy } from '../../shared/types';
import { cloneMockPolicies } from '../data/mockPolicies';

const STATIC_POLICIES_KEY = 'alert_routing_mock_policies';

let useStaticPolicies = false;

const clonePolicies = (policies: Policy[]): Policy[] => JSON.parse(JSON.stringify(policies));

const loadStaticPolicies = (): Policy[] => {
  const saved = localStorage.getItem(STATIC_POLICIES_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      localStorage.removeItem(STATIC_POLICIES_KEY);
    }
  }

  const seeded = cloneMockPolicies();
  localStorage.setItem(STATIC_POLICIES_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveStaticPolicies = (policies: Policy[]) => {
  localStorage.setItem(STATIC_POLICIES_KEY, JSON.stringify(clonePolicies(policies)));
};

const createPolicyId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `policy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const removePolicyAndChildren = (policies: Policy[], id: string): Policy[] => {
  const idsToRemove = new Set<string>();
  const collect = (policyId: string) => {
    idsToRemove.add(policyId);
    policies
      .filter(policy => policy.parentId === policyId)
      .forEach(child => collect(child.id));
  };

  collect(id);
  return policies.filter(policy => !idsToRemove.has(policy.id));
};

// Helper function to build tree from flat list
const buildPolicyTree = (flatPolicies: Policy[]): Policy[] => {
  const policyMap = new Map<string, Policy>();
  
  // First pass: create map and reset children arrays
  flatPolicies.forEach(policy => {
    policyMap.set(policy.id, { ...policy, children: [] });
  });
  
  // Second pass: build tree
  const roots: Policy[] = [];
  flatPolicies.forEach(policy => {
    const p = policyMap.get(policy.id)!;
    if (p.parentId) {
      const parent = policyMap.get(p.parentId);
      if (parent) {
        parent.children!.push(p);
      }
    } else {
      roots.push(p);
    }
  });
  
  // Flatten back but with correct children structure
  const result: Policy[] = [];
  const collect = (policies: Policy[]) => {
    policies.forEach(p => {
      result.push(p);
      if (p.children && p.children.length > 0) {
        collect(p.children);
      }
    });
  };
  collect(roots);
  return result;
};

interface PolicyStore {
  policies: Policy[];
  loading: boolean;
  error: string | null;
  fetchPolicies: () => Promise<void>;
  createPolicy: (policy: Partial<Policy>) => Promise<string | null>;
  updatePolicy: (id: string, updates: Partial<Policy>) => Promise<void>;
  deletePolicy: (id: string) => Promise<void>;
  reorderPolicies: (orderedIds: string[]) => Promise<void>;
  savePolicyTree: (policies: Policy[]) => Promise<void>;
}

export const usePolicyStore = create<PolicyStore>((set, get) => ({
  policies: [],
  loading: false,
  error: null,

  fetchPolicies: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/policies');
      if (!res.ok) throw new Error('Failed to fetch policies');
      const data = await res.json();
      const flatPolicies = Array.isArray(data) ? data : (data.data || []);
      const policies = buildPolicyTree(flatPolicies);
      useStaticPolicies = false;
      set({ policies, loading: false });
    } catch (error) {
      const flatPolicies = loadStaticPolicies();
      const policies = buildPolicyTree(flatPolicies);
      useStaticPolicies = true;
      set({ policies, loading: false, error: null });
    }
  },

  createPolicy: async (policy) => {
    set({ loading: true, error: null });
    if (useStaticPolicies) {
      const flatPolicies = loadStaticPolicies();
      const parentId = policy.parentId ?? flatPolicies.find(p => p.isDefault)?.id ?? null;
      const newPolicy: Policy = {
        id: createPolicyId(),
        name: policy.name || 'New Policy',
        enabled: policy.enabled ?? true,
        matchers: policy.matchers ?? [],
        actions: policy.actions ?? [],
        grouping: policy.grouping,
        isDefault: false,
        createdAt: new Date().toISOString(),
        children: [],
        ...policy,
        parentId,
      };
      const updated = [...flatPolicies, newPolicy];
      saveStaticPolicies(updated);
      set({ policies: buildPolicyTree(updated), loading: false });
      return newPolicy.id;
    }

    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create policy');
      }
      const created = await res.json();
      await get().fetchPolicies();
      return created.id as string;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updatePolicy: async (id, updates) => {
    set({ loading: true, error: null });
    if (useStaticPolicies) {
      const flatPolicies = loadStaticPolicies();
      const updated = flatPolicies.map(policy => {
        if (policy.id !== id) return policy;
        const sanitizedUpdates = policy.isDefault
          ? { ...updates, isDefault: policy.isDefault, parentId: policy.parentId }
          : updates;
        return { ...policy, ...sanitizedUpdates };
      });
      saveStaticPolicies(updated);
      set({ policies: buildPolicyTree(updated), loading: false });
      return;
    }

    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update policy');
      }
      await get().fetchPolicies();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deletePolicy: async (id) => {
    set({ loading: true, error: null });
    if (useStaticPolicies) {
      const flatPolicies = loadStaticPolicies();
      const target = flatPolicies.find(policy => policy.id === id);
      if (!target || target.isDefault) {
        const error = new Error('Policy not found or cannot be deleted');
        set({ error: error.message, loading: false });
        throw error;
      }
      const updated = removePolicyAndChildren(flatPolicies, id);
      saveStaticPolicies(updated);
      set({ policies: buildPolicyTree(updated), loading: false });
      return;
    }

    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete policy');
      }
      await get().fetchPolicies();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  reorderPolicies: async (orderedIds) => {
    // Optimistic update (optional, but good for UX)
    // set(state => {
    //     // Complex to sort tree optimistically without full logic, so maybe skip or simple reorder
    //     return { policies: state.policies }; 
    // });

    if (useStaticPolicies) {
      const flatPolicies = loadStaticPolicies();
      const order = new Map(orderedIds.map((id, index) => [id, index]));
      const updated = [...flatPolicies].sort((a, b) => {
        const aOrder = order.get(a.id);
        const bOrder = order.get(b.id);
        if (aOrder === undefined && bOrder === undefined) return 0;
        if (aOrder === undefined) return 1;
        if (bOrder === undefined) return -1;
        return aOrder - bOrder;
      });
      saveStaticPolicies(updated);
      set({ policies: buildPolicyTree(updated) });
      return;
    }

    try {
      const res = await fetch('/api/policies/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      await get().fetchPolicies();
    } catch (error) {
      console.error(error);
      await get().fetchPolicies(); // Revert on error
    }
  },

  savePolicyTree: async (policies) => {
    set({ loading: true, error: null });
    if (useStaticPolicies) {
      const flatPolicies = clonePolicies(policies).map(policy => ({ ...policy, children: [] }));
      saveStaticPolicies(flatPolicies);
      set({ policies: buildPolicyTree(flatPolicies), loading: false });
      return;
    }

    try {
      const res = await fetch('/api/policies/save-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save policy tree');
      }
      await get().fetchPolicies();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  }
}));
