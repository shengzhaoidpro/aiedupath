import { GraphData, NodeDetailData } from "../types";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const getApiKey = () => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("API Key is missing. Please check your environment configuration.");
  return key;
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 4000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.status || error?.code;
    const message = error?.message || '';
    const isRateLimit = status === 429 ||
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('quota') ||
      message.includes('rate limit');

    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    if (isRateLimit) throw new Error(`QUOTA_EXCEEDED: ${message}`);
    throw error;
  }
};

const callDeepSeek = async (messages: { role: string; content: string }[], jsonMode = false) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || res.statusText;
    const error: any = new Error(msg);
    error.status = res.status;
    throw error;
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content as string;
};

export const generateLearningPath = async (topic: string): Promise<GraphData> => {
  const prompt = `你是一位专业的课程设计专家和知识图谱设计师。请为主题「${topic}」生成一个高质量的结构化知识点学习路径。

只输出 JSON，不要有任何解释文字、markdown 代码块标记或其他内容。

输出格式：
{
  "nodes": [
    {
      "id": "root",
      "label": "主题名称",
      "description": "200字左右的总体介绍",
      "level": 0,
      "prerequisites": [],
      "estimatedHours": 0,
      "difficulty": "beginner"
    },
    {
      "id": "core_1",
      "label": "核心模块名（10字以内）",
      "description": "200字左右描述",
      "level": 1,
      "prerequisites": ["root"],
      "estimatedHours": 10,
      "difficulty": "beginner"
    },
    {
      "id": "topic_1_1",
      "label": "具体知识点（10字以内）",
      "description": "200字左右描述",
      "level": 2,
      "prerequisites": ["core_1"],
      "estimatedHours": 3,
      "difficulty": "beginner"
    }
  ],
  "edges": [
    {"source": "root", "target": "core_1"},
    {"source": "core_1", "target": "topic_1_1"}
  ],
  "metadata": {
    "totalHours": 50,
    "difficulty": "intermediate",
    "description": "一句话总结"
  }
}

生成规则：
1. 根节点：1个
2. 主干节点（level=1）：3-6个，各自独立，不使用"基础"、"进阶"、"概述"等泛化词
3. 叶子节点（level=2）：每个主干下2-5个，具体可操作
4. description 必须包含实质内容，150-250字
5. 总节点数 15-28 个
6. 全程使用中文`;

  return retryWithBackoff(async () => {
    const text = await callDeepSeek([
      { role: "system", content: "你是一位专业的课程设计专家，只输出符合要求的 JSON，不输出任何其他内容。" },
      { role: "user", content: prompt },
    ], true);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in response");

    let rawData: any;
    try {
      rawData = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse generated JSON");
    }

    const nodes = rawData.nodes.map((node: any, index: number) => {
      let group: 'Foundation' | 'Core' | 'Advanced' | 'Practical' | 'Related' = 'Related';
      if (node.level === 0) group = 'Foundation';
      else if (node.level === 1) group = 'Core';
      else if (node.level === 2) group = 'Advanced';

      return {
        id: node.id,
        orderId: index + 1,
        label: node.label,
        description: node.description,
        group,
        level: node.level,
        prerequisites: node.prerequisites,
        estimatedHours: node.estimatedHours,
        difficulty: node.difficulty,
      };
    });

    return { nodes, edges: rawData.edges };
  });
};

export const fetchNodeDetails = async (nodeLabel: string, mainTopic: string): Promise<NodeDetailData> => {
  const prompt = `我正在学习「${mainTopic}」，请为子主题「${nodeLabel}」提供详细的学习指南。

请用 Markdown 格式组织回答：
1. **概念讲解**：清晰深入地解释该概念（约150字）
2. **核心要点**：用要点列举最重要的内容
3. **实践示例**：提供一个真实的使用场景或代码示例（如适用）
4. **学习资源**：推荐3-5个高质量的免费学习资源（官方文档、视频教程或权威文章）

重要：全部内容必须使用简体中文。`;

  return retryWithBackoff(async () => {
    const content = await callDeepSeek([
      { role: "system", content: "你是一位专业的技术教育专家，用简体中文提供清晰、实用的学习指导。" },
      { role: "user", content: prompt },
    ]);

    return { content: content || "暂无详细内容。", sources: [] };
  });
};
