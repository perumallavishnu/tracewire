import { memo, useCallback, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Handle, Position, useReactFlow, useStore } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LEVELS } from '../course';
import { navigate } from '../router';
import { SiteNav } from './shared';
import './site.css';
import './roadmap.css';

// Zoomable roadmap: three translucent level zones stacked top to bottom, sections
// zig-zagging down each zone, step-trace connections between them, and a panel of
// buildable projects closing every zone. Scroll to zoom, drag to pan, click to open a lesson.

const SECTION_W = 440;
const COLS = [0, 540];
const ZONE_PAD = 80;
const ZONE_W = COLS[1] + SECTION_W + ZONE_PAD * 2;
const ZONE_GAP = 220;
const ZONE_HEAD = 210;
const GAP_Y = 90;
const READ_ZOOM = 0.72;

// Zones run left to right; each zone's left edge in flow coordinates.
const zoneLeft = (i) => i * (ZONE_W + ZONE_GAP);

function sectionHeight(section) {
  const lines = section.subsections.reduce((n, sub) => n + 1.6 + sub.concepts.length, 0);
  return 132 + lines * 25 + 24;
}

function projectsHeight(level) {
  const rows = Math.max(level.projects.real.length, level.projects.hld.length, level.projects.lld.length);
  return 150 + rows * 54;
}

function buildLayout() {
  const nodes = [];
  const edges = [];
  const levelOf = new Map(LEVELS.flatMap((l) => l.sections.map((s) => [s.id, l.id])));
  const colOf = new Map(LEVELS.flatMap((l) => l.sections.map((s, i) => [s.id, i % 2])));
  const top = 0;
  LEVELS.forEach((level, li) => {
    const left = zoneLeft(li) + ZONE_PAD;
    const colY = [top + ZONE_HEAD, top + ZONE_HEAD + 160];
    level.sections.forEach((section, i) => {
      const col = i % 2;
      const height = sectionHeight(section);
      nodes.push({
        id: section.id,
        type: 'section',
        position: { x: left + COLS[col], y: colY[col] },
        data: { section, tone: level.tone, levelName: level.name },
        style: { width: SECTION_W, height },
        zIndex: 2,
      });
      colY[col] += height + GAP_Y;
      for (const next of section.next) {
        // same column: straight down; to the right (other column or next zone): side to side
        const across = levelOf.get(next) !== level.id;
        const sameCol = !across && colOf.get(next) === col;
        const leftward = !across && !sameCol && col === 1;
        edges.push({
          id: `${section.id}->${next}`,
          source: section.id,
          target: next,
          sourceHandle: sameCol ? 'sb' : leftward ? 'sl' : 'sr',
          targetHandle: sameCol ? 'tt' : leftward ? 'tr' : 'tl',
          type: 'trace',
          data: { tone: level.tone, horizontal: !sameCol },
          zIndex: 1,
        });
      }
    });
    const projectsTop = Math.max(...colY) + 20;
    const pHeight = projectsHeight(level);
    nodes.push({
      id: `projects-${level.id}`,
      type: 'projects',
      position: { x: left, y: projectsTop },
      data: { level },
      style: { width: COLS[1] + SECTION_W, height: pHeight },
      zIndex: 2,
    });
    const bottom = projectsTop + pHeight + 80;
    nodes.unshift({
      id: `zone-${level.id}`,
      type: 'zone',
      position: { x: zoneLeft(li), y: top },
      data: { level },
      style: { width: ZONE_W, height: bottom - top },
      selectable: false,
      draggable: false,
      zIndex: 0,
    });
  });
  return { nodes, edges };
}

const zoomSelector = (s) => s.transform[2];

const ZoneNode = memo(function ZoneNode({ data }) {
  const { level } = data;
  return (
    <div className={`rm-zone rm-zone--${level.tone}`}>
      <div className="rm-zone__head">
        <h2>{level.name}</h2>
        <p>{level.tagline}. {level.sections.length} sections, {level.sections.reduce((n, s) => n + s.subsections.length, 0)} lessons.</p>
      </div>
    </div>
  );
});

