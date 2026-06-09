import { create } from 'zustand';
import { Policy } from '../../shared/types';

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
      set({ policies, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createPolicy: async (policy) => {
    set({ loading: true, error: null });
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
