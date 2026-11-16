import {
  Activity, Bell, Box, Calculator, Compass, Cpu, Database, DatabaseZap, Fingerprint, FolderOpen, Gauge, Globe, HardDrive,
  Hash, KeyRound, Layers, LineChart, Lock, MapPin, Megaphone, Network, Radio, Router, ScrollText, Search, Server,
  Settings2, Share2, Shield, ShieldAlert, Sparkles, Split, StickyNote, Timer, User, Users, Warehouse,
  Waypoints, Workflow, Zap,
} from 'lucide-react';

// One Lucide icon (ISC licence, lucide.dev) per component kind.
// Custom components keep their typed badge instead.
export const KIND_ICONS = {
  generator: Users,
  client: User,
  dns: Compass,
  cdn: Globe,
  originshield: Shield,
  loadbalancer: Split,
  reverseproxy: Router,
  apigateway: Waypoints,
  ratelimiter: Gauge,
  service: Server,
  auth: Fingerprint,
  websocket: Radio,
  worker: Cpu,
  scheduler: Timer,
  streamproc: DatabaseZap,
  notifier: Bell,
  database: Database,
  nosql: Layers,
  cache: Zap,
  objectstore: Box,
  filestore: FolderOpen,
  search: Search,
  graphdb: Share2,
  timeseries: LineChart,
  warehouse: Warehouse,
  vectordb: Sparkles,
  geoindex: MapPin,
  queue: Workflow,
  broker: Megaphone,
  eventlog: ScrollText,
  circuitbreaker: ShieldAlert,
  monitoring: Activity,
  servicemesh: Network,
  discovery: HardDrive,
  coordination: KeyRound,
  lock: Lock,
  idgen: Hash,
  counter: Calculator,
  config: Settings2,
  note: StickyNote,
};

export function iconFor(kind) {
  return KIND_ICONS[kind] || null;
}