const SectionNode = memo(function SectionNode({ data }) {
  const zoom = useStore(zoomSelector);
  const { section, tone } = data;
  const compact = zoom < 0.42;
  const conceptCount = section.subsections.reduce((n, s) => n + s.concepts.length, 0);
  return (
    <div className={`rm-section rm-section--${tone}${compact ? ' is-compact' : ''}`}>
      <Handle id="tt" type="target" position={Position.Top} className="rm-handle" isConnectable={false} />
      <Handle id="tl" type="target" position={Position.Left} className="rm-handle" isConnectable={false} />
      <Handle id="tr" type="target" position={Position.Right} className="rm-handle" isConnectable={false} />
      <Handle id="sb" type="source" position={Position.Bottom} className="rm-handle" isConnectable={false} />
      <Handle id="sr" type="source" position={Position.Right} className="rm-handle" isConnectable={false} />
      <Handle id="sl" type="source" position={Position.Left} className="rm-handle" isConnectable={false} />
      <a className="rm-section__title nodrag" href={`#/learn/${section.id}`} onClick={(e) => e.stopPropagation()}>
        {section.title}
      </a>
      {compact ? (
        <p className="rm-section__count">{section.subsections.length} lessons · {conceptCount} concepts</p>
      ) : (
        <>
          <p className="rm-section__summary">{section.summary}</p>
          <ul className="rm-subs">
            {section.subsections.map((sub) => (
              <li key={sub.id}>
                <a className="nodrag" href={`#/learn/${section.id}/${sub.id}`} onClick={(e) => e.stopPropagation()}>{sub.title}</a>
                <ul>
                  {sub.concepts.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
});

function ProjectList({ title, items, render }) {
  return (
    <div className="rm-projects__col">
      <h3>{title}</h3>
      <ul>{items.map(render)}</ul>
    </div>
  );
}

const ProjectsNode = memo(function ProjectsNode({ data }) {
  const zoom = useStore(zoomSelector);
  const { level } = data;
  const p = level.projects;
  const compact = zoom < 0.42;
  return (
    <div className={`rm-projects rm-projects--${level.tone}${compact ? ' is-compact' : ''}`}>
      <h2>After {level.name.toLowerCase()}, you can build</h2>
      {compact ? (
        <p className="rm-section__count">{p.real.length} real products · {p.hld.length} simulator exercises · {p.lld.length} class designs</p>
      ) : (
        <div className="rm-projects__cols">
          <ProjectList
            title="Real products"
            items={p.real}
            render={(item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className="rm-like">like {item.like}</span>
                {item.problemId && <a className="nodrag" href={`#/sim?problem=${item.problemId}`}>Design it in the simulator</a>}
              </li>
            )}
          />
          <ProjectList
            title="Practice in the simulator (HLD)"
            items={p.hld}
            render={(item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <a className="nodrag" href={item.problemId ? `#/sim?problem=${item.problemId}` : '#/sim'}>
                  {item.problemId ? 'Open the problem' : 'Free build'}
                </a>
              </li>
            )}
          />
          <ProjectList
            title="Class design (LLD)"
            items={p.lld}
            render={(name) => (
              <li key={name}>
                <span>{name}</span>
              </li>
            )}
          />
        </div>
      )}
    </div>
  );
});

// Vertical step trace from the bottom of one section to the top of the next, with a pulse riding it.
const TraceEdge = memo(function TraceEdge({ id, sourceX, sourceY, targetX, targetY, data }) {
  const d = data?.horizontal
    ? `M ${sourceX},${sourceY} H ${(sourceX + targetX) / 2} V ${targetY} H ${targetX}`
    : `M ${sourceX},${sourceY} V ${(sourceY + targetY) / 2} H ${targetX} V ${targetY}`;
  return (
    <g className={`rm-edge rm-edge--${data?.tone || 'signal'}`}>
      <path id={`rm-path-${id}`} d={d} fill="none" strokeWidth="6" strokeLinecap="square" />
      <circle r="7" className="rm-edge__pulse">
        <animateMotion dur="3.6s" repeatCount="indefinite" path={d} />
      </circle>
    </g>
  );
});

const nodeTypes = { zone: ZoneNode, section: SectionNode, projects: ProjectsNode };
const edgeTypes = { trace: TraceEdge };

function Canvas() {
  const { nodes, edges } = useMemo(buildLayout, []);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();

  // jump to the top of a zone at a zoom where every lesson and concept is readable
  const jump = useCallback(
    (index) => setViewport({ x: -zoneLeft(index) * READ_ZOOM + 24, y: 70, zoom: READ_ZOOM }, { duration: 700 }),
    [setViewport]
  );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={(_, node) => node.type === 'section' && navigate(`/learn/${node.id}`)}
        defaultViewport={{ x: 24, y: 70, zoom: READ_ZOOM }}
        minZoom={0.08}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        zoomOnScroll
        panOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.4} color="#1d242b" />
      </ReactFlow>
      <div className="rm-toolbar">
        {LEVELS.map((l, i) => (
          <button key={l.id} className={`rm-jump rm-jump--${l.tone}`} onClick={() => jump(i)}>{l.name}</button>
        ))}
        <span className="rm-toolbar__gap" />
        <button className="rm-zoom" onClick={() => zoomOut({ duration: 200 })} aria-label="Zoom out">−</button>
        <button className="rm-zoom" onClick={() => zoomIn({ duration: 200 })} aria-label="Zoom in">+</button>
        <button className="rm-jump" onClick={() => fitView({ duration: 700, padding: 0.12 })}>Whole map</button>
      </div>
    </>
  );
}

export default function Roadmap() {
  return (
    <div className="site rm-page">
      <SiteNav current="roadmap" />
      <div className="rm-intro">
        <h1>The system design roadmap</h1>
        <p>Scroll to zoom, drag to move. Zoom in to read every lesson and concept; click a section to open its lessons.</p>
      </div>
      <div className="rm-canvas">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
