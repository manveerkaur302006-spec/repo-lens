import { useAnalysisContext } from '../../context/AnalysisContext';
import GraphVisualization from '../GraphVisualization';

export default function GraphTab() {
  const { graph } = useAnalysisContext();

  if (!graph) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        No graph data available.
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      <GraphVisualization data={graph} />
    </div>
  );
}
