// Landing page FAQ. Also emitted as static HTML and FAQPage structured data by scripts/prerender.mjs.
export const FAQ = [
  ['Is it free?', 'Yes. Tracewire is open source under the MIT licence. There is no account, no paywall and no server: everything runs in your browser.'],
  ['Who is it for?', 'Developers who want to understand how large systems are built, students preparing for system design interviews, and teachers who want a live whiteboard that pushes back.'],
  ['Do I need to know a lot already?', 'No. The beginner zone starts with what happens when you type a web address. If you can read a little code, you can follow every lesson.'],
  ['How is a design scored?', 'The scorer tests your design at the problem’s full peak load with a steady-state model: capacity per replica from Little’s law, queueing delay, critical-path p99 and single points of failure. It grades requirements, scalability, availability, latency and cost, 20 points each, and tells you how to fix every miss.'],
  ['Can the simulator really handle 100,000 requests a second?', 'The live run animates traffic at the rate a browser can draw, a few hundred requests a second. Scoring and the capacity planner calculate behaviour at full production scale instantly, using the same flow rules.'],
  ['Does it help with interviews?', 'Practice interview mode runs six timed phases, from clarifying requirements to the deep dive, and eight problems ship with reference designs to compare against once you have tried your own.'],
  ['What about low-level design?', 'Each zone lists class-design exercises such as a parking lot, an LRU cache or a saga orchestrator, and the intermediate zone has a full section on object modelling and design patterns.'],
  ['Can I contribute?', 'Please do. New problems, lessons and components are welcome on GitHub; the contributing guide explains how each is structured.'],
];
