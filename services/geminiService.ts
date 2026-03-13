import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, NodeDetailData, GroundingSource } from "../types";

// Lazy initialization of Gemini Client
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing. Please check your environment configuration.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// Helper to retry functions with exponential backoff on 429/Quota errors
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 4000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Normalize error checking for various SDK response formats
    // The raw error might be { error: { code: 429, message: "...", status: "RESOURCE_EXHAUSTED" } }
    const status = error?.status || error?.response?.status || error?.error?.code || error?.code;
    const message = error?.message || error?.error?.message || JSON.stringify(error);
    
    const isRateLimit = status === 429 || 
                        status === 'RESOURCE_EXHAUSTED' ||
                        (typeof message === 'string' && (
                          message.includes('429') || 
                          message.includes('RESOURCE_EXHAUSTED') ||
                          message.includes('quota')
                        ));

    if (retries > 0 && isRateLimit) {
      console.warn(`API Quota/Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));
      // Retry with incremented delay
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    
    // If retries exhausted or not a rate limit, ensure we throw a standardized error if it was a rate limit
    if (isRateLimit) {
        throw new Error(`QUOTA_EXCEEDED: ${typeof message === 'string' ? message : 'API Quota Exceeded'}`);
    }
    throw error;
  }
};

export const generateLearningPath = async (topic: string): Promise<GraphData> => {
  const modelId = "gemini-2.0-flash";

  const prompt = `
你是一位专业的课程设计专家和知识图谱设计师。请为主题「${topic}」生成一个高质量的结构化知识点学习路径。

**严格输出规范：**
只输出 JSON，不要有任何解释文字、markdown 代码块标记或其他内容。

输出格式：
{
  "nodes": [
    {
      "id": "root",
      "label": "主题名称",
      "description": "200字左右的总体介绍：该领域的定义、重要性、核心价值、主要应用场景、学习后能解决什么问题",
      "level": 0,
      "prerequisites": [],
      "estimatedHours": 0,
      "difficulty": "beginner"
    },
    {
      "id": "core_[n]",
      "label": "核心模块名（10字以内，具体明确）",
      "description": "200字左右：1)该模块是什么；2)在整体学习路径中的位置和重要性；3)掌握后能做什么",
      "level": 1,
      "prerequisites": ["root"],
      "estimatedHours": 预估小时数,
      "difficulty": "beginner/intermediate/advanced"
    },
    {
      "id": "topic_[n]_[m]",
      "label": "具体知识点（10字以内）",
      "description": "200字左右：1)精确定义和核心原理；2)具体的实际应用例子；3)学习要点和常见误区",
      "level": 2,
      "prerequisites": ["core_[n]"],
      "estimatedHours": 预估小时数,
      "difficulty": "beginner/intermediate/advanced"
    }
  ],
  "edges": [
    {"source": "父节点id", "target": "子节点id"}
  ],
  "metadata": {
    "totalHours": 总学时,
    "difficulty": "overall",
    "description": "一句话总结"
  }
}

**生成规则（必须严格遵守）：**
1. 根节点：1个，代表学习主题本身
2. 主干节点（level=1）：3-6个，每个必须是该领域真实的、独立的核心知识模块，不能有交叉重叠，不能使用"基础"、"进阶"、"概述"这类泛化词汇
3. 叶子节点（level=2）：每个主干下2-5个，必须是具体的、可操作的知识单元
4. 禁止使用的节点名称：任何包含"其他"、"扩展"、"补充"、"概述"、"入门"（单独作为节点名）的节点
5. description 必须包含实质内容，150-250字，禁止使用"这是一个重要的知识点"这类空话
6. prerequisites 必须准确反映学习依赖关系，叶子节点只依赖其直接父节点
7. 总节点数 15-28 个
8. 全程使用中文
`;

  return retryWithBackoff(async () => {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) {
      throw new Error("No data returned from Gemini");
    }

    // Extract JSON using regex to handle potential markdown blocks
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    let rawData: any;
    try {
      rawData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      throw new Error("Failed to parse generated JSON");
    }

    // Map to GraphData structure
    const nodes = rawData.nodes.map((node: any, index: number) => {
      let group: 'Foundation' | 'Core' | 'Advanced' | 'Practical' | 'Related' = 'Related';
      
      // Map level to group for visualization
      if (node.level === 0) group = 'Foundation';
      else if (node.level === 1) group = 'Core';
      else if (node.level === 2) group = 'Advanced';
      
      return {
        id: node.id,
        orderId: index + 1,
        label: node.label,
        description: node.description,
        group: group,
        level: node.level,
        prerequisites: node.prerequisites,
        estimatedHours: node.estimatedHours,
        difficulty: node.difficulty
      };
    });

    return {
      nodes: nodes,
      edges: rawData.edges
    };
  });
};

export const fetchNodeDetails = async (nodeLabel: string, mainTopic: string): Promise<NodeDetailData> => {
  // Use a model capable of search grounding
  const modelId = "gemini-2.0-flash";

  const prompt = `
    I am learning about "${mainTopic}". 
    Please provide a detailed learning guide for the specific sub-topic: "${nodeLabel}".
    
    Structure the response in Markdown:
    1. **Explanation**: A clear, in-depth explanation of the concept (approx 150 words).
    2. **Key Takeaways**: Bullet points of what is most important to remember.
    3. **Practical Example**: A real-world use case or code snippet if applicable.
    
    IMPORTANT: The entire response content MUST be in Simplified Chinese (简体中文).
    
    Crucial: Use Google Search to find 3-5 high-quality, free online resources (video tutorials, official documentation, or reputable articles) specifically for learning "${nodeLabel}".
  `;

  return retryWithBackoff(async () => {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let content = response.text || "No detailed content available.";
    
    // Extract grounding information
    const sources: GroundingSource[] = [];
    const candidate = response.candidates?.[0];
    const metadata = candidate?.groundingMetadata;

    if (metadata?.groundingChunks) {
      // 1. Build sources list from chunks
      metadata.groundingChunks.forEach((chunk: any, index: number) => {
        const title = chunk.web?.title || `Source ${index + 1}`;
        const uri = chunk.web?.uri || "";
        // Only add valid sources, but keep indices aligned
        sources.push({ title, uri });
      });

      // 2. Inject inline citations into content
      // groundingSupports provides a mapping between text segments and source indices
      if (metadata.groundingSupports) {
        // Sort supports by endIndex in descending order to insert safely without shifting previous indices
        const supports = [...metadata.groundingSupports].sort((a: any, b: any) => {
          return (b.segment?.endIndex || 0) - (a.segment?.endIndex || 0);
        });

        supports.forEach((support: any) => {
          const endIndex = support.segment?.endIndex;
          const chunkIndices = support.groundingChunkIndices;
          
          if (typeof endIndex === 'number' && chunkIndices && chunkIndices.length > 0) {
            // Create custom citation links: [1](citation:0)
            const citationText = chunkIndices.map((idx: number) => {
                if (idx < sources.length && sources[idx].uri) {
                    return ` [${idx + 1}](citation:${idx})`;
                }
                return '';
            }).join('');
            
            if (citationText) {
                content = content.slice(0, endIndex) + citationText + content.slice(endIndex);
            }
          }
        });
      }
    }

    return {
      content,
      sources
    };
  });
};