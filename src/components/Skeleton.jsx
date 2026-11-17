// Loading placeholders shaped like the page that is about to appear, shown while a route's
// code loads. Shimmer stops under reduced motion.

const Bar = ({ w = '100%', h = 14, style }) => <span className="sk" style={{ width: w, height: h, ...style }} />;

function SimSkeleton() {
  return (
    <div className="sk-sim">
      <div className="sk-sim__bar"><Bar w={160} h={22} /><Bar w={90} h={30} /><Bar w={180} h={30} /><span className="sk-grow" /><Bar w={260} h={30} /></div>
      <div className="sk-sim__body">
        <div className="sk-sim__side">{Array.from({ length: 8 }, (_, i) => <Bar key={i} h={52} />)}</div>
        <div className="sk-sim__canvas"><Bar w="38%" h={60} /><Bar w="22%" h={60} style={{ marginLeft: '40%' }} /></div>
        <div className="sk-sim__side">{Array.from({ length: 5 }, (_, i) => <Bar key={i} h={i ? 18 : 34} />)}</div>
      </div>
      <div className="sk-sim__dock"><Bar w="16%" h={140} /><Bar w="22%" h={140} /><Bar w="22%" h={140} /><Bar w="22%" h={140} /></div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="sk-page">
      <div className="sk-nav"><Bar w={140} h={26} /><span className="sk-grow" /><Bar w={320} h={20} /></div>
      <div className="sk-lesson">
        <div className="sk-col">{Array.from({ length: 14 }, (_, i) => <Bar key={i} h={16} w={`${60 + ((i * 17) % 35)}%`} />)}</div>
        <div className="sk-col sk-col--main">
          <Bar w={220} h={14} /><Bar w="60%" h={56} /><Bar w={200} h={14} />
          {Array.from({ length: 4 }, (_, i) => <Bar key={i} h={16} w={`${92 - i * 6}%`} />)}
          <Bar h={160} style={{ marginTop: 24 }} />
          {Array.from({ length: 5 }, (_, i) => <Bar key={`b${i}`} h={16} w={`${95 - i * 5}%`} />)}
        </div>
        <div className="sk-col">{Array.from({ length: 5 }, (_, i) => <Bar key={i} h={16} />)}</div>
      </div>
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="sk-page">
      <div className="sk-nav"><Bar w={140} h={26} /><span className="sk-grow" /><Bar w={320} h={20} /></div>
      <div className="sk-roadmap">
        {[0, 1, 2].map((z) => (
          <div key={z} className="sk-zone">
            <Bar w="55%" h={56} />
            <div className="sk-zone__grid">{Array.from({ length: 6 }, (_, i) => <Bar key={i} h={150} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RouteSkeleton({ page }) {
  const body = page === 'sim' ? <SimSkeleton /> : page === 'roadmap' ? <RoadmapSkeleton /> : <LessonSkeleton />;
  return (
    <div className="sk-root" role="status" aria-live="polite" aria-label="Loading">
      {body}
    </div>
  );
}
