用户想学习的主题是：{{topic}}

{% if user_context %}
用户补充的背景：{{user_context}}
{% endif %}

请为这个主题生成一条完整的学习路径。

要求：
1. Phase 数量：根据主题复杂度判断，工具类 3 个 Phase，框架/系统类 4–5 个 Phase
2. 每个 Phase 包含 2–4 张卡片，总卡片数控制在 8–16 张
3. Phase 颜色分配建议：认知类用 teal，分析类用 purple，实践类用 coral，进阶类用 amber，拓展类用 gray
4. 必须有且只有一张卡片的 is_recommended_start 为 true（推荐起点），放在 card 层级
5. tip 部分要说清楚为什么推荐这个起点，而不是其他卡片

只输出 JSON，不输出任何解释文字。
