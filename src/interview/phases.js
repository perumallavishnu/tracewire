// Timed mock-interview flow. minutes are targets, not hard limits.

export const PHASES = [
  {
    name: 'Clarify',
    minutes: 5,
    prompts: ['Who are the users and what are the core features?', 'What is out of scope?', 'Which matters more here: latency, consistency or cost?'],
  },
  {
    name: 'Estimate',
    minutes: 5,
    prompts: ['Peak read and write QPS', 'Storage after 5 years', 'Bandwidth in and out'],
  },
  {
    name: 'API & data',
    minutes: 7,
    prompts: ['List the 3-5 core endpoints', 'Name the main entities and their keys', 'Pick a store for each entity and say why'],
  },
  {
    name: 'High-level design',
    minutes: 15,
    prompts: ['Draw the request path end to end on the canvas', 'Run it and check nothing is saturated', 'Use Capacity to size replicas'],
  },
  {
    name: 'Deep dive',
    minutes: 10,
    prompts: ['Kill a component: what breaks?', 'Where are the single points of failure?', 'What happens at 10x traffic?'],
  },
  {
    name: 'Wrap-up',
    minutes: 3,
    prompts: ['Score the design', 'Summarize the trade-offs you made', 'What would you build next?'],
  },
];
