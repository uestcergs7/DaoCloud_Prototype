import { Policy } from '../shared/types.js';

class DB {
  private policies: Policy[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initial default policy (Root)
    const rootPolicy: Policy = {
      id: 'default-policy',
      name: 'Default (Root)',
      description: 'Default fallback policy',
      enabled: true,
      matchers: [],
      actions: [
        {
          channel: 'email',
          receivers: ['sre-team@example.com'],
        },
      ],
      grouping: {
        groupBy: ['alertname'],
        groupWait: '30s',
        groupInterval: '5m',
        repeatInterval: '4h',
      },
      isDefault: true,
      createdAt: new Date().toISOString(),
      children: [],
      parentId: null
    };

    // Level 1: Severity based
    const severityPolicies: Policy[] = [
        {
            id: 'sev-critical',
            name: 'Critical Alerts',
            description: 'Severity = Critical',
            enabled: true,
            matchers: [{ label: 'severity', operator: '=', values: ['critical'] }],
            actions: [], // Inherit or specific
            grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
            isDefault: false,
            createdAt: new Date().toISOString(),
            parentId: 'default-policy',
            children: [],
            continue: true
        },
        {
            id: 'sev-major',
            name: 'Major Alerts',
            description: 'Severity = Major',
            enabled: true,
            matchers: [{ label: 'severity', operator: '=', values: ['major'] }],
            actions: [],
            grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
            isDefault: false,
            createdAt: new Date().toISOString(),
            parentId: 'default-policy',
            children: [],
            continue: true
        },
        {
            id: 'sev-minor',
            name: 'Minor Alerts',
            description: 'Severity = Minor',
            enabled: true,
            matchers: [{ label: 'severity', operator: '=', values: ['minor'] }],
            actions: [],
            grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
            isDefault: false,
            createdAt: new Date().toISOString(),
            parentId: 'default-policy',
            children: [],
            continue: true
        }
    ];

    // Level 2: Cluster based (prod, test, dev) for each severity
    const clusterNames = ['prod', 'test', 'dev'];
    const allPolicies = [rootPolicy, ...severityPolicies];

    severityPolicies.forEach(sevPolicy => {
        clusterNames.forEach((cluster, idx) => {
            const childId = `${sevPolicy.id}-${cluster}`;
            const childPolicy: Policy = {
                id: childId,
                name: `${sevPolicy.name} - ${cluster.toUpperCase()}`,
                description: `Cluster = ${cluster}`,
                enabled: true,
                matchers: [{ label: 'cluster_name', operator: '=', values: [cluster] }],
                actions: [
                    { 
                        channel: 'email', 
                        receivers: [`${cluster}-team@example.com`] 
                    }
                ],
                grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
                isDefault: false,
                createdAt: new Date().toISOString(),
                parentId: sevPolicy.id,
                children: [],
                messageTemplate: 'default',
                repeatIntervalType: 'default'
            };
            sevPolicy.children = sevPolicy.children || [];
            sevPolicy.children.push(childPolicy);
            allPolicies.push(childPolicy);
        });
    });

    const teamPolicy: Policy = {
      id: 'team-routing',
      name: 'Team Routing',
      description: 'Route to specific teams based on label',
      enabled: true,
      matchers: [{ label: 'alertname', operator: '=', values: ['TestAlert'] }],
      actions: [],
      grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
      isDefault: false,
      createdAt: new Date().toISOString(),
      parentId: 'default-policy',
      children: [],
      continue: true
    };

    const teamProdPolicy: Policy = {
      id: 'team-routing-prod',
      name: 'Team Routing - PROD',
      description: 'Team routing for prod',
      enabled: true,
      matchers: [{ label: 'cluster_name', operator: '=', values: ['prod'] }],
      actions: [{ channel: 'webhook', receivers: ['http://team.example.com'] }],
      grouping: { groupBy: [], groupWait: '30s', groupInterval: '5m', repeatInterval: '4h' },
      isDefault: false,
      createdAt: new Date().toISOString(),
      parentId: 'team-routing',
      children: [],
      messageTemplate: 'default',
      repeatIntervalType: 'default'
    };
    teamPolicy.children = [teamProdPolicy];

    rootPolicy.children = [...severityPolicies, teamPolicy];
    this.policies = [...allPolicies, teamPolicy, teamProdPolicy];
  }

