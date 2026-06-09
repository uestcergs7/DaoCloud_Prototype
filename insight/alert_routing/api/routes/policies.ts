import express from 'express';
import { db } from '../db.js';
import { Policy } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all policies
router.get('/', (req, res) => {
  const policies = db.getAllPolicies();
  res.json(policies);
});

// Get policy by ID
router.get('/:id', (req, res) => {
  const policy = db.getPolicyById(req.params.id);
  if (!policy) {
    return res.status(404).json({ error: '未找到策略' });
  }
  res.json(policy);
});

// Create policy
router.post('/', (req, res) => {
  const { name, description, enabled, matchers, actions, grouping, messageTemplate, repeatIntervalType, customIntervals, parentId, continue: continueMatching } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '策略名称为必填项' });
  }

  // Validate new fields
  if (!repeatIntervalType) {
    return res.status(400).json({ error: '通知发送间隔为必填项' });
  }

  if (repeatIntervalType === 'custom') {
    if (!customIntervals || !customIntervals.critical || !customIntervals.warning || !customIntervals.info) {
      return res.status(400).json({ error: '当选择自定义发送间隔时，所有告警级别的间隔都为必填项' });
    }
    if (customIntervals.critical < 1 || customIntervals.warning < 1 || customIntervals.info < 1) {
      return res.status(400).json({ error: '发送间隔必须大于等于 1 小时' });
    }
  }

  const newPolicy: Policy = {
    id: uuidv4(),
    name,
    description,
    enabled,
    matchers: matchers || [],
    actions: actions || [],
    grouping,
    createdAt: new Date().toISOString(),
    isDefault: false,
    messageTemplate,
    repeatIntervalType: repeatIntervalType || 'default',
    customIntervals: repeatIntervalType === 'custom' ? customIntervals : undefined,
    parentId: parentId || null,
    continue: continueMatching || false,
    children: []
  };

  try {
    const created = db.createPolicy(newPolicy);
    res.status(201).json(created);
  } catch (error) {
    res.status(409).json({ error: (error as Error).message });
  }
});

// Update policy
router.put('/:id', (req, res) => {
  try {
    const updated = db.updatePolicy(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Policy not found or cannot be updated' });
    }
    res.json(updated);
  } catch (error) {
    res.status(409).json({ error: (error as Error).message });
  }
});

// Reorder policies
router.post('/reorder', (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array' });
  }

  const success = db.reorderPolicies(orderedIds);
  if (!success) {
    return res.status(400).json({ error: 'Invalid policy IDs or cannot reorder default policy' });
  }

  res.json({ message: 'Policies reordered successfully' });
});

// Save entire policy tree
router.post('/save-tree', (req, res) => {
  const { policies } = req.body;
  if (!Array.isArray(policies)) {
    return res.status(400).json({ error: 'policies must be an array' });
  }

  db.savePolicyTree(policies);
  res.json({ message: 'Policy tree saved successfully' });
});

// Delete policy
router.delete('/:id', (req, res) => {
  const success = db.deletePolicy(req.params.id);
  if (!success) {
    return res.status(400).json({ error: 'Policy not found or cannot be deleted (default policy)' });
  }
  res.status(204).send();
});

export default router;
