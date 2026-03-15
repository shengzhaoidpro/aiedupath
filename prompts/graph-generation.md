<!-- system: 你是专业课程设计专家，只输出符合要求的 JSON。 -->

你是专业课程设计专家。为主题「{{TOPIC}}」生成结构化知识图谱骨架。

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
5. 使用中文
