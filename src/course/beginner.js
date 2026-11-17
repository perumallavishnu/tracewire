// Beginner zone: how a single request travels, and the first tools for handling more of them.

export const BEGINNER = [
  {
    id: 'how-the-web-works',
    title: 'How the web works',
    summary: 'Follow one request from a browser to a server and back.',
    intro:
      'Every system you will design starts with the same trip: a client asks, the network carries the question, a server answers. Before you can scale anything you need to know what happens on that trip, where the time goes and what can fail.',
    next: ['apis', 'scaling-basics'],
    subsections: [
      {
        id: 'client-server',
        title: 'Clients and servers',
        theory: [
          'A client is anything that starts a conversation: a browser, a phone app, another service. A server waits for requests and answers them. The same machine can be both; your API server is a server to the phone and a client to its database.',
          'Thinking in clients and servers tells you where state lives and who is allowed to change it. Clients are untrusted and unreliable, so the server checks every request and owns the data.',
        ],
        concepts: ['Request and response', 'Thin vs thick clients', 'Stateful vs stateless servers', 'Peer-to-peer as the alternative'],
      },
      {
        id: 'dns',
        title: 'DNS: finding the server',
        theory: [
          'Humans type names, networks route numbers. DNS turns tracewire.dev into an IP address through a chain of resolvers, root servers and authoritative servers, caching answers at each step for as long as the record’s TTL allows.',
          'DNS is also your first load balancer. Returning different addresses per region or per health check steers users, but cached answers mean a change can take minutes to reach everyone.',
        ],
        concepts: ['Recursive resolution', 'A, AAAA, CNAME and NS records', 'TTL and caching', 'GeoDNS and health-checked records'],
      },
      {
        id: 'tcp-ip',
        title: 'TCP/IP and latency',
        theory: [
          'IP moves packets between machines with no promises. TCP adds ordering, retransmission and flow control on top, at the cost of a handshake before any data moves. On a 100 ms round trip, a new TLS connection can spend 200–300 ms before the first byte of your page.',
          'This is why connection reuse, keep-alive and putting servers close to users matter so much. Distance is a hard floor: light in fibre needs about 70 ms to cross the Atlantic and back.',
        ],
        concepts: ['Packets and routing', 'TCP handshake and slow start', 'UDP and when to use it', 'Round-trip time and bandwidth'],
      },
      {
        id: 'http',
        title: 'HTTP and HTTPS',
        theory: [
          'HTTP is the language of the request: a method (GET, POST, PUT, DELETE), a path, headers and an optional body; the answer carries a status code, headers and a body. HTTPS wraps the same exchange in TLS so nobody on the path can read or change it.',
          'HTTP/2 multiplexes many requests over one connection and HTTP/3 runs over QUIC on UDP to avoid head-of-line blocking. Caching headers such as Cache-Control and ETag let browsers and CDNs skip work entirely.',
        ],
        concepts: ['Methods and status codes', 'Headers and cookies', 'TLS certificates', 'HTTP/1.1 vs HTTP/2 vs HTTP/3', 'Cache-Control and ETag'],
      },
    ],
  },
  {
    id: 'apis',
    title: 'APIs and data formats',
    summary: 'Design the contract between a client and your system.',
    intro:
      'An API is a promise. Once a mobile app ships against it you cannot take it back, so the shape of your endpoints, errors and payloads decides how easy the system will be to change for years.',
    next: ['databases-101'],
    subsections: [
      {
        id: 'rest',
        title: 'REST basics',
        theory: [
          'REST models your system as resources with URLs (/users/42/orders) and uses HTTP methods as verbs. GET reads and never changes anything, POST creates, PUT replaces, PATCH updates part of a resource and DELETE removes it.',
          'Good REST APIs are predictable: plural nouns, nesting only for real ownership, status codes that mean what they say (201 Created, 404 Not Found, 409 Conflict, 429 Too Many Requests).',
        ],
        concepts: ['Resources and URLs', 'Safe and idempotent methods', 'Status codes that carry meaning', 'Error response shape'],
      },
      {
        id: 'payloads',
        title: 'Payloads and serialization',
        theory: [
          'JSON is readable and everywhere, but verbose: field names travel with every record. Binary formats such as Protocol Buffers and Avro are smaller and faster to parse and carry a schema, which matters between internal services.',
          'Whatever the format, plan for change: add fields instead of renaming them, never reuse a field for a new meaning, and make clients ignore fields they do not know.',
        ],
        concepts: ['JSON', 'Protocol Buffers and Avro', 'Schema evolution', 'Compression'],
      },
      {
        id: 'api-basics-safety',
        title: 'Idempotency and pagination',
        theory: [
          'Networks fail mid-request, so clients retry. An idempotent operation gives the same result however many times it runs. For non-idempotent ones such as payments, the client sends an idempotency key and the server remembers the first result.',
          'Never return an unbounded list. Offset pagination is simple but slow and unstable on large tables; cursor pagination hands back an opaque pointer to the next page and stays fast.',
        ],
        concepts: ['Idempotency keys', 'Offset vs cursor pagination', 'Filtering and sorting', 'Rate-limit headers'],
      },
    ],
  },
  {
    id: 'databases-101',
    title: 'Databases 101',
    summary: 'Store data so it survives crashes and answers questions fast.',
    intro:
      'The database is usually the hardest part of a system to scale and the most painful to get wrong, because data outlives code. Learn what relational databases guarantee, what indexes cost, and when another kind of store fits better.',
    next: ['caching-101'],
    subsections: [
      {
        id: 'relational',
        title: 'Relational databases and SQL',
        theory: [
          'Relational databases store rows in tables with a fixed schema and let you combine them with joins. Normalization keeps each fact in one place so updates cannot disagree; denormalization copies data to make reads faster.',
          'SQL lets you ask new questions without new code, which is why the system of record for money, orders and accounts is almost always relational.',
        ],
        concepts: ['Tables, rows and keys', 'Joins', 'Normalization and denormalization', 'Schema migrations'],
      },
      {
        id: 'indexes',
        title: 'Indexes',
        theory: [
          'Without an index, finding one user among ten million means reading all ten million rows. A B-tree index finds it in a handful of page reads, about the difference between seconds and a millisecond.',
          'Indexes are not free: every write updates every index, and each one takes memory and disk. Index the columns you filter and sort by, and check the query plan instead of guessing.',
        ],
        concepts: ['B-tree indexes', 'Composite and covering indexes', 'Query plans', 'Write amplification'],
      },
      {
        id: 'transactions',
        title: 'Transactions and ACID',
        theory: [
          'A transaction groups several changes so they all happen or none do. ACID names the guarantees: atomicity, consistency, isolation and durability. Moving money between two accounts is the classic case: debit and credit must succeed together.',
          'Isolation levels trade safety for speed. Read committed is common, serializable is safest; weaker levels allow anomalies like lost updates that show up only under concurrency.',
        ],
        concepts: ['Atomicity and durability', 'Isolation levels', 'Locks and MVCC', 'Deadlocks'],
      },
      {
        id: 'nosql-types',
        title: 'NoSQL families',
        theory: [
          'Key-value stores (Redis, DynamoDB) look up a value by key in milliseconds. Document stores (MongoDB) keep nested JSON together. Wide-column stores (Cassandra) spread huge write-heavy tables across many machines. Graph databases store relationships as first-class edges.',
          'They give up joins and often multi-row transactions in exchange for horizontal scale and flexible schemas. Choose by access pattern: write down the queries first, then pick the store.',
        ],
        concepts: ['Key-value stores', 'Document stores', 'Wide-column stores', 'Graph databases', 'Choosing by access pattern'],
      },
    ],
  },
  {
    id: 'scaling-basics',
    title: 'Scaling basics',
    summary: 'Serve more users by adding machines, not by buying a bigger one.',
    intro:
      'One server is simple until it is full. This section is about the first moves every growing system makes: run more copies of the stateless parts, put a load balancer in front, and keep state where it can be managed.',
    next: ['caching-101', 'estimation'],
    subsections: [
      {
        id: 'vertical-horizontal',
        title: 'Vertical vs horizontal scaling',
        theory: [
          'Vertical scaling means a bigger machine: more cores, more memory. It needs no code changes but has a ceiling and keeps a single point of failure. Horizontal scaling means more machines sharing the work; it has no hard ceiling but needs the work to be splittable.',
          'Most systems scale compute horizontally early and keep the database vertical for as long as possible, because splitting data is much harder than splitting requests.',
        ],
        concepts: ['Scale up vs scale out', 'Cost curves', 'Single points of failure', 'Elastic auto-scaling'],
      },
      {
        id: 'stateless',
        title: 'Stateless services',
        theory: [
          'A stateless server keeps nothing between requests that another server would need. Sessions go to a shared store or into a signed token, uploads go to object storage. Then any instance can answer any request and you can add or kill instances freely.',
          'State has to live somewhere; the point is to push it into a few components built to hold it (databases, caches, queues) and keep everything else disposable.',
        ],
        concepts: ['Session stores', 'Signed tokens', 'Twelve-factor apps', 'Disposable instances'],
      },
      {
        id: 'load-balancing',
        title: 'Load balancers',
        theory: [
          'A load balancer spreads requests across instances and stops sending to ones that fail health checks. Round robin is simple, least-connections adapts to slow requests, and consistent hashing keeps a user on the same instance when that helps caching.',
          'Layer 4 balancers route by IP and port and are very fast; layer 7 balancers read HTTP and can route by path, header or cookie. In Tracewire, drop a Load Balancer in front of two services and kill one to watch failover.',
        ],
        concepts: ['Round robin and least connections', 'Health checks', 'L4 vs L7 balancing', 'Sticky sessions', 'Connection draining'],
      },
    ],
  },
  {
    id: 'caching-101',
    title: 'Caching',
    summary: 'Answer repeat questions from memory instead of recomputing them.',
    intro:
      'Most traffic asks for the same few things. A cache keeps recent answers close and fast, and a good one can take 80–95% of reads off your database. It also adds the hardest problem in computing: knowing when the answer is stale.',
    next: ['estimation', 'data-at-scale'],
    subsections: [
      {
        id: 'cache-layers',
        title: 'Where caches live',
        theory: [
          'Caches stack up along the request path: the browser, a CDN edge, a reverse proxy, an in-process cache in your service, a shared cache like Redis, and the database’s own buffer pool. Each layer closer to the user saves more work but is harder to invalidate.',
          'Memory reads take about 100 ns, a Redis round trip about 0.5–1 ms, a database query 5–20 ms. That ratio is why caching is the first scaling tool most teams reach for.',
        ],
        concepts: ['Browser and CDN caches', 'Application caches', 'Distributed caches', 'Database buffer pools'],
      },
      {
        id: 'cache-patterns',
        title: 'Read and write patterns',
        theory: [
          'Cache-aside: the service reads the cache, and on a miss reads the database and fills the cache. Write-through: every write goes to cache and database together. Write-back: writes land in the cache and are flushed later, fast but risky if the cache dies.',
          'The hit rate decides everything. At 85% hits, 20,000 reads per second become 3,000 database reads; at 50% hits, 10,000. Try it on the Tracewire landing page dial.',
        ],
        concepts: ['Cache-aside', 'Write-through', 'Write-back', 'Hit rate and miss penalty'],
      },
      {
        id: 'eviction',
        title: 'Expiry, eviction and stampedes',
        theory: [
          'Memory is finite, so caches evict: least recently used (LRU) is the usual policy. TTLs bound how stale an answer can get. Explicit invalidation on write keeps data fresh but is easy to get wrong across many services.',
          'When a hot key expires, thousands of requests can miss at once and hammer the database: a cache stampede. Request coalescing, jittered TTLs and refreshing early keep it from happening.',
        ],
        concepts: ['LRU and LFU eviction', 'TTL and jitter', 'Invalidation on write', 'Cache stampede protection'],
      },
      {
        id: 'cdn',
        title: 'CDNs',
        theory: [
          'A content delivery network keeps copies of static files, images and video at hundreds of edges near users. A visitor in Mumbai fetches from Mumbai instead of Virginia, cutting 200 ms to 20 ms and removing that traffic from your origin.',
          'CDNs work best for content that is the same for everyone. Personalized pages can still use the edge for their static parts while the dynamic parts come from origin.',
        ],
        concepts: ['Edge locations', 'Origin and origin shield', 'Cache keys and purging', 'Signed URLs'],
      },
    ],
  },
  {
    id: 'estimation',
    title: 'Back-of-envelope estimation',
    summary: 'Turn users into requests, bytes and machines before drawing boxes.',
    intro:
      'Design starts with numbers. A system for 10,000 users and one for 100 million look nothing alike, and five minutes of arithmetic tells you which one you are building and where it will break first.',
    next: ['data-at-scale'],
    subsections: [
      {
        id: 'latency-numbers',
        title: 'Latency numbers to know',
        theory: [
          'Keep a rough table in your head: memory reference 100 ns, SSD read 100 µs, round trip within a data centre 0.5 ms, disk seek 10 ms, round trip across a continent 70–150 ms. Each step is roughly 10 to 100 times the one before.',
          'These numbers tell you what to avoid on the hot path. Ten sequential database calls at 5 ms each already cost 50 ms before any business logic runs.',
        ],
        concepts: ['Memory, SSD and disk', 'Network round trips', 'Orders of magnitude', 'Sequential vs parallel calls'],
      },
      {
        id: 'qps',
        title: 'Traffic: from users to QPS',
        theory: [
          'Average requests per second = daily active users × requests per user per day ÷ 86,400. 30 million users making 20 requests a day is about 7,000 requests per second on average. Peaks are usually two to five times the average, so plan for about 20,000.',
          'Split reads from writes: their ratio decides whether you need caches and replicas (read-heavy) or partitioned writes and queues (write-heavy).',
        ],
        concepts: ['Daily active users', 'Average vs peak', 'Read/write ratio', 'Servers needed'],
      },
      {
        id: 'storage-bandwidth',
        title: 'Storage and bandwidth',
        theory: [
          'Storage = writes per day × bytes per record × days kept × replication factor. 1,000 writes per second of 1 KB, kept 5 years with 3 copies, is about 470 TB. Bandwidth = requests per second × response size.',
          'These numbers decide the kind of store (one database or a sharded cluster), the cost, and whether you need a CDN. Tracewire’s Capacity tab does this arithmetic for you.',
        ],
        concepts: ['Record size estimates', 'Retention and replication', 'Ingress and egress', 'Cost per GB'],
      },
    ],
  },
];
