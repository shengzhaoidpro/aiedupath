export interface Node {
  id: string;
  orderId: number;
  label: string;
  description: string;
  group: 'Foundation' | 'Core' | 'Advanced' | 'Practical' | 'Related';
  level?: number;
  prerequisites?: string[];
  estimatedHours?: number;
  difficulty?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Edge {
  source: string | Node;
  target: string | Node;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface NodeDetailData {
  content: string;
  sources: GroundingSource[];
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  error: string | null;
}

export interface RecommendedTopic {
  id: string;
  label: string;
  query: string;
  icon: string;
  desc: string;
}