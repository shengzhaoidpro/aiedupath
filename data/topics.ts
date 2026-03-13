import { RecommendedTopic } from '../types';

export const topicCategories = [
  { id: 'ai', label: '人工智能 (AI)' },
  { id: 'frontend', label: '前端开发 (Frontend)' },
  { id: 'backend', label: '后端架构 (Backend)' },
  { id: 'data', label: '数据科学 (Data)' },
  { id: 'security', label: '网络安全 (Security)' },
  { id: 'design_product', label: '设计与产品 (Design & Product)' }
];

export const allTopics: Record<string, RecommendedTopic[]> = {
  'ai': [
    { 
      id: 'ai-1', 
      label: '人工智能全景 (AI Overview)', 
      query: 'Artificial Intelligence Overview History and Future', 
      icon: '🤖',
      desc: '从历史演变到未来趋势的宏观视角，了解 AI 的定义、流派与核心价值'
    },
    { 
      id: 'ai-2', 
      label: '大语言模型原理 (LLMs)', 
      query: 'Large Language Models Principles Transformer Architecture', 
      icon: '🧠',
      desc: '深入解析 Transformer 架构、预训练机制 (Pre-training) 与微调技术'
    },
    { 
      id: 'ai-3', 
      label: '提示词工程 (Prompt Eng)', 
      query: 'Prompt Engineering Techniques and Best Practices', 
      icon: '✨',
      desc: '掌握与 AI 高效对话的核心技巧：CoT、Few-shot、ReAct 等策略'
    },
    { 
      id: 'ai-4', 
      label: '机器学习基础 (ML Basics)', 
      query: 'Machine Learning Fundamentals Supervised Unsupervised Learning', 
      icon: '📊',
      desc: '涵盖监督学习、非监督学习、回归、分类等核心算法与数学基础'
    },
    { 
      id: 'ai-5', 
      label: 'RAG 应用开发', 
      query: 'Retrieval-Augmented Generation RAG Architecture', 
      icon: '🔗',
      desc: '检索增强生成技术架构解析：向量数据库、检索策略与生成优化'
    },
    { 
      id: 'ai-6', 
      label: '计算机视觉 (CV)', 
      query: 'Computer Vision CNN and Image Processing', 
      icon: '👁️',
      desc: '图像识别、目标检测、分割与卷积神经网络 (CNN) 原理'
    },
    { 
      id: 'ai-7', 
      label: '深度学习 (Deep Learning)', 
      query: 'Deep Learning Neural Networks Backpropagation', 
      icon: '🕸️',
      desc: '神经网络深度解析：反向传播、激活函数、优化器与模型训练'
    },
    { 
      id: 'ai-8', 
      label: '自然语言处理 (NLP)', 
      query: 'Natural Language Processing NLP Basics', 
      icon: '🗣️',
      desc: '文本处理、分词、词向量 (Word2Vec)、序列模型 (RNN/LSTM)'
    },
    { 
      id: 'ai-9', 
      label: '强化学习 (RL)', 
      query: 'Reinforcement Learning MDP Q-Learning', 
      icon: '🎮',
      desc: '智能体决策机制：马尔可夫决策过程、Q-Learning 与策略梯度'
    },
    { 
      id: 'ai-10', 
      label: 'AI Agent 开发', 
      query: 'AI Autonomous Agents Architecture', 
      icon: '🕵️',
      desc: '构建自主智能体：规划、记忆、工具使用与多智能体协作'
    },
    { 
      id: 'ai-11', 
      label: 'LangChain 框架', 
      query: 'LangChain Framework Tutorial', 
      icon: '🦜',
      desc: 'LLM 应用开发框架实战：Chains, Agents, Memory 与 Callbacks'
    },
    { 
      id: 'ai-12', 
      label: '扩散模型 (Diffusion)', 
      query: 'Diffusion Models Stable Diffusion Principles', 
      icon: '🎨',
      desc: 'AI 绘画背后的原理：去噪扩散概率模型 (DDPM) 与 Stable Diffusion'
    },
    { 
      id: 'ai-13', 
      label: '向量数据库', 
      query: 'Vector Databases Embeddings Search', 
      icon: '🗄️',
      desc: '高维数据存储与检索：Embeddings 原理、相似度计算与主流数据库'
    },
    { 
      id: 'ai-14', 
      label: '模型微调 (Fine-tuning)', 
      query: 'LLM Fine-tuning PEFT LoRA', 
      icon: '🔧',
      desc: '低成本定制模型：PEFT、LoRA、P-Tuning 等高效微调技术'
    },
    { 
      id: 'ai-15', 
      label: 'AI 伦理与安全', 
      query: 'AI Ethics Safety Alignment', 
      icon: '⚖️',
      desc: '偏见、幻觉、对齐问题 (Alignment) 与 AI 安全风险防范'
    },
    { 
      id: 'ai-16', 
      label: '多模态模型', 
      query: 'Multimodal AI Models CLIP GPT-4V', 
      icon: '🎼',
      desc: '图文音视频跨模态理解与生成：CLIP, GPT-4V, Gemini 原理'
    },
    { 
      id: 'ai-17', 
      label: '边缘 AI (Edge AI)', 
      query: 'Edge AI TinyML IoT', 
      icon: '📱',
      desc: '在移动端与 IoT 设备上部署轻量级 AI 模型 (TinyML)'
    },
    { 
      id: 'ai-18', 
      label: '推荐系统', 
      query: 'Recommender Systems Collaborative Filtering', 
      icon: '👍',
      desc: '协同过滤、内容推荐与深度学习推荐算法架构'
    },
    { 
      id: 'ai-19', 
      label: '生成式对抗网络 (GANs)', 
      query: 'Generative Adversarial Networks GANs', 
      icon: '🎭',
      desc: '生成器与判别器的博弈：图像生成、风格迁移与超分辨率'
    },
    { 
      id: 'ai-20', 
      label: 'AI 算力与硬件', 
      query: 'AI Hardware GPU TPU NPU', 
      icon: '💾',
      desc: 'AI 芯片架构：GPU, TPU, NPU 与分布式训练基础设施'
    }
  ],
  'frontend': [
    { 
      id: 'fe-1', 
      label: 'React 进阶', 
      query: 'Advanced React Patterns Hooks Performance', 
      icon: '⚛️',
      desc: '深入 Hooks 原理、并发模式、自定义 Hooks 与高级组件模式'
    },
    { 
      id: 'fe-2', 
      label: 'Vue.js 生态', 
      query: 'Vue.js 3 Composition API Pinia', 
      icon: '🟢',
      desc: 'Vue 3 核心解析：响应式原理、Composition API 与 Pinia 状态管理'
    },
    { 
      id: 'fe-3', 
      label: 'TypeScript 高级编程', 
      query: 'Advanced TypeScript Generics Utility Types', 
      icon: '📘',
      desc: '类型体操：泛型、条件类型、映射类型与类型推断技巧'
    },
    { 
      id: 'fe-4', 
      label: '前端性能优化', 
      query: 'Frontend Performance Optimization Web Vitals', 
      icon: '🚀',
      desc: 'Web Vitals 指标、资源加载优化、渲染性能与代码分割策略'
    },
    { 
      id: 'fe-5', 
      label: 'Next.js 全栈开发', 
      query: 'Next.js App Router SSR RSC', 
      icon: '▲',
      desc: 'App Router 架构、服务端组件 (RSC)、SSR/SSG 与 API Routes'
    },
    { 
      id: 'fe-6', 
      label: 'WebAssembly (Wasm)', 
      query: 'WebAssembly Rust Browser Performance', 
      icon: '⚙️',
      desc: '浏览器高性能计算：Wasm 原理、Rust/C++ 编译与 JS 互操作'
    },
    { 
      id: 'fe-7', 
      label: '微前端架构', 
      query: 'Micro Frontends Architecture qiankun module federation', 
      icon: '🧩',
      desc: '大型应用拆分：Module Federation, qiankun, iframe 等方案对比'
    },
    { 
      id: 'fe-8', 
      label: 'WebGL 与 3D 图形', 
      query: 'WebGL Three.js 3D Graphics', 
      icon: '🧊',
      desc: 'Three.js 实战、着色器 (Shader) 编程与 Web 3D 交互开发'
    },
    { 
      id: 'fe-9', 
      label: 'CSS 现代化', 
      query: 'Modern CSS Tailwind CSS-in-JS Layouts', 
      icon: '🎨',
      desc: 'Tailwind CSS, CSS Modules, CSS-in-JS 与现代布局 (Grid/Flex)'
    },
    { 
      id: 'fe-10', 
      label: '浏览器原理', 
      query: 'Browser Rendering Engine Event Loop V8', 
      icon: '🌏',
      desc: '深入 V8 引擎、事件循环 (Event Loop)、渲染流水线与网络协议'
    },
    { 
      id: 'fe-11', 
      label: '前端工程化', 
      query: 'Frontend Engineering Vite Webpack CI/CD', 
      icon: '🛠️',
      desc: '构建工具 (Vite/Webpack)、Monorepo、Linting 与自动化部署'
    },
    { 
      id: 'fe-12', 
      label: '响应式设计', 
      query: 'Responsive Web Design Mobile Adaptation', 
      icon: '📱',
      desc: '多端适配策略、媒体查询、移动端手势与视口单位应用'
    },
    { 
      id: 'fe-13', 
      label: 'PWA 开发', 
      query: 'Progressive Web Apps Service Workers', 
      icon: '📲',
      desc: '渐进式 Web 应用：Service Workers, 离线缓存与安装体验'
    },
    { 
      id: 'fe-14', 
      label: '前端安全', 
      query: 'Web Frontend Security XSS CSRF CSP', 
      icon: '🛡️',
      desc: '防御 XSS, CSRF, 点击劫持与内容安全策略 (CSP) 最佳实践'
    },
    { 
      id: 'fe-15', 
      label: '状态管理', 
      query: 'Frontend State Management Redux Zustand Recoil', 
      icon: '📦',
      desc: 'Redux, Zustand, Recoil, Jotai 等状态库原理与选型'
    },
    { 
      id: 'fe-16', 
      label: '服务端渲染 (SSR)', 
      query: 'Server Side Rendering Hydration Isomorphic', 
      icon: '🖥️',
      desc: '同构渲染原理、水合 (Hydration) 过程与 SEO 优化'
    },
    { 
      id: 'fe-17', 
      label: '移动端 H5 开发', 
      query: 'Mobile Web Development Hybrid WebView', 
      icon: '🤳',
      desc: 'Hybrid App 架构、WebView 交互、JSBridge 原理与调试技巧'
    },
    { 
      id: 'fe-18', 
      label: 'Electron 桌面应用', 
      query: 'Electron Desktop App Development IPC', 
      icon: '💻',
      desc: '跨平台桌面开发：主进程/渲染进程通信、原生能力调用与打包'
    },
    { 
      id: 'fe-19', 
      label: 'WebRTC 实时通信', 
      query: 'WebRTC Real-time Communication P2P', 
      icon: '📹',
      desc: '点对点音视频通话、信令服务器与 NAT 穿透 (STUN/TURN)'
    },
    { 
      id: 'fe-20', 
      label: '无障碍设计 (A11y)', 
      query: 'Web Accessibility WCAG ARIA', 
      icon: '♿',
      desc: 'WCAG 标准、ARIA 属性与屏幕阅读器适配，构建包容性 Web'
    }
  ],
  'backend': [
    { 
      id: 'be-1', 
      label: '分布式系统基础', 
      query: 'Distributed Systems CAP Theorem Consistency', 
      icon: '🌐',
      desc: 'CAP 定理、BASE 理论、分布式一致性算法 (Paxos/Raft)'
    },
    { 
      id: 'be-2', 
      label: '微服务架构', 
      query: 'Microservices Architecture Patterns Design', 
      icon: '🏗️',
      desc: '服务拆分原则、服务治理、API 网关与配置中心'
    },
    { 
      id: 'be-3', 
      label: '高并发系统设计', 
      query: 'High Concurrency System Design Caching Load Balancing', 
      icon: '⚡',
      desc: '流量削峰、限流熔断、降级策略与多级缓存架构'
    },
    { 
      id: 'be-4', 
      label: '消息队列 (MQ)', 
      query: 'Message Queues Kafka RabbitMQ RocketMQ', 
      icon: '📨',
      desc: '解耦与异步处理：Kafka, RabbitMQ 选型与消息可靠性投递'
    },
    { 
      id: 'be-5', 
      label: 'Redis 缓存策略', 
      query: 'Redis Caching Strategies Data Structures', 
      icon: '🔴',
      desc: '缓存穿透/击穿/雪崩解决方案、持久化 (RDB/AOF) 与集群模式'
    },
    { 
      id: 'be-6', 
      label: '数据库设计', 
      query: 'Database Design SQL vs NoSQL Normalization', 
      icon: '💽',
      desc: '范式理论、索引优化、事务隔离级别与 SQL/NoSQL 选型'
    },
    { 
      id: 'be-7', 
      label: 'Go 语言高并发', 
      query: 'Golang Concurrency Goroutines Channels', 
      icon: '🐹',
      desc: 'Goroutine 调度模型 (GMP)、Channel 通信与 Go 内存管理'
    },
    { 
      id: 'be-8', 
      label: 'Rust 系统编程', 
      query: 'Rust Programming Ownership Borrowing', 
      icon: '🦀',
      desc: '所有权机制、借用检查、零成本抽象与内存安全编程'
    },
    { 
      id: 'be-9', 
      label: 'Spring 生态', 
      query: 'Spring Boot Cloud Framework Java', 
      icon: '🍃',
      desc: 'Spring Boot 自动装配、Spring Cloud 微服务组件全家桶'
    },
    { 
      id: 'be-10', 
      label: 'Node.js 后端', 
      query: 'Node.js Backend Architecture NestJS Event Loop', 
      icon: '🟩',
      desc: 'NestJS 框架、异步 I/O 模型、Stream 流处理与性能调优'
    },
    { 
      id: 'be-11', 
      label: 'API 设计规范', 
      query: 'API Design RESTful GraphQL gRPC', 
      icon: '🔌',
      desc: 'RESTful 最佳实践、GraphQL 查询语言与 gRPC 高性能 RPC'
    },
    { 
      id: 'be-12', 
      label: '容器化技术', 
      query: 'Docker Containerization Images Compose', 
      icon: '🐳',
      desc: 'Docker 镜像构建、容器生命周期管理与 Docker Compose 编排'
    },
    { 
      id: 'be-13', 
      label: 'Kubernetes (K8s)', 
      query: 'Kubernetes Architecture Pods Services Deployments', 
      icon: '☸️',
      desc: 'K8s 核心概念：Pod, Service, Deployment 与自动化运维'
    },
    { 
      id: 'be-14', 
      label: '服务网格 (Service Mesh)', 
      query: 'Service Mesh Istio Sidecar Pattern', 
      icon: '🕸️',
      desc: 'Istio 架构、Sidecar 模式、流量控制与全链路监控'
    },
    { 
      id: 'be-15', 
      label: 'Serverless 架构', 
      query: 'Serverless Computing FaaS AWS Lambda', 
      icon: '☁️',
      desc: '无服务器计算：FaaS 原理、冷启动优化与事件驱动架构'
    },
    { 
      id: 'be-16', 
      label: '认证与授权', 
      query: 'Authentication Authorization OAuth2 JWT OIDC', 
      icon: '🔐',
      desc: 'OAuth 2.0 流程、JWT 原理、SSO 单点登录与 RBAC 权限模型'
    },
    { 
      id: 'be-17', 
      label: '全文搜索引擎', 
      query: 'Elasticsearch Search Engine Lucene', 
      icon: '🔍',
      desc: 'Elasticsearch 倒排索引、分词器、聚合查询与集群优化'
    },
    { 
      id: 'be-18', 
      label: '负载均衡', 
      query: 'Load Balancing Nginx HAProxy Algorithms', 
      icon: '⚖️',
      desc: 'Nginx 配置、L4/L7 负载均衡算法与高可用集群搭建'
    },
    { 
      id: 'be-19', 
      label: '分库分表', 
      query: 'Database Sharding Partitioning Strategies', 
      icon: '🍰',
      desc: '水平/垂直拆分、ShardingSphere 中间件与分布式 ID 生成'
    },
    { 
      id: 'be-20', 
      label: '系统可观测性', 
      query: 'Observability Monitoring Logging Tracing Prometheus', 
      icon: '🔭',
      desc: 'Metrics (Prometheus), Logging (ELK), Tracing (Jaeger) 体系'
    }
  ],
  'data': [
    { 
      id: 'ds-1', 
      label: 'Python 数据分析', 
      query: 'Python Data Analysis Pandas NumPy', 
      icon: '🐍',
      desc: 'Pandas 数据处理、NumPy 科学计算与 Jupyter Notebook 技巧'
    },
    { 
      id: 'ds-2', 
      label: '数据可视化', 
      query: 'Data Visualization Matplotlib Seaborn D3.js', 
      icon: '📉',
      desc: '图表叙事：Matplotlib, Seaborn, ECharts 与 D3.js 可视化实战'
    },
    { 
      id: 'ds-3', 
      label: '统计学基础', 
      query: 'Statistics for Data Science Probability Hypothesis Testing', 
      icon: '📐',
      desc: '概率论、假设检验、置信区间与回归分析基础'
    },
    { 
      id: 'ds-4', 
      label: '数据清洗', 
      query: 'Data Cleaning Preprocessing ETL', 
      icon: '🧹',
      desc: '缺失值处理、异常值检测、数据标准化与 ETL 流程'
    },
    { 
      id: 'ds-5', 
      label: 'SQL 高级查询', 
      query: 'Advanced SQL Window Functions CTE Optimization', 
      icon: '💾',
      desc: '窗口函数、CTE 公用表表达式、存储过程与查询性能优化'
    },
    { 
      id: 'ds-6', 
      label: '大数据处理', 
      query: 'Big Data Processing Spark Hadoop MapReduce', 
      icon: '🐘',
      desc: 'Hadoop 生态、Spark 内存计算与 MapReduce 编程模型'
    },
    { 
      id: 'ds-7', 
      label: '数据挖掘', 
      query: 'Data Mining Algorithms Association Rules Clustering', 
      icon: '⛏️',
      desc: '关联规则 (Apriori)、聚类分析 (K-Means) 与分类算法'
    },
    { 
      id: 'ds-8', 
      label: '商业智能 (BI)', 
      query: 'Business Intelligence Tableau PowerBI Analytics', 
      icon: '📊',
      desc: 'Tableau/PowerBI 仪表盘设计、数据建模与商业洞察分析'
    },
    { 
      id: 'ds-9', 
      label: '神经网络数学', 
      query: 'Mathematics for Neural Networks Linear Algebra Calculus', 
      icon: '➗',
      desc: '线性代数（矩阵运算）、微积分（梯度下降）与概率统计'
    },
    { 
      id: 'ds-10', 
      label: 'A/B 测试', 
      query: 'A/B Testing Experiment Design Significance', 
      icon: '🅰️',
      desc: '实验设计、流量分配、统计显著性检验与结果分析'
    },
    { 
      id: 'ds-11', 
      label: '时间序列分析', 
      query: 'Time Series Analysis ARIMA LSTM Forecasting', 
      icon: '⏳',
      desc: 'ARIMA 模型、季节性分解与 LSTM 时间序列预测'
    },
    { 
      id: 'ds-12', 
      label: '贝叶斯统计', 
      query: 'Bayesian Statistics Inference MCMC', 
      icon: '🔔',
      desc: '贝叶斯定理、先验/后验概率与 MCMC 采样方法'
    },
    { 
      id: 'ds-13', 
      label: '决策树与随机森林', 
      query: 'Decision Trees Random Forest Gradient Boosting', 
      icon: '🌳',
      desc: '集成学习：Bagging (随机森林) 与 Boosting (XGBoost/LightGBM)'
    },
    { 
      id: 'ds-14', 
      label: '特征工程', 
      query: 'Feature Engineering Selection Extraction', 
      icon: '🔧',
      desc: '特征选择、降维 (PCA)、特征构造与编码技术'
    },
    { 
      id: 'ds-15', 
      label: '爬虫与采集', 
      query: 'Web Scraping Crawling Scrapy Selenium', 
      icon: '🕷️',
      desc: 'Scrapy 框架、反爬虫对抗、动态网页抓取与数据存储'
    },
    { 
      id: 'ds-16', 
      label: '知识图谱', 
      query: 'Knowledge Graphs Neo4j RDF SPARQL', 
      icon: '🕸️',
      desc: '实体关系抽取、图数据库 (Neo4j) 与知识推理应用'
    },
    { 
      id: 'ds-17', 
      label: '异常检测', 
      query: 'Anomaly Detection Outlier Analysis Fraud Detection', 
      icon: '🚨',
      desc: '孤立森林、One-Class SVM 与欺诈检测应用场景'
    },
    { 
      id: 'ds-18', 
      label: '推荐算法实战', 
      query: 'Recommendation Algorithms Matrix Factorization DeepFM', 
      icon: '🛍️',
      desc: '矩阵分解、DeepFM 模型与召回/排序策略实战'
    },
    { 
      id: 'ds-19', 
      label: '因果推断', 
      query: 'Causal Inference Counterfactuals Do-Calculus', 
      icon: '➡️',
      desc: '相关性 vs 因果性、双重差分 (DID) 与因果图模型'
    },
    { 
      id: 'ds-20', 
      label: '数据隐私', 
      query: 'Data Privacy Differential Privacy Federated Learning', 
      icon: '🔒',
      desc: '差分隐私、联邦学习与数据脱敏技术'
    }
  ],
  'security': [
    { 
      id: 'sec-1', 
      label: 'Web 渗透测试', 
      query: 'Web Penetration Testing OWASP Top 10', 
      icon: '🕵️',
      desc: 'OWASP Top 10 漏洞原理、SQL 注入、XSS 与渗透工具使用'
    },
    { 
      id: 'sec-2', 
      label: '网络协议安全', 
      query: 'Network Protocol Security TCP/IP DNS HTTPs', 
      icon: '🌐',
      desc: 'TCP/IP 协议栈漏洞、DNS 劫持、ARP 欺骗与 HTTPS 加密机制'
    },
    { 
      id: 'sec-3', 
      label: '密码学基础', 
      query: 'Cryptography Encryption Hashing RSA AES', 
      icon: '🔑',
      desc: '对称/非对称加密 (AES/RSA)、哈希算法与数字签名'
    },
    { 
      id: 'sec-4', 
      label: '逆向工程', 
      query: 'Reverse Engineering Assembly Debugging IDA Pro', 
      icon: '🔙',
      desc: '汇编语言基础、IDA Pro/OllyDbg 调试与软件脱壳技术'
    },
    { 
      id: 'sec-5', 
      label: '恶意代码分析', 
      query: 'Malware Analysis Static Dynamic Analysis Sandbox', 
      icon: '🦠',
      desc: '静态/动态分析、沙箱环境搭建与病毒木马行为分析'
    },
    { 
      id: 'sec-6', 
      label: '零信任架构', 
      query: 'Zero Trust Architecture Security Model', 
      icon: '🚫',
      desc: '“永不信任，始终验证”原则、微隔离与身份导向安全'
    },
    { 
      id: 'sec-7', 
      label: '云安全', 
      query: 'Cloud Security AWS Azure GCP Security', 
      icon: '☁️',
      desc: '云原生安全、责任共担模型、容器安全与 IAM 策略'
    },
    { 
      id: 'sec-8', 
      label: '移动应用安全', 
      query: 'Mobile App Security Android iOS Pentesting', 
      icon: '📱',
      desc: 'Android/iOS 客户端漏洞挖掘、App 加固与隐私合规检测'
    },
    { 
      id: 'sec-9', 
      label: '身份认证技术', 
      query: 'Identity Authentication MFA Biometrics', 
      icon: '🆔',
      desc: '多因素认证 (MFA)、生物识别、FIDO 协议与单点登录'
    },
    { 
      id: 'sec-10', 
      label: '漏洞挖掘', 
      query: 'Vulnerability Research Fuzzing Exploit Development', 
      icon: '🐛',
      desc: 'Fuzzing 测试技术、Exploit 编写与 CVE 漏洞复现'
    },
    { 
      id: 'sec-11', 
      label: '社会工程学', 
      query: 'Social Engineering Phishing OSINT', 
      icon: '🎭',
      desc: '钓鱼攻击、开源情报收集 (OSINT) 与人员安全意识培训'
    },
    { 
      id: 'sec-12', 
      label: '应急响应 (IR)', 
      query: 'Incident Response Forensics Handling', 
      icon: '🚑',
      desc: '安全事件处置流程、数字取证、溯源分析与日志审计'
    },
    { 
      id: 'sec-13', 
      label: '操作系统安全', 
      query: 'Operating System Security Linux Windows Hardening', 
      icon: '💻',
      desc: 'Linux/Windows 系统加固、权限管理与内核安全机制'
    },
    { 
      id: 'sec-14', 
      label: '物联网 (IoT) 安全', 
      query: 'IoT Security Firmware Analysis Hardware Hacking', 
      icon: '📡',
      desc: '固件提取与分析、硬件接口调试 (UART/JTAG) 与无线电安全'
    },
    { 
      id: 'sec-15', 
      label: '区块链安全', 
      query: 'Blockchain Security Smart Contract Auditing', 
      icon: '⛓️',
      desc: '智能合约漏洞审计、DeFi 攻击向量与私钥安全管理'
    },
    { 
      id: 'sec-16', 
      label: '数据防泄露 (DLP)', 
      query: 'Data Loss Prevention DLP Strategies', 
      icon: '🗄️',
      desc: '敏感数据识别、数据流转监控与终端/网络 DLP 部署'
    },
    { 
      id: 'sec-17', 
      label: '防火墙与 IDS/IPS', 
      query: 'Firewalls IDS IPS Network Security', 
      icon: '🧱',
      desc: '下一代防火墙 (NGFW)、入侵检测/防御系统规则配置'
    },
    { 
      id: 'sec-18', 
      label: 'DDOS 防御', 
      query: 'DDoS Mitigation Traffic Analysis', 
      icon: '🌊',
      desc: '流量清洗、CDN 防护、反射放大攻击原理与防御'
    },
    { 
      id: 'sec-19', 
      label: '安全合规', 
      query: 'Security Compliance GDPR ISO27001', 
      icon: '📜',
      desc: 'GDPR, 等级保护, ISO27001 标准解读与合规建设'
    },
    { 
      id: 'sec-20', 
      label: 'DevSecOps', 
      query: 'DevSecOps CI/CD Security Automation', 
      icon: '♾️',
      desc: '安全左移、CI/CD 管道中的安全扫描 (SAST/DAST) 集成'
    }
  ],
  'design_product': [
    { 
      id: 'dp-1', 
      label: '用户体验设计 (UX)', 
      query: 'User Experience Design UX Principles Research', 
      icon: '🧠',
      desc: '以用户为中心的设计流程、用户画像、体验地图与可用性测试'
    },
    { 
      id: 'dp-2', 
      label: '用户界面设计 (UI)', 
      query: 'User Interface Design UI Principles Color Typography', 
      icon: '🎨',
      desc: '视觉层级、色彩理论、排版规范与界面美学基础'
    },
    { 
      id: 'dp-3', 
      label: '产品思维', 
      query: 'Product Thinking Problem Solving MVP', 
      icon: '💡',
      desc: '发现问题、定义需求、MVP 验证与产品市场契合度 (PMF)'
    },
    { 
      id: 'dp-4', 
      label: '交互设计 (IxD)', 
      query: 'Interaction Design Microinteractions Usability', 
      icon: '👆',
      desc: '人机交互原理、微交互设计、信息架构与操作流程优化'
    },
    { 
      id: 'dp-5', 
      label: '设计系统', 
      query: 'Design Systems Atomic Design Components', 
      icon: '🧩',
      desc: '原子设计理论、组件库构建、设计规范与 Design Token 管理'
    },
    { 
      id: 'dp-6', 
      label: '敏捷开发与 Scrum', 
      query: 'Agile Methodology Scrum Kanban Product Management', 
      icon: '🔄',
      desc: '敏捷宣言、Scrum 流程、看板管理与迭代开发模式'
    },
    { 
      id: 'dp-7', 
      label: '需求分析与管理', 
      query: 'Product Requirements Analysis PRD User Stories', 
      icon: '📝',
      desc: '用户故事 (User Stories)、PRD 撰写、需求优先级排序 (MoSCoW)'
    },
    { 
      id: 'dp-8', 
      label: '数据驱动设计', 
      query: 'Data Driven Design A/B Testing Metrics', 
      icon: '📊',
      desc: '设计埋点、A/B 测试、漏斗分析与数据决策方法论'
    },
    { 
      id: 'dp-9', 
      label: '增长黑客', 
      query: 'Growth Hacking AARRR Funnel Retention', 
      icon: '🚀',
      desc: 'AARRR 模型、北极星指标、用户获客与留存增长策略'
    },
    { 
      id: 'dp-10', 
      label: '竞品分析', 
      query: 'Competitive Analysis SWOT Product Strategy', 
      icon: '🆚',
      desc: 'SWOT 分析、竞品调研方法、差异化定位与市场机会洞察'
    },
    { 
      id: 'dp-11', 
      label: '原型设计', 
      query: 'Prototyping Wireframing Figma Axure', 
      icon: '📐',
      desc: '低保真/高保真原型绘制、Figma/Axure 工具使用与交互演示'
    },
    { 
      id: 'dp-12', 
      label: '用户研究', 
      query: 'User Research Methods Interviews Surveys', 
      icon: '🔍',
      desc: '定性/定量研究、用户访谈、问卷调查与同理心构建'
    },
    { 
      id: 'dp-13', 
      label: '服务设计', 
      query: 'Service Design Blueprints Customer Journey', 
      icon: '🛎️',
      desc: '服务蓝图、触点管理、全渠道体验与系统化设计思维'
    },
    { 
      id: 'dp-14', 
      label: '商业模式画布', 
      query: 'Business Model Canvas Value Proposition', 
      icon: '💼',
      desc: '价值主张、客户细分、收入流与商业模式创新设计'
    },
    { 
      id: 'dp-15', 
      label: 'B端产品设计', 
      query: 'B2B Product Design SaaS Workflow', 
      icon: '🏢',
      desc: 'SaaS 产品架构、复杂业务流程梳理、权限管理与效率工具设计'
    },
    { 
      id: 'dp-16', 
      label: 'C端产品设计', 
      query: 'B2C Product Design User Engagement Gamification', 
      icon: '📱',
      desc: '用户增长、游戏化机制、社交裂变与沉浸式体验设计'
    },
    { 
      id: 'dp-17', 
      label: '移动端设计规范', 
      query: 'Mobile Design Guidelines iOS Human Interface Material Design', 
      icon: '📲',
      desc: 'iOS Human Interface Guidelines 与 Google Material Design 解析'
    },
    { 
      id: 'dp-18', 
      label: '品牌设计基础', 
      query: 'Brand Design Identity Logo VI', 
      icon: '🏷️',
      desc: '品牌识别 (VI)、Logo 设计、品牌故事与情感化设计'
    },
    { 
      id: 'dp-19', 
      label: 'AIGC 辅助设计', 
      query: 'AI in Design Midjourney Stable Diffusion Tools', 
      icon: '🤖',
      desc: 'Midjourney/Stable Diffusion 绘图、AI 生成素材与设计提效'
    },
    { 
      id: 'dp-20', 
      label: '无障碍设计 (Inclusive)', 
      query: 'Inclusive Design Accessibility WCAG', 
      icon: '♿',
      desc: '包容性设计原则、WCAG 标准与特殊群体体验优化'
    }
  ]
};