  getAllPolicies(): Policy[] {
    return this.policies;
  }

  getPolicyById(id: string): Policy | undefined {
    return this.policies.find((p) => p.id === id);
  }

  createPolicy(policy: Policy): Policy {
    // Default parent is Root if not specified
    if (!policy.parentId) {
      const root = this.policies.find(p => p.isDefault);
      if (root) {
        policy.parentId = root.id;
      }
    }

    // Add to flat list
    this.policies.push(policy);

    // Update parent's children array
    if (policy.parentId) {
      const parent = this.getPolicyById(policy.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(policy);
      }
    }

    return policy;
  }

  updatePolicy(id: string, updates: Partial<Policy>): Policy | undefined {
    const index = this.policies.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const oldPolicy = this.policies[index];
    
    // Prevent removing default flag
    if (oldPolicy.isDefault) {
      delete updates.isDefault;
      delete updates.parentId; // Root cannot have parent
    }

    // Handle parent change (Move)
    if (updates.parentId && updates.parentId !== oldPolicy.parentId) {
      // Remove from old parent
      if (oldPolicy.parentId) {
        const oldParent = this.getPolicyById(oldPolicy.parentId);
        if (oldParent && oldParent.children) {
          oldParent.children = oldParent.children.filter(child => child.id !== id);
        }
      }
      // Add to new parent
      const newParent = this.getPolicyById(updates.parentId);
      if (newParent) {
        newParent.children = newParent.children || [];
        newParent.children.push({ ...oldPolicy, ...updates } as Policy);
      }
    }

    // Merge updates
    const updatedPolicy = { ...oldPolicy, ...updates };
    this.policies[index] = updatedPolicy;

    // Update parent reference in the parent object's children array
    if (updatedPolicy.parentId && (!updates.parentId || updates.parentId === oldPolicy.parentId)) {
       const parent = this.getPolicyById(updatedPolicy.parentId);
       if (parent && parent.children) {
         const childIndex = parent.children.findIndex(c => c.id === id);
         if (childIndex !== -1) {
           parent.children[childIndex] = updatedPolicy;
         }
       }
    }

    return updatedPolicy;
  }

  deletePolicy(id: string): boolean {
    const policy = this.getPolicyById(id);
    if (!policy || policy.isDefault) return false;

    // Remove from parent
    if (policy.parentId) {
      const parent = this.getPolicyById(policy.parentId);
      if (parent && parent.children) {
        parent.children = parent.children.filter(c => c.id !== id);
      }
    }

    // Recursively delete children
    const deleteRecursively = (pId: string) => {
      const p = this.getPolicyById(pId);
      if (p && p.children) {
        p.children.forEach(c => deleteRecursively(c.id));
      }
      this.policies = this.policies.filter(item => item.id !== pId);
    };

    deleteRecursively(id);
    return true;
  }

  // Deprecated but kept for compatibility
  checkPriorityConflict(priority: number, excludeId?: string): boolean {
    return false;
  }

  reorderPolicies(orderedIds: string[]): boolean {
    if (orderedIds.length === 0) return true;
    
    const firstPolicy = this.getPolicyById(orderedIds[0]);
    if (!firstPolicy || !firstPolicy.parentId) return false;
    
    const parentId = firstPolicy.parentId;
    const parent = this.getPolicyById(parentId);
    
    if (!parent) return false;
    
    // Verify all belong to same parent
    for (const id of orderedIds) {
      const p = this.getPolicyById(id);
      if (!p || p.parentId !== parentId) return false;
    }
    
    // Reorder children
    parent.children = orderedIds.map(id => this.getPolicyById(id)!);
    
    return true;
  }

  savePolicyTree(policies: Policy[]): void {
    this.policies = policies;
  }
}

export const db = new DB();
