import { GraphData, Node, NodeDetailData } from "../types";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const getApiKey = () => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("API Key is missing. Please check your environment configuration.");
  return key;
};

const PROMPT = (topic: string) => `你是专业课程设计专家。为主题「${topic}」生成结构化知识图谱骨架。

只输出 JSON，不要有任何解释文字或代码块标记。

格式：
{
  "nodes": [
    {"id": "root", "label": "主题名称", "level": 0, "prerequisites": [], "estimatedHours": 0, "difficulty": "beginner"},
    {"id": "core_1", "label": "核心模块（10字内）", "level": 1, "prerequisites": ["root"], "estimatedHours": 10, "difficulty": "beginner"},
    {"id": "topic_1_1", "label": "具体知识点（10字内）", "level": 2, "prerequisites": ["core_1"], "estimatedHours": 3, "difficulty": "beginner"}
  ],
  "edges": [
    {"source": "root", "target": "core_1"},
    {"source": "core_1", "target": "topic_1_1"}
  ]
}

规则：
1. 根节点1个
2. 主干节点（level=1）：3-6个，名称具体
3. 叶子节点（level=2）：每主干下2-4个
4. 总节点数 12-20个
5. 使用中文`;

const groupOf = (level: number): Node['group'] =>
  level === 0 ? 'Foundation' : level === 1 ? 'Core' : level === 2 ? 'Advanced' : 'Related';

/**
 * 流式生成学习路径。
 * onProgress(nodeCount, labels) 在每发现新节点时调用，可用于实时更新 UI。
 */
export const generateLearningPath = async (
  topic: string,
  onProgress?: (nodeCount: number, labels: string[]) => void,
  signal?: AbortSignal
): Promise<GraphData> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: "你是专业课程设计专家，只输出符合要求的 JSON。" },
        { role: "user", content: PROMPT(topic) },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || res.statusText;
    if (res.status === 429) throw Object.assign(new Error(`QUOTA_EXCEEDED: ${msg}`), { status: 429 });
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastNodeCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          buffer += JSON.parse(data).choices?.[0]?.delta?.content || '';
        } catch { /* ignore parse errors on SSE chunks */ }
      }

      if (onProgress) {
        const matches = [...buffer.matchAll(/"label"\s*:\s*"([^"]+)"/g)];
        if (matches.length !== lastNodeCount) {
          lastNodeCount = matches.length;
          onProgress(lastNodeCount, matches.map(m => m[1]));
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const jsonMatch = buffer.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON found in response");

  const rawData = JSON.parse(jsonMatch[0]);

  const nodes: Node[] = rawData.nodes.map((node: any, index: number) => ({
    id: node.id,
    orderId: index + 1,
    label: node.label,
    description: '',
    group: groupOf(node.level),
    level: node.level,
    prerequisites: node.prerequisites || [],
    estimatedHours: node.estimatedHours || 0,
    difficulty: node.difficulty || 'beginner',
  }));

  return { nodes, edges: rawData.edges };
};

/**
 * 批量生成节点一句话简介（Phase 2，后台运行）
 */
export const enrichNodeDescriptions = async (
  nodes: { id: string; label: string }[],
  topic: string
): Promise<Record<string, string>> => {
  const nodeList = nodes.map(n => `${n.id}: ${n.label}`).join('\n');
  const prompt = `为以下「${topic}」知识图谱的各节点写一句话简介（15-30字，说明该知识点的核心内容或作用）。

节点列表：
${nodeList}

只输出 JSON，key 为节点 id，value 为简介：
{"node_id": "简介文字", ...}`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "你是专业课程设计专家，只输出符合要求的 JSON。" },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return {};
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content as string || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
};

export const fetchNodeDetails = async (nodeLabel: string, mainTopic: string): Promise<NodeDetailData> => {
  const prompt = `我正在学习「${mainTopic}」，请为子主题「${nodeLabel}」提供详细的学习指南。

请用 Markdown 格式组织回答：
1. **概念讲解**：清晰深入地解释该概念（约150字）
2. **核心要点**：用要点列举最重要的内容
3. **实践示例**：提供一个真实的使用场景或代码示例（如适用）
4. **学习资源**：推荐3-5个高质量的免费学习资源（官方文档、视频教程或权威文章）

重要：全部内容必须使用简体中文。`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "你是一位专业的技术教育专家，用简体中文提供清晰、实用的学习指导。" },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as any;
  return { content: data.choices?.[0]?.message?.content || "暂无详细内容。", sources: [] };
};
