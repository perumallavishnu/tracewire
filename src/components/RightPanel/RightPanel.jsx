import Inspector from '../Inspector/Inspector';
import TradeoffsPanel from './TradeoffsPanel';
import CapacityPanel from './CapacityPanel';
import ScorePanel from './ScorePanel';
import { useUiStore } from '../../store/useUiStore';

const TABS = [
  { id: 'inspect', label: 'Inspect', Panel: Inspector },
  { id: 'tradeoffs', label: 'Trade-offs', Panel: TradeoffsPanel },
  { id: 'capacity', label: 'Capacity', Panel: CapacityPanel },
  { id: 'score', label: 'Score', Panel: ScorePanel },
];

export default function RightPanel() {
  const rightTab = useUiStore((s) => s.rightTab);
  const setRightTab = useUiStore((s) => s.setRightTab);
  const { Panel } = TABS.find((t) => t.id === rightTab) || TABS[0];

  return (
    <aside className="inspector">
      <div className="panel-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={rightTab === t.id}
            className={`panel-tab${rightTab === t.id ? ' is-active' : ''}`}
            onClick={() => setRightTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="inspector-scroll" role="tabpanel">
        <Panel />
      </div>
    </aside>
  );
}
