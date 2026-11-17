// One worked example per section: a concrete scenario, the reasoning in steps, the numbers,
// and what to take away. Shown on each lesson page under "Worked example".

export const EXAMPLES = {
  'how-the-web-works': {
    title: 'Why the first visit to a site feels slow',
    scenario: 'A user in Singapore opens a page served from Virginia. The round trip between them is about 230 ms.',
    steps: [
      'DNS lookup: the resolver has nothing cached, so it walks root, .com and the site’s name servers. Roughly 1 round trip to a nearby resolver plus upstream lookups: about 60 ms.',
      'TCP handshake: SYN, SYN-ACK, ACK costs 1 round trip to Virginia: 230 ms.',
      'TLS 1.3 handshake: 1 more round trip: 230 ms.',
      'HTTP request and the first bytes of the response: 1 round trip: 230 ms, plus server time of about 40 ms.',
      'Total before the first byte: about 790 ms. A repeat visit reuses DNS and the connection and pays only the last step: about 270 ms.',
    ],
    takeaway: 'Distance multiplies with every round trip. Serving from a nearby edge (a CDN) cuts each 230 ms trip to about 10 ms, which is why the first byte can arrive under 100 ms.',
  },
  apis: {
    title: 'Designing the endpoints for a to-do app',
    scenario: 'A mobile app lists, creates, completes and deletes tasks. Phones lose signal, so requests get retried.',
    steps: [
      'Resources: /users/{id}/tasks for the collection, /tasks/{id} for one task.',
      'GET /users/42/tasks?cursor=abc&limit=50 lists tasks with cursor pagination, so new tasks never shift the pages.',
      'POST /users/42/tasks with an Idempotency-Key header creates a task. If the phone retries after a timeout, the server returns the first result instead of a duplicate.',
      'PATCH /tasks/7 with {"done": true} completes it; a retry is harmless because setting done twice is the same as once.',
      'DELETE /tasks/7 returns 204, and 404 on a second call, which the client treats as success.',
    ],
    takeaway: 'Name resources, pick idempotent methods where you can, and add idempotency keys where you cannot. Retries then become safe by design.',
  },
  'databases-101': {
    title: 'An index that turns 4 seconds into 2 milliseconds',
    scenario: 'An orders table has 50 million rows. The page "my orders" runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20.',
    steps: [
      'Without an index the database scans all 50 million rows: on a fast SSD about 4 seconds, and it blocks other queries while it reads.',
      'A composite index on (user_id, created_at) stores rows sorted by user, then time. The query jumps straight to user 42 and reads the newest 20 entries.',
      'A B-tree over 50 million keys is about 4 levels deep, so the lookup reads roughly 4 pages plus 20 rows: about 2 ms.',
      'Cost: every insert now also updates this index, roughly 10 to 20% slower writes, and the index takes about 1.5 GB.',
    ],
    takeaway: 'Index the columns you filter and sort by, in that order. Check the query plan before and after; never guess.',
  },
  'scaling-basics': {
    title: 'Growing an API from 500 to 20,000 requests a second',
    scenario: 'One server handles 500 req/s at 60% CPU. Traffic is heading to 20,000 req/s at peak.',
    steps: [
      'Vertical first: a server with 4 times the cores handles about 2,000 req/s. Useful, but there is a ceiling and still one machine to fail.',
      'Make the service stateless: sessions move to Redis, uploads to object storage. Now any instance can serve any request.',
      'Put a load balancer in front. Sizing for 70% utilization: 20,000 / (2,000 x 0.7) = 15 instances, plus 2 spare for failures and deploys.',
      'Health checks remove a crashed instance within seconds; auto-scaling adds instances when CPU passes 70%.',
    ],
    takeaway: 'Scale out the stateless tier early and keep state in a few systems designed for it. Size for headroom, not for the average.',
  },
  'caching-101': {
    title: 'What an 85% cache hit rate is worth',
    scenario: 'A product page gets 20,000 reads a second. Each database read takes 8 ms; a cache read takes 1 ms.',
    steps: [
      'Without a cache the database must serve 20,000 reads/s. At about 3,200 reads/s per replica that needs 7 replicas, and each read costs 8 ms.',
      'Cache-aside with an 85% hit rate: 17,000 reads/s come from the cache, 3,000 reach the database. One replica plus a spare now covers it.',
      'Average read latency: 0.85 x 1 ms + 0.15 x 9 ms (miss plus fill) = about 2.2 ms instead of 8 ms.',
      'Risk: a popular product’s key expires and thousands of misses hit the database at once. Request coalescing lets one request refill it while the rest wait.',
    ],
    takeaway: 'Hit rate is the number that matters. Try it on the landing page dial: turn the cache off and watch the database saturate.',
  },
  estimation: {
    title: 'Sizing a photo-sharing service in five minutes',
    scenario: '10 million daily users; each views 50 photos and uploads 0.2 photos a day. A photo is 2 MB, its metadata 1 KB.',
    steps: [
      'Reads: 10M x 50 / 86,400 = about 5,800 req/s average, about 17,000 at a 3x peak.',
      'Writes: 10M x 0.2 / 86,400 = about 23 uploads/s. Reads outnumber writes 250 to 1, so caching and a CDN matter most.',
      'Photo storage per year: 2M uploads/day x 2 MB x 365 = about 1.5 PB. That is object storage, never a database.',
      'Egress at peak: 17,000 x (say) 300 KB thumbnails = about 5 GB/s, almost all of it from a CDN.',
    ],
    takeaway: 'Ten minutes of arithmetic decides the architecture: here, object storage plus a CDN for bytes, a small database for metadata.',
  },
  'data-at-scale': {
    title: 'Sharding a messages table by conversation',
    scenario: 'A chat app stores 2 billion messages and writes 40,000 a second, far beyond one database.',
    steps: [
      'Shard key options: user_id spreads users but scatters a conversation across shards; conversation_id keeps each conversation on one shard.',
      'Most queries are "latest 50 messages in conversation X", so conversation_id wins: every query hits exactly one shard.',
      'With 16 shards each takes about 2,500 writes/s and 125 million messages. Each shard has 2 followers for reads and failover.',
      'Hot spot: a huge group chat can overload its shard. Split its history by time bucket, or give the biggest conversations their own shards.',
    ],
    takeaway: 'Choose the shard key from the main query. A key that matches the access pattern makes every request a single-shard request.',
  },
  consistency: {
    title: 'Why your new post vanishes on refresh',
    scenario: 'A user posts a comment; the write goes to the leader, but the next page load reads from a follower 800 ms behind.',
    steps: [
      'The follower has not applied the write yet, so the user does not see their own comment and assumes it failed.',
      'Fix 1, read-your-writes: for a few seconds after a write, route that user’s reads to the leader.',
      'Fix 2: the client remembers the write’s position in the log and the server waits until the follower has caught up to it.',
      'Everyone else can still read from followers; a comment showing up a second late for strangers is fine.',
    ],
    takeaway: 'You rarely need strong consistency everywhere. Find the one guarantee users notice and provide exactly that.',
  },
  async: {
    title: 'Sending a welcome email without slowing sign-up',
    scenario: 'Sign-up calls an email provider that takes 300 ms normally and 10 seconds when it struggles.',
    steps: [
      'Synchronous: the user waits for the email call, and when the provider is slow, sign-ups time out and fail.',
      'With a queue: sign-up writes the user, publishes a "user.created" message and returns in 40 ms.',
      'A worker consumes the message and sends the email; if the provider fails, the message is retried with backoff.',
      'At-least-once delivery means a retry can send twice, so the worker records "welcome sent" per user and skips repeats.',
    ],
    takeaway: 'Move work the user does not need to wait for behind a queue, and make the consumer idempotent.',
  },
  reliability: {
    title: 'How three retries turned a blip into an outage',
    scenario: 'A database slows down for 20 seconds. The API retries 3 times, the gateway retries 3 times, the client retries 3 times.',
    steps: [
      'Each user request can become 3 x 3 x 3 = 27 database calls exactly when the database is weakest.',
      'Load climbs past capacity, timeouts rise, retries multiply further, and the database never recovers on its own.',
      'Fix: retry only at one layer, with exponential backoff and jitter, and cap retries at 10% of normal traffic.',
      'Add a circuit breaker: after 50% errors it fails fast for 5 seconds, letting the database drain, then probes once.',
    ],
    takeaway: 'Retries are load. In Tracewire, kill a database under traffic and watch the retry storm, then add a circuit breaker and compare.',
  },
  'api-advanced': {
    title: 'Live delivery tracking for a food app',
    scenario: 'Customers watch their courier move on a map. 200,000 orders are in flight at dinner peak.',
    steps: [
      'Polling every 2 seconds would be 100,000 requests a second, nearly all returning "no change".',
      'Server-sent events: each customer holds one open connection and receives a position only when it changes.',
      'Each courier’s app sends its location every 4 seconds to a gateway that publishes it on a channel per order.',
      'Connection servers subscribe to the channels of the customers they hold. 200,000 connections fit on about 10 servers.',
    ],
    takeaway: 'Push beats polling when updates are frequent and many clients wait. Plan for reconnects and for routing a message to the right connection.',
  },
  'storage-specialized': {
    title: 'Uploading a 500 MB video without touching your servers',
    scenario: 'Users upload videos from phones over unreliable networks.',
    steps: [
      'The client asks the API for an upload; the API returns pre-signed URLs for object storage.',
      'The phone uploads the file in 10 MB parts directly to storage; a failed part is retried alone.',
      'Storage notifies the system when the upload completes; a worker starts transcoding.',
      'The database stores only metadata: owner, title, storage key and status.',
    ],
    takeaway: 'Big bytes go straight to object storage; your services handle metadata and coordination.',
  },
  lld: {
    title: 'Modelling a parking lot',
    scenario: 'A multi-floor lot has small, regular and large spots. Vehicles enter, get a ticket, park, pay and leave.',
    steps: [
      'Nouns become classes: ParkingLot, Floor, Spot (with size), Vehicle (Motorbike, Car, Truck), Ticket, Payment.',
      'Spot assignment is a Strategy: NearestToEntrance or SpreadAcrossFloors can be swapped without touching the lot.',
      'A Ticket records spot, vehicle and entry time; a PricingPolicy computes the fee, so pricing can change independently.',
      'Two cars must never get the same spot: assignment locks the spot (or uses an atomic compare-and-set) before issuing a ticket.',
    ],
    takeaway: 'Start from nouns and verbs, isolate what changes (assignment, pricing) behind interfaces, and protect shared state.',
    code: `interface SpotStrategy { Spot pick(List<Spot> free, Vehicle v); }

class ParkingLot {
  private final SpotStrategy strategy;
  private final PricingPolicy pricing;

  synchronized Ticket enter(Vehicle v) {
    Spot spot = strategy.pick(freeSpotsFor(v.size()), v);
    if (spot == null) throw new LotFullException();
    spot.occupy(v);
    return new Ticket(spot, v, Instant.now());
  }

  Money exit(Ticket t) {
    t.spot().release();
    return pricing.fee(t.entry(), Instant.now(), t.vehicle());
  }
}`,
  },
  'distributed-coordination': {
    title: 'Running a nightly job exactly once',
    scenario: 'Five app servers all run the same scheduler; the billing job must run once per night.',
    steps: [
      'Each server tries to take a lease named "billing" in a coordination service, valid for 60 seconds.',
      'Only one succeeds; it renews the lease every 20 seconds while the job runs.',
      'If it crashes, the lease expires and another server takes over after at most 60 seconds.',
      'A long GC pause could let the old holder wake up still believing it holds the lease, so every write carries the lease’s fencing token and the database rejects older tokens.',
    ],
    takeaway: 'Leases plus fencing tokens make "only one actor at a time" safe even when machines pause.',
  },
  'transactions-distributed': {
    title: 'Booking a trip with a saga',
    scenario: 'A trip needs a flight, a hotel and a payment, each in a different service.',
    steps: [
      'Reserve flight, then reserve hotel, then charge the card, each a local transaction.',
      'If the charge fails: run the compensations in reverse, release the hotel, then release the flight.',
      'Each step and each compensation is idempotent, so the orchestrator can safely retry after a crash.',
      'The trip shows "pending" until the saga completes; the UI is designed for that state.',
    ],
    takeaway: 'Without one transaction across services, design explicit steps, compensations and visible intermediate states.',
  },
  streams: {
    title: 'Trending hashtags in real time',
    scenario: 'Show the top 10 hashtags of the last 5 minutes, updated every 10 seconds, at 200,000 posts a second.',
    steps: [
      'Posts flow into an event log partitioned by hashtag.',
      'A stream processor counts per hashtag in 5-minute sliding windows that advance every 10 seconds.',
      'Each partition keeps its local top 10; a final stage merges them into a global top 10.',
      'Late events are accepted for 30 seconds after a window closes, then the window is final.',
    ],
    takeaway: 'Stream processing keeps running state over endless data; windows and watermarks decide what counts together.',
  },
  observability: {
    title: 'Setting an SLO for a checkout API',
    scenario: 'Checkout handles 2 million requests a day and the team keeps arguing about "is it reliable enough?"',
    steps: [
      'SLI: the share of checkout requests that succeed in under 500 ms.',
      'SLO: 99.9% over 30 days. Error budget: 0.1% of 60 million requests = 60,000 bad requests a month.',
      'A release that burns 20,000 bad requests in an hour is rolled back; the burn-rate alert fires at 14x the allowed rate.',
      'When the budget is spent, feature releases pause until reliability work brings it back.',
    ],
    takeaway: 'SLOs turn "reliable enough" into a number everyone can see and act on.',
  },
  'global-scale': {
    title: 'Surviving the loss of a whole region',
    scenario: 'A service runs in us-east and eu-west; us-east goes dark at 3 a.m.',
    steps: [
      'Global DNS or anycast health checks stop sending users to us-east within about 30 seconds.',
      'eu-west was sized at 60% of global peak, so it can take the full load for a while (and auto-scales further).',
      'Data replicates asynchronously with about 2 seconds of lag, so the RPO is about 2 seconds of writes.',
      'The team practises this failover monthly, so the runbook is current and the RTO stays under 5 minutes.',
    ],
    takeaway: 'Multi-region only helps if the other region has capacity, the data is there, and the failover has been rehearsed.',
  },
  security: {
    title: 'Signing in with short-lived tokens',
    scenario: 'A web app and a mobile app call the same APIs, and a leaked token must not be useful for long.',
    steps: [
      'The user signs in through OpenID Connect and receives an access token valid for 15 minutes and a refresh token valid for 30 days.',
      'APIs verify the access token’s signature locally, so no call to the auth service is needed on each request.',
      'When the access token expires the client silently exchanges the refresh token for a new one; refresh tokens rotate on every use.',
      'Logging out or detecting theft revokes the refresh token, so access ends within 15 minutes at most.',
    ],
    takeaway: 'Short-lived access tokens plus revocable, rotating refresh tokens balance speed with the damage a leak can do.',
  },
};
