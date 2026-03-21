import { LearningPath, Phase, Card, ChatMessage, Persona } from "../types";
import systemRaw from "../prompts/system.md?raw";
import pathGenerationRaw from "../prompts/path-generation.md?raw";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const getApiKey = () => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("API Key is missing. Please check your environment configuration.");
  return key;
};

const systemPrompt = systemRaw.trim();

// ── Template helpers ───────────────────────────────────────────────────────────

function fillTemplate(template: string, vars: Record<string, string | undefined>): string {
  let result = template.replace(
    /\{%\s*if\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
    (_m, key: string, block: string) => (vars[key] ? block : "")
  );
  result = result.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
  return result.trim();
}

// ── Progressive JSON parsing ───────────────────────────────────────────────────

/** Extract topic/summary/estimated_hours as soon as their strings are complete in the stream. */
function tryExtractHeader(buffer: string): Partial<Pick<LearningPath, "topic" | "summary" | "estimated_hours">> {
  const result: Partial<Pick<LearningPath, "topic" | "summary" | "estimated_hours">> = {};
  const m1 = buffer.match(/"topic"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m1) result.topic = m1[1].replace(/\\"/g, '"');
  const m2 = buffer.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m2) result.summary = m2[1].replace(/\\"/g, '"');
  const m3 = buffer.match(/"estimated_hours"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m3) result.estimated_hours = m3[1].replace(/\\"/g, '"');
  return result;
}

/** Walk the phases array in the buffer and return any newly completed Phase objects. */
function extractCompletedPhases(buffer: string, alreadyExtracted: number): Phase[] {
  const phasesIdx = buffer.indexOf('"phases"');
  if (phasesIdx === -1) return [];
  const arrayStart = buffer.indexOf("[", phasesIdx);
  if (arrayStart === -1) return [];

  const results: Phase[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let phaseStart = -1;
  let completedCount = 0;

  for (let i = arrayStart + 1; i < buffer.length; i++) {
    const ch = buffer[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) phaseStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && phaseStart !== -1) {
        completedCount++;
        if (completedCount > alreadyExtracted) {
          try {
            results.push(JSON.parse(buffer.slice(phaseStart, i + 1)) as Phase);
          } catch { /* partial JSON, ignore */ }
        }
        phaseStart = -1;
      }
    } else if (ch === "]" && depth === 0) {
      break;
    }
  }
  return results;
}

// ── Non-streaming direct request (no system prompt) ───────────────────────────

async function directRequest(
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ model: MODEL, stream: false, messages }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error((err as any)?.error?.message || res.statusText), { status: res.status });
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Persona block builder ──────────────────────────────────────────────────────

function buildPersonaBlock(p: Persona): string {
  const techMap: Record<string, string> = {
    low: "入门（无技术背景）",
    mid: "中级（有编程经验）",
    high: "高级（技术专家）",
  };
  const prior = p.prior_knowledge.length > 0 ? p.prior_knowledge.join("、") : "无";
  return `
用户画像（请严格按此定制路径）：
- 职业背景：${p.profession}
- 技术水平：${techMap[p.tech_level] ?? p.tech_level}
- 学习目标：${p.goal}
- 已有基础：${prior}
- 一句话描述：${p.inferred_summary}

根据以上画像调整路径的以下四个维度：

1. Phase 数量：
   - tech_level=low → 5 个 Phase，前两个 Phase 做充分铺垫
   - tech_level=mid → 4 个 Phase，适度铺垫
   - tech_level=high 或 skip_basics=true → 3 个 Phase，直接从实战开始
   （当前：${p.tech_level}${p.skip_basics ? "，skip_basics=true" : ""}，请生成对应数量的 Phase）

2. 卡片类比方式（当前职业：${p.profession}）：
   - 设计师：用视觉/交互/Figma 等设计工具做类比
   - 工程师：用代码/API/架构做类比，可直接使用技术术语
   - 产品经理：用需求/场景/决策做类比
   - 学生：用课程/考试/作业做类比，解释每个专业术语

3. 推荐起点（is_recommended_start）：
   - tech_level=low → 推荐第一个 Phase 的第一张卡片
   - tech_level=mid → 推荐第二个 Phase 的第一张卡片
   - tech_level=high → 推荐第一个实战 Phase 的卡片

4. 卡片详情写法：
   - tech_level=low：用日常生活类比，避免术语，给出手把手步骤
   - tech_level=mid：适度解释术语，给出具体操作步骤
   - tech_level=high：直接给原理和最佳实践，可以给代码示例
${prior !== "无" ? `\n已掌握技能（${prior}）对应的基础内容可压缩或跳过。` : ""}`.trim();
}

// ── Shared streaming request ───────────────────────────────────────────────────

async function streamRequest(
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
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
  let full = "";

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
          const chunk = JSON.parse(data).choices?.[0]?.delta?.content || "";
          full += chunk;
          if (chunk) onChunk(chunk);
        } catch { /* ignore SSE parse errors */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return full;
}

// ── Shared path streaming logic ────────────────────────────────────────────────

async function _runPathStream(
  userMessage: string,
  opts?: {
    onPhase?: (phase: Phase) => void;
    onHeader?: (header: Partial<LearningPath>) => void;
    signal?: AbortSignal;
  }
): Promise<LearningPath> {
  let buffer = "";
  let phasesExtracted = 0;
  let headerEmitted = false;

  const full = await streamRequest(
    [{ role: "user", content: userMessage }],
    (chunk) => {
      buffer += chunk;

      if (!headerEmitted && opts?.onHeader) {
        const header = tryExtractHeader(buffer);
        if (header.topic || header.summary || header.estimated_hours) {
          opts.onHeader(header);
          if (header.topic && header.summary && header.estimated_hours) {
            headerEmitted = true;
          }
        }
      }

      if (opts?.onPhase) {
        const newPhases = extractCompletedPhases(buffer, phasesExtracted);
        if (newPhases.length > 0) {
          phasesExtracted += newPhases.length;
          newPhases.forEach((p) => opts.onPhase!(p));
        }
      }
    },
    opts?.signal
  );

  const jsonMatch = full.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON found in response");
  return JSON.parse(jsonMatch[0]) as LearningPath;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Layer 3: 根据卡片信息在前端构建 action_prompt。
 * 遵循 [角色设定] + [具体任务] + [上下文约束] + [期望输出格式] 模式。
 */
export function buildActionPrompt(card: Card, topic: string): string {
  const isHandsOn = ["实战", "部署", "优化"].includes(card.resource_type);
  return `我正在学习「${topic}」，请帮我深入理解「${card.card_name}」——${card.card_subtitle}

请按以下结构组织回答：
1. **核心概念**：用结构图、类比或关键定义解释这个知识点是什么
2. **关键要点**：列出 3–5 个最重要的内容
3. **实践任务**：给我一个${isHandsOn ? "可以立即动手完成的具体操作步骤" : "具体的思考练习或真实应用场景"}
4. **常见误区**：说明学习这个知识点时容易走弯路的地方

语言：中文，直接实用，${isHandsOn ? "包含可参考的示例" : "不需要长篇理论"}。

格式约束：对比、结构图、流程说明一律用表格或列表呈现，禁止使用代码块（\`\`\`）展示非代码内容；代码块只用于真实可运行的代码片段。`;
}

/**
 * 解析用户背景描述，提取学习画像。使用无 system prompt 的直接调用。
 */
export async function parsePersona(contextText: string, signal?: AbortSignal): Promise<Persona> {
  const userMessage = `从以下用户描述中提取学习画像，只输出 JSON，不输出其他内容：

{
  "profession": "职业，如设计师/工程师/产品经理/学生/其他",
  "tech_level": "low|mid|high（low=无技术背景，mid=有基础，high=技术专家）",
  "goal": "工具使用|原理理解|职业转型|团队应用",
  "prior_knowledge": ["已掌握的相关技能列表，没有则为空数组"],
  "skip_basics": false,
  "inferred_summary": "一句话总结，15字以内"
}

用户描述：${contextText}`;

  const raw = await directRequest([{ role: "user", content: userMessage }], signal);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Persona JSON not found in response");
  return JSON.parse(jsonMatch[0]) as Persona;
}

/**
 * Layer 2: 流式生成学习路径，边生成边渐进渲染。
 */
export const generatePath = async (
  topic: string,
  opts?: {
    userContext?: string;
    persona?: Persona | null;
    onPhase?: (phase: Phase) => void;
    onHeader?: (header: Partial<LearningPath>) => void;
    signal?: AbortSignal;
  }
): Promise<LearningPath> => {
  let userMessage = fillTemplate(pathGenerationRaw, {
    topic,
    user_context: opts?.userContext,
  });
  if (opts?.persona) {
    userMessage += "\n\n" + buildPersonaBlock(opts.persona);
  }
  return _runPathStream(userMessage, opts);
};

/**
 * 迭代生成: 基于上一版路径和用户反馈，定向优化路径。
 */
export const generateIteration = async (
  topic: string,
  previousPath: LearningPath,
  iterationNote: string,
  opts?: {
    userContext?: string;
    persona?: Persona | null;
    onPhase?: (phase: Phase) => void;
    onHeader?: (header: Partial<LearningPath>) => void;
    signal?: AbortSignal;
  }
): Promise<LearningPath> => {
  let userMessage = [
    `主题：${topic}`,
    opts?.userContext ? `用户背景：${opts.userContext}` : "",
    "",
    "上一版路径结构：",
    JSON.stringify(previousPath, null, 2),
    "",
    `用户反馈：${iterationNote}`,
    "",
    "请在上一版基础上优化这条学习路径。保留结构合理的阶段和卡片，重点改进用户指出的问题。输出格式与上一版完全相同的 JSON Schema。",
  ].filter((line) => line !== null).join("\n").trim();

  if (opts?.persona) {
    userMessage += "\n\n" + buildPersonaBlock(opts.persona);
  }

  return _runPathStream(userMessage, opts);
};

/**
 * Layer 3: 点击卡片后流式获取详情。
 */
export const fetchCardDetail = async (
  actionPrompt: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  await streamRequest([{ role: "user", content: actionPrompt }], onChunk, signal);
};

/**
 * Layer 3 追问: 多轮对话。
 */
export const sendFollowUp = async (
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  await streamRequest(
    messages.map((m) => ({ role: m.role, content: m.content })),
    onChunk,
    signal
  );
};
