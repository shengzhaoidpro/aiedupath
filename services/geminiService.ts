import { GraphData, Node, NodeDetailData } from "../types";
import graphGenerationRaw from "../prompts/graph-generation.md?raw";
import nodeDescriptionsRaw from "../prompts/node-descriptions.md?raw";
import nodeDetailsRaw from "../prompts/node-details.md?raw";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const getApiKey = () => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("API Key is missing. Please check your environment configuration.");
  return key;
};

// ── Prompt helpers ────────────────────────────────────────────────────────────

/** Extract system / user content from an MD prompt file.
 *  The first HTML comment `<!-- system: ... -->` becomes the system message;
 *  everything else (after stripping the comment) is the user message. */
function parsePromptFile(raw: string): { system: string; user: string } {
  const match = raw.match(/<!--\s*system:\s*([\s\S]*?)\s*-->/);
  return {
    system: match?.[1]?.trim() ?? "",
    user: raw.replace(/<!--[\s\S]*?-->/g, "").trim(),
  };
}

/** Replace `{{KEY}}` placeholders with the supplied values. */
function fillPrompt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v),
    template
  );
}

// Parse MD files once at module load
const graphGen   = parsePromptFile(graphGenerationRaw);
const nodeDesc   = parsePromptFile(nodeDescriptionsRaw);
const nodeDetail = parsePromptFile(nodeDetailsRaw);

// ── Type helpers ──────────────────────────────────────────────────────────────

const groupOf = (level: number): Node["group"] =>
  level === 0 ? "Foundation" : level === 1 ? "Core" : level === 2 ? "Advanced" : "Related";

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * 流式生成学习路径（Phase 1）。
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
        { role: "system", content: graphGen.system },
        { role: "user",   content: fillPrompt(graphGen.user, { TOPIC: topic }) },
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
  let buffer = "";
  let lastNodeCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;
        try {
          buffer += JSON.parse(data).choices?.[0]?.delta?.content || "";
        } catch { /* ignore SSE parse errors */ }
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
    description: "",
    group: groupOf(node.level),
    level: node.level,
    prerequisites: node.prerequisites || [],
    estimatedHours: node.estimatedHours || 0,
    difficulty: node.difficulty || "beginner",
  }));

  return { nodes, edges: rawData.edges };
};

/**
 * 批量生成节点一句话简介（Phase 2，后台运行）。
 */
export const enrichNodeDescriptions = async (
  nodes: { id: string; label: string }[],
  topic: string
): Promise<Record<string, string>> => {
  const nodeList = nodes.map(n => `${n.id}: ${n.label}`).join("\n");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: nodeDesc.system },
        { role: "user",   content: fillPrompt(nodeDesc.user, { TOPIC: topic, NODE_LIST: nodeList }) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return {};
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content as string || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
};

/**
 * 获取单个节点的详细学习指南。
 */
export const fetchNodeDetails = async (nodeLabel: string, mainTopic: string): Promise<NodeDetailData> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: nodeDetail.system },
        { role: "user",   content: fillPrompt(nodeDetail.user, { NODE_LABEL: nodeLabel, MAIN_TOPIC: mainTopic }) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as any;
  return { content: data.choices?.[0]?.message?.content || "暂无详细内容。", sources: [] };
};
