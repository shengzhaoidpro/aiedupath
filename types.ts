export interface Card {
  card_id: string;
  icon: string;
  card_name: string;
  card_subtitle: string;
  card_tag: string;
  card_tag_color: string;
  resource_type: string;
  is_recommended_start?: boolean;
}

export interface Phase {
  phase_number: number;
  phase_label: string;
  phase_badge: string;
  phase_color: 'teal' | 'purple' | 'coral' | 'amber' | 'gray';
  phase_title: string;
  phase_description: string;
  is_recommended_start: boolean;
  cards: Card[];
}

export interface LearningPath {
  topic: string;
  summary: string;
  estimated_hours: string;
  phases: Phase[];
  tip: {
    recommended_start_card_id: string;
    tip_text: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RecommendedTopic {
  id: string;
  label: string;
  query: string;
  icon: string;
  desc: string;
}

export interface Persona {
  profession: string;          // 设计师 / 工程师 / 产品经理 / 学生 / 其他
  tech_level: 'low' | 'mid' | 'high';
  goal: string;                // 工具使用 | 原理理解 | 职业转型 | 团队应用
  prior_knowledge: string[];
  skip_basics: boolean;
  inferred_summary: string;    // ≤15 字
}

export interface PathVersion {
  version: number;
  path: LearningPath;
  createdAt: number;
  isStarred: boolean;
  iterationNote?: string;
}

export interface MyLearningItem {
  topic: string;
  addedAt: number;
}

export interface CardResources {
  search_keywords: Array<{ platform: string; keyword: string }>;
  books: Array<{ title: string; reason: string }>;
  further_questions: string[];
}

export interface ParsedDetail {
  mainContent: string;
  resources: CardResources | null;
}
