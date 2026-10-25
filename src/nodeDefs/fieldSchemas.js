import { NODE_TYPES } from './nodeTypes';

// Describes editable fields per node kind for the Inspector panel.
// type: 'number' | 'select' | 'percent'
const FIELDS = {
  rate: { label: 'Request rate', unit: 'req/s', type: 'number', min: 0, max: 5000, step: 1 },
  jitter: { label: 'Rate jitter', unit: '', type: 'percent', min: 0, max: 1, step: 0.05 },
  capacity: { label: 'Capacity', unit: 'concurrent', type: 'number', min: 1, max: 5000, step: 1 },
  replicas: { label: 'Replicas', unit: 'x', type: 'number', min: 1, max: 200, step: 1 },
  cooldownSec: { label: 'Open cooldown', unit: 's', type: 'number', min: 0.5, max: 30, step: 0.5 },
  baseLatencyMs: { label: 'Base latency', unit: 'ms', type: 'number', min: 0, max: 5000, step: 1 },
  jitterMs: { label: 'Latency jitter', unit: 'ms', type: 'number', min: 0, max: 2000, step: 1 },
  failureRate: { label: 'Failure rate', unit: '', type: 'percent', min: 0, max: 1, step: 0.005 },
  queueCapacity: { label: 'Queue capacity', unit: 'msgs', type: 'number', min: 0, max: 20000, step: 10 },
  retryLimit: { label: 'Retry limit', unit: 'tries', type: 'number', min: 0, max: 10, step: 1 },
  cacheHitRate: { label: 'Cache hit rate', unit: '', type: 'percent', min: 0, max: 1, step: 0.05 },
  missPenaltyMs: { label: 'Miss penalty', unit: 'ms', type: 'number', min: 0, max: 2000, step: 1 },
  drainRate: { label: 'Drain rate', unit: 'msgs/s', type: 'number', min: 0, max: 10000, step: 5 },
  algorithm: {
    label: 'Algorithm', unit: '', type: 'select',
    options: [
      { value: 'round-robin', label: 'Round robin' },
      { value: 'least-conn', label: 'Least connections' },
      { value: 'random', label: 'Random' },
    ],
  },
};

export const FIELD_SCHEMAS = {
  generator: ['rate', 'jitter'],
  loadbalancer: ['algorithm', 'baseLatencyMs', 'jitterMs', 'failureRate', 'retryLimit'],
  ratelimiter: ['capacity', 'replicas', 'baseLatencyMs', 'jitterMs'],
  client: [],
  // other built-in kinds edit every known key of their defaultConfig, in order
};

export function fieldDef(key) {
  return FIELDS[key];
}

export function fieldsForKind(kind, customTypes) {
  if (FIELD_SCHEMAS[kind]) return FIELD_SCHEMAS[kind];
  if (NODE_TYPES[kind]) return Object.keys(NODE_TYPES[kind].defaultConfig).filter((k) => FIELDS[k]);
  const custom = customTypes?.[kind];
  return custom?.fields || Object.keys(custom?.defaultConfig || {});
}

export const ALL_FIELD_KEYS = Object.keys(FIELDS);
export { FIELDS };
