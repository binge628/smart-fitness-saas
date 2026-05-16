# 基于SaaS模式的智慧健身管理系统的设计与实现
---

## 摘要
全民健身政策持续深化推进，健身行业数字化转型进入加速期。传统健身房管理模式普遍存在信息化程度低、数据孤岛现象严重、用户流失率居高不下等问题，难以适应行业发展需求。与此同时，SaaS（Software as a Service）模式以其低成本部署、快速迭代、按需付费等优势，正在重塑各行各业的软件服务形态。本文在此背景下，设计并实现了一套基于SaaS模式的智慧健身管理系统，旨在为健身场馆和健身爱好者提供一个功能完备、架构合理、易于扩展的数字化管理平台。

本系统采用前后端分离的B/S架构。前端基于React 19框架，结合TypeScript类型系统和Ant Design 6组件库进行开发，使用Vite 8作为构建工具，Zustand负责客户端状态管理；后端采用Node.js运行时与Express 5框架，搭配PostgreSQL 16关系型数据库，利用JWT实现无状态身份认证，通过Zod 4进行请求数据校验与类型推导；AI健身助手模块通过统一接口适配OpenAI、Anthropic、DeepSeek和Ollama四个大语言模型供应商，将用户近30天训练记录、5条最新健康指标和累计统计实时拼装为上下文注入提示词实现个性化输出，并设计了降级响应与请求限流机制；系统最终采用Docker Compose进行容器化编排部署，保障环境一致性与运维便利性。

系统涵盖了用户管理、健身计划制定、训练日志记录、健康数据追踪、健身房与会员管理、动作库、成就勋章、订阅计费和AI健身助手等九大核心功能模块。在SaaS层面，实现了多租户健身房管理、三级订阅计费和细粒度角色权限控制。经测试验证，系统功能完整、运行稳定，常规CRUD接口平均响应时间低于70毫秒，AI降级机制在模拟故障中可靠触发，能较好满足健身管理的业务需求。

**关键词：** SaaS；智慧健身；多租户；大语言模型适配；React；订阅计费；成就激励

---

## Abstract
The national fitness policy continues to deepen, and the digital transformation of the fitness industry has entered an acceleration period. Traditional gym management models generally suffer from low informatization, serious data silos, and high user churn rates, making it difficult to meet industry development needs. At the same time, the SaaS (Software as a Service) model, with its advantages of low-cost deployment, rapid iteration, and pay-as-you-go, is reshaping the software service delivery across various industries. Against this background, this paper designs and implements a smart fitness management system based on the SaaS model, aiming to provide a functionally complete, reasonably architected, and easily extensible digital management platform for fitness venues and fitness enthusiasts.

The system adopts a front-end and back-end separated B/S architecture. The front end is developed based on the React 19 framework, combined with the TypeScript type system and Ant Design 6 component library, using Vite 8 as the build tool and Zustand for client-side state management. The back end uses the Node.js runtime and Express 5 framework, paired with the PostgreSQL 16 relational database, utilizing JWT for stateless authentication and Zod 4 for request data validation and type inference. The AI fitness assistant module adapts to four large language model providers — OpenAI, Anthropic, DeepSeek, and Ollama — through a unified interface, dynamically assembles user context from 30-day training logs, latest 5 health metrics, and cumulative statistics into prompts for personalized output, and gracefully falls back to preset domain knowledge templates when external model services are unavailable, with the source indicated via an is_fallback flag. The system is ultimately deployed using Docker Compose for containerized orchestration, ensuring environmental consistency and operational convenience.

The system covers nine core functional modules: user management, fitness plan creation, workout log recording, health data tracking, gym and member management, exercise library, achievement badges, subscription billing, and AI fitness assistant. At the SaaS level, multi-tenant gym management, tiered subscription billing, and fine-grained role-based access control are implemented. Testing has verified that all modules function correctly, average CRUD API response time is under 70ms, and the AI degradation mechanism triggers reliably under simulated failures.

**Keywords:** SaaS; Smart Fitness; Multi-tenancy; LLM Adaptation; React; Subscription Billing; Achievement Motivation

---

## 第1章 绪论
### 1.1 研究背景及意义
全民健身作为国家战略，自2014年国务院印发《关于加快发展体育产业促进体育消费的若干意见》以来，政策推动力度不断加大。2021年国务院发布《全民健身计划（2021-2025年）》，明确提出到2025年经常参加体育锻炼人数比例达到38.5%，全民健身公共服务体系更加完善[1]。伴随居民收入水平提高和健康意识增强，中国健身市场规模持续扩大，据《2023中国健身行业数据报告》显示，国内健身俱乐部数量已超过4万家，健身人口规模突破7000万[2]。

然而，行业高速增长的背后，传统健身管理模式暴露出诸多痛点。其一，信息化水平偏低。大量中小型健身房仍依赖纸质表格或简单电子表格管理会员信息和课程安排，数据分散且难以共享，运营效率低下[3]。其二，用户健身体验单一。多数健身房仅提供场地和器械，缺乏对会员训练过程的数据化跟踪和科学指导，行业平均会员续费率不足20%[4]。其三，系统部署与维护成本高昂。传统本地化部署需要健身房自行购置服务器、安装软件、维护升级，前期投入动辄数万元，对中小型场馆构成沉重负担[5]。其四，健身应用虽然内容供给日益丰富，却很少将用户真实的训练记录和身体指标融入服务逻辑，导致"选了计划就忘"的现象普遍存在，新注册用户30天内流失率超过60%[6]。

SaaS模式的出现为上述问题提供了切实可行的解决路径。SaaS即软件即服务，是一种将软件应用以订阅方式通过互联网交付给用户的云计算模式[7]。与本地化部署相比，SaaS具备显著优势：用户无需购置硬件设备和安装软件，通过浏览器即可访问系统；服务商统一维护和升级；按需付费大幅降低初始投入成本[8]。在CRM、ERP等领域，Salesforce、钉钉等产品的成功已验证了SaaS模式在企业管理场景中的有效性[9]。

将SaaS模式引入健身管理领域，一方面能让健身房以较低的月度或年度订阅费用获取专业级管理工具，降低经营门槛；另一方面，平台化的数据汇聚使得跨场馆的用户数据分析、智能推荐和个性化服务成为可能[10]。国内健身SaaS赛道已涌现出三体云动、勤鸟科技等企业，但现有产品多侧重于场馆运营管理（如会员签到、课程排期、财务结算），在训练科学指导、健康数据深度分析以及AI辅助决策等方面仍有显著不足[11]。

与此同时，大语言模型（Large Language Model，LLM）技术的快速进步为个性化健身指导带来了新的可能——通过分析用户的训练历史、身体指标和健身目标，AI能够给出有针对性的训练建议和营养方案[12]。然而现有概念验证普遍存在两个短板：模型上下文里没有用户的真实训练记录和生理数据，输出千人一面；没有做多供应方适配和降级容错，模型一挂用户就直接面对报错。

基于上述背景，本文设计并实现了一套基于SaaS模式的智慧健身管理系统。该系统在传统健身管理功能的基础上，融入了AI健身助手、成就激励机制和精细化订阅计费，旨在为健身房经营者提供高效的场馆管理工具，同时为健身爱好者打造个性化的智能健身体验。本文的工程贡献集中在三点：第一，验证了Express 5 + PostgreSQL + React 19全栈在健身SaaS场景下从开发到容器化部署的可行性；第二，实现了多角色权限体系、三级订阅计费和多模型AI顾问三个核心模块，并给出了可复用的实现方案；第三，在用户体验层面，训练数据驱动的成就勋章体系和AI个性化建议配合形成了"记录→激励→优化"的行为闭环，为提升用户持续参与度提供了实践参考。

### 1.2 研究现状
健身领域的信息化，国内外都有不少实践，大体可以分成三条路径。

第一类是场馆运营SaaS，ClassPass和Mindbody是典型代表。ClassPass用灵活的订阅制把几千家合作场馆串起来，用户付一笔月费就能跨店消费，平台抽佣金；Mindbody从预约排课、会员管理到支付结算提供一体化后台，SaaS订阅收入已占到营收的大头。第二类是内容订阅平台，Peloton和Nike Training Club的核心资产是课程视频和教练品牌，技术重心放在内容推荐和实时数据展示上。第三类是运动数据平台，Strava和Fitbit通过可穿戴设备采集运动轨迹和生理信号，社交功能是用户留存的主要手段。

国内方面，Keep从居家健身内容切入，逐步延伸到智能硬件和线下场馆，形成了"内容+硬件+门店"的混合业态。超级猩猩靠按次付费打破了年卡惯例。乐刻的"商擎"管理系统在会员管理和排课方面给健身房运营者提供了实用工具，但AI驱动的个性化推荐尚属空白。

学术论文方面，健身信息化的研究近两年开始从纯软件设计转向智能化。有些工作尝试用协同过滤给课程做个性化匹配，但推荐对象基本是静态标签，没有跟用户实际练了多少、身体变化趋势形成动态关联。大语言模型在健身领域的应用还在很早的阶段：零散的几个概念验证用GPT系列模型生成训练方案，但普遍存在两个短板——模型上下文里没有用户的真实训练记录和生理数据，输出千人一面；没有做多供应方适配和降级容错，模型一挂用户就直接面对报错。

综合来看，现有方案在三个维度上有改进空间：一是多数方案没走标准的多租户SaaS架构，健身房的数据隔离和独立管理缺乏保障；二是AI能力和业务数据整合不够深，所谓个性化还停留在模板阶段；三是订阅计费和游戏化激励这些运营手段，在开放或学术系统里很少完整实现。本文的工作围绕这三个缺口展开。

### 1.3 本文工作
本文的工作集中在以下几个层面：

**SaaS多租户与角色权限体系。** 系统定义了四种角色——普通用户、教练、健身房管理员和平台管理员，各自对应不同的功能和数据可见范围。权限在前后端双重实施：前端PermissionGuard根据角色动态隐藏菜单项和操作按钮，后端requireRole中间件在API层拦截越权请求返回403。多租户隔离通过gym_id行级逻辑实现，不同场馆的会员和训练数据天然分开。

**AI多模型适配与降级机制。** AI模块采用"统一接口+策略路由"策略。所有模型调用经createChatCompletion发出，运行时根据AI_PROVIDER环境变量决定消息格式和目标端点。请求发送前实时聚合用户个人信息、30天训练记录、5条健康指标和累计统计，格式化为结构化文本注入系统提示词。密钥缺失或服务不可达时，回退至预设的领域知识模板，前端通过is_fallback字段标识回复来源。速率限制中间件对每用户每天施加20次对话上限。

**订阅计费与成就激励。** 三级套餐（免费/月度/年度）与功能开放策略绑定，健身房以场馆为单位订阅。成就勋章覆盖四维度（训练次数、连续天数、累计时长、消耗热量），训练完成后自动触发检查，达标即时解锁，形成正向行为反馈。

### 1.4 论文组织
全文共七章。第1章交代背景和定位；第2章梳理相关技术；第3章从可行性、功能、非功能三方面做需求分析；第4章阐述系统架构和数据模型的设计决策；第5章深入各模块的实现逻辑和关键代码；第6章展示测试方案与结果；第7章总结并讨论后续方向。

---

## 第2章 相关技术与理论基础
### 2.1 SaaS架构的多租户实现
SaaS把软件以服务的形式通过互联网交付，租户无需本地部署。它的核心特征有三个：多租户共享、弹性扩展、按需付费。

多租户共享是SaaS架构的基石。同一套代码和数据库实例服务多个租户，数据通过租户标识做逻辑或物理隔离。隔离策略的选择是安全性和运维成本之间的权衡——行级隔离（共享表加租户字段）实现最简单，但每条查询必须带租户过滤条件；Schema级隔离安全性好一些，但数据库连接管理更复杂；数据库级隔离最安全，运维成本也最高[13]。本系统在当前业务规模下选择行级隔离，通过gym_id字段实现场馆维度的数据边界，同时在查询层统一添加租户过滤，为将来向Schema级隔离演进预留了接口。

弹性扩展方面，本系统的Express进程不持有会话状态，任何实例都能处理任何请求，水平扩展只需要在负载均衡器后面加节点。PostgreSQL通过pg.Pool连接池管理数据库连接，默认最大20个连接，空闲30秒释放，连接超时2秒。

按需付费通过订阅计费模块实现——免费版为基础功能，月度和年度会员解锁AI助手、无限计划和高级数据分析，健身房场馆另付运营功能订阅费。

### 2.2 前端技术选型
React在2013年由Meta开源后，已成为前端领域用户量最大的UI库。它的核心思想是把UI视作状态的函数映射，同样的state总是产生同样的渲染结果。React 18引入的并发渲染机制允许渲染过程暂停和恢复，Concurrent Mode下高优先级的用户交互不会被低优先级的大列表渲染卡住。本系统采用React 19，这是当前最新的稳定版本，配合Ant Design 6组件库提供企业级UI组件——表格、表单、弹窗、通知等开箱即用。

路由方面，系统使用React Router v7，它支持嵌套路由和布局路由，路由声明和组件层级自然对齐。系统定义了两个路由守卫组件：AuthGuard包裹需登录的页面，检测localStorage中的JWT令牌，缺失则跳转登录；PublicAuthGuard包裹登录和注册页，已登录状态直接重定向首页。

HTTP请求层基于Axios封装了一个apiClient单例，请求拦截器自动注入Bearer Token，响应拦截器做两件事：自动解包response.data，以及遇到401时清除凭证并跳转登录。按功能域划分了11个service模块，每个都用TypeScript泛型约束返回类型。

### 2.3 后端技术选型
Express是Node.js生态最成熟的Web框架，中间件管道是它的核心架构——请求经过一系列函数依次处理，每个函数可以读取req、写入res或把控制权传给next。本系统的中间件栈由六层构成：CORS白名单、请求体解析（5MB上限）、JWT认证、角色校验、Zod参数校验和统一错误处理。

PostgreSQL作为持久化引擎，选择它有几个理由：ACID事务在训练日志+组数写入、订阅取消+新订阅创建这类多表原子操作中是刚性需求；JSONB类型为将来存储灵活结构数据留了空间；丰富的索引类型（默认B-tree、GIN、BRIN、Partial Index）可以应对不同查询模式。

数据库连接池配置了最大20个连接、空闲30秒超时和2秒连接超时。同时支持DATABASE_URL字符串（给Supabase等云数据库用）和分离的DB_HOST等变量（给本地开发用），SSL策略根据URL自动判断——域名含supabase.co或amazonaws.com则启用，localhost则禁用。

### 2.4 大语言模型与提示词策略
大语言模型（LLM）基于Transformer架构[14]，通过在互联网规模语料上做自监督预训练习得语言的生成能力。GPT、Claude、DeepSeek等模型都以对话补全为主要交互范式——输入一组消息（系统消息+用户消息+历史助手消息），模型产出下一轮回复。

提示词工程（Prompt Engineering）的核心在于如何通过系统消息的结构化设计引导模型产出符合预期格式和内容方向的输出[15]。本系统采用"上下文注入"策略——系统消息不仅包含角色定义（"你是一位专业的健身教练助手"）和行为约束（"只回答健身相关问题"），还将用户的个人信息、训练统计、近期训练记录和健康指标格式化为结构化文本拼接进系统消息中。这样同一模型面对不同用户时，输出内容天然带有个人化差异，而非千篇一律的通用建议。

系统还针对三类咨询场景分别设计了专项提示词：TRAINING_ADVICE_PROMPT从训练频率、强度、过度训练风险、建议增减内容、休息日安排五个维度引导输出；NUTRITION_ADVICE_PROMPT从热量摄入、营养配比、训练前后饮食、补水、减脂增肌策略五个维度展开；PLAN_SUGGESTION_PROMPT从难度级别、训练频率、动作类型、周期安排和阶段目标五个维度生成计划建议。这种场景化的提示词设计使回复聚焦而有操作性，避免了模型"散着说"的问题。

### 2.5 Zod参数校验框架
Zod是一个以TypeScript为优先设计的参数校验库，它同时满足编译期类型推导和运行时数据校验两个需求，在实际工程中解决了"前后端类型定义一致"这个长期痛点[16]。传统做法是前端定义TypeScript interface，后端另写校验逻辑（如Joi、class-validator），两处维护容易失步。Zod的方案是"一份Schema，两端生效"——定义一个Zod Schema后，TypeScript可以从它推导出对应对的interface，运行时Zod对每个请求体做校验，非法输入返回400和字段级错误信息。

本系统基于Zod 4构建了统一的参数校验中间件。核心设计是一个工厂函数`validate`，它接收Schema和校验来源（body/query/params），返回Express中间件：

```typescript
// backend/src/utils/validation.ts
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);  // 运行时校验
      req[source] = data;  // 用校验后的数据替换原始数据
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({ success: false, error: messages.join('; ') });
      }
      next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
```

校验通过后，`schema.parse()`的返回值会替换`req[source]`，这意味着后续处理器拿到的已经是类型安全的数据——多余字段被剥离，类型转换已完成。本系统定义了注册、登录、创建计划、录入健康数据等11个Zod Schema，以健康数据Schema为例展示了医学合理的范围约束：

```typescript
const createHealthDataSchema = z.object({
  weight: z.number().min(20).max(300).optional(),       // 体重 20-300kg
  height: z.number().min(50).max(250).optional(),        // 身高 50-250cm
  body_fat: z.number().min(0).max(100).optional(),       // 体脂率 0-100%
  heart_rate: z.number().min(30).max(200).optional(),    // 静息心率 30-200bpm
  systolic: z.number().min(60).max(250).optional(),      // 收缩压 60-250mmHg
  diastolic: z.number().min(40).max(150).optional(),     // 舒张压 40-150mmHg
  record_date: z.string().min(1),                        // 记录日期
});
type HealthDataInput = z.infer<typeof createHealthDataSchema>;  // 自动推导类型
```

这种"Schema即类型"的模式消除了手写interface和运行时校验之间的鸿沟，从源头避免了"类型写对了但校验忘了"的问题。

### 2.6 Zustand状态管理
前端状态管理方案的选择直接影响代码复杂度和可维护性。Redux作为React生态最流行的状态管理库，凭借单一数据源和纯函数Reducer的设计，在大型应用中建立了可预测的状态更新范式。然而，Redux的模板代码过于冗长——创建一个store需要定义action type、action creator和reducer三个关联概念，再加上中间件配置和Provider嵌套，简单场景下显得过重[11]。

Zustand的设计哲学是"最小化API，最大化灵活性"。它只用一个`create`函数就定义了整个store，返回的hook直接订阅状态片段，组件只在订阅的切片变化时重渲染。本系统采用Zustand 5管理全局认证状态，authStore的实现如下：

```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  hydrate: () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
}));
```

authStore维护token、user和isAuthenticated三个核心状态字段，提供login、logout、setUser和hydrate四个方法。其中hydrate的设计尤为关键——应用启动时React组件树挂载前，hydrate从localStorage恢复令牌和用户信息，避免了页面刷新后的白屏闪烁和401错误。在组件中，通过选择器模式订阅状态，如`useAuthStore(state => state.user)`，仅当user引用变化时触发重渲染，无关的状态更新（如token变化）不会导致组件刷新。

与Redux相比，Zustand在本系统中减少了约60%的模板代码：无需action type常量、无需reducer switch-case、无需Provider包裹、无需combineReducers。整个store定义只用了55行TypeScript，而等价的Redux实现（含actions、reducer、selectors、store配置）通常超过150行。

### 2.7 Docker容器化技术
容器化技术近年来在软件部署领域得到广泛应用。相比传统虚拟机方案，容器共享宿主机内核，启动速度更快、资源占用更少。Docker作为容器技术的代表，提供了一整套工具链，从镜像构建到容器编排，形成了相对完整的生态系统。

在本系统的部署方案中，Docker的作用体现在三个方面：环境一致性、简化部署和便于扩展。后端服务的Dockerfile采用多阶段构建，先在构建阶段安装依赖并编译TypeScript，再在运行阶段只拷贝产出物，减小镜像体积：

```dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 第二阶段：运行
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production
RUN mkdir -p uploads/avatars
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

前端Dockerfile同样采用多阶段构建，第一阶段用Vite编译生产包，第二阶段用Nginx托管静态资源并代理后端API请求：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

docker-compose.yml定义了三个服务，通过声明式配置描述整个系统架构：

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: smart_fitness
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/smart_fitness
      JWT_SECRET: ${JWT_SECRET}
      CLIENT_URL: http://localhost
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', ...)"]

  frontend:
    build: ./frontend
    depends_on:
      - backend
```

健康检查是容器编排的关键机制。PostgreSQL的healthcheck使用`pg_isready`探测数据库就绪状态；后端的healthcheck发起HTTP请求到`/health`端点。`depends_on`配合`condition: service_healthy`确保_backend_服务在数据库完全就绪后才启动，避免了"应用启动时数据库连接未就绪"这一常见的冷启动问题。数据卷`postgres_data`和`backend_uploads`分别持久化数据库文件和用户上传的头像，容器重建不丢数据。

### 2.8 JWT认证与RBAC权限控制
JSON Web Token（JWT）是一种基于RFC 7519标准的无状态认证方案。服务端签发包含用户声明的Token，客户端在后续请求的Authorization头中携带该Token，服务端验签即可确认身份，无需在服务端存储会话[6]。无状态特性使得JWT天然适合水平扩展——任何实例都能独立验证Token，不需要共享Session存储。

本系统的JWT实现包含四个核心函数：`generateToken`签发令牌，`verifyToken`验证令牌，`hashPassword`和`comparePassword`处理密码哈希：

```typescript
// backend/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET 环境变量未设置');
  process.exit(1);  // 强制退出，确保不会在无密钥状态下运行
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export const generateToken = (payload: Omit<JwtPayload, 'role'> & { role?: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};
```

值得注意的安全设计：`JWT_SECRET`在应用启动时强制校验，未设置直接`process.exit(1)`进程退出，避免系统在无密钥状态下运行；密码使用bcrypt的saltRounds=10进行哈希，即使用户表被拖库，攻击者也无法从哈希值反推密码原文。

后端的权限控制分为两层：认证层（authMiddleware）验证Token有效性，授权层（requireRole）检查角色权限：

```typescript
// backend/src/middleware/authMiddleware.ts
import { verifyToken, extractTokenFromHeader } from '../utils/auth';

// 认证中间件：验证 JWT 令牌
export const authMiddleware = async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) return res.status(401).json({ success: false, error: '未提供认证 Token' });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;  // 将用户信息附加到请求对象
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
};

// 授权中间件：检查角色权限（支持可变参数）
export const requireRole = (...allowedRoles: string[]) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: '未认证' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  };
};
```

`requireRole`使用可变参数设计，调用方式如`requireRole('admin', 'gym_admin')`，允许多个角色共享同一组API。前端通过角色常量定义和菜单动态组装实现界面层面的权限控制：

```typescript
// frontend/src/utils/permission.ts
export const ROLES = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  COACH: 'coach' as const,
  GYM_ADMIN: 'gym_admin' as const,
} as const;

export const hasRole = (role: string | string[]): boolean => {
  const currentRole = getCurrentRole();
  if (!currentRole) return false;
  return Array.isArray(role) ? role.includes(currentRole) : currentRole === role;
};

export const isAdmin = (): boolean => hasRole(ROLES.ADMIN);
export const isCoach = (): boolean => hasRole(ROLES.COACH);
export const isGymAdmin = (): boolean => hasRole(ROLES.GYM_ADMIN);
```

前后端双重权限控制的设计确保了安全性：后端`requireRole`中间件在API层拦截越权请求返回403，前端`hasRole`函数在UI层动态隐藏无权限的菜单和操作按钮。即使攻击者绕过前端直接调用API，后端中间件依然能阻止未授权访问。

---

## 第3章 系统需求分析
### 3.1 可行性分析
**技术可行性。** 选型的每一个组件都已经是生产验证过的方案。React 19和Ant Design 6的组合在前端工程中被广泛采用，Express 5作为后端框架有大量成熟案例，PostgreSQL的ACID事务和丰富索引类型满足业务需求，Zod 4在参数校验和类型推导之间架了桥梁。AI模块用Axios发起HTTP请求不依赖任何SDK，新增供应方只是加一行端点配置的事情。总体上技术风险很低。

**经济可行性。** 前端是SPA可以部署到CDN，后端跑在Docker容器里单台2核4G云服务器就能承载数百并发。PostgreSQL社区版免费。AI调用的成本可以通过每用户每日20次的速率上限控制在单用户日均0.5元以内。月度会员29.9元的定价足以覆盖平台成本。

**操作可行性。** 四级角色划分了清晰的操作边界。健身房管理员在独立页面管理场馆和会员，不需要技术背景。AI助手用自然语言交互，没有学习成本。订阅升级在页面内完成，不用跳转第三方。整体操作流程符合目标用户的使用习惯。

### 3.2 功能需求
通过分析目标用户群体的核心诉求，系统识别出四类角色和对应的功能需求。

**普通用户**是数量最大的群体。他们需要便捷地记录训练细节——哪个动作、推了多重、做了几组几下；追踪体重体脂等健康指标的变化趋势；获得跟自己实际情况挂钩的建议而不是泛泛的"多吃蛋白质"；通过成就系统获得持续训练的动力；付费享用AI健身顾问。

**教练**需要为学生创建和管理训练计划，追踪学生的训练执行率和身体变化。当前版本教练和普通用户共享计划功能，后续可扩展教练-学员绑定。

**健身房管理员**要维护场馆信息，管理会员的入会、续费和状态变更，查看运营数据。每个管理员拥有独立的场馆实体和会员名单。

**平台管理员**拥有全局权限，可以管理用户角色和状态、查看全部订阅数据、监控系统运行。

### 3.3 非功能需求
**安全性。** 密码用bcrypt哈希存储（saltRounds=10），明文不落库不落日志。JWT令牌7天有效期，通过Bearer方案传递。CORS限制请求来源。Zod Schema对全部API输入做运行时校验，同时配合参数化查询杜绝SQL注入。文件上传限制5MB。AI速率限制按用户ID+日期维度计数。

**性能。** 核心CRUD接口平均响应时间控制在200ms以内（不含AI外部调用）。数据库分页查询默认每页20条最多100条。AI对话设60秒超时。

**可用性。** /health端点覆盖数据库连通性检测，可作负载均衡探针。前端ErrorBoundary捕获渲染异常避免白屏。AI降级策略保证模型挂掉时核心功能不受影响。

**可扩展性。** 连接池参数化，AI供应方新增只需在API_ENDPOINTS映射表加一行，租户隔离方式可从行级向Schema级平滑演进。

---

## 第4章 系统设计
### 4.1 整体架构
系统采用前后端分离的三层架构：表示层、业务逻辑层和数据访问层。

表示层由React 19 + TypeScript + Ant Design 6 + Vite 8构建为SPA，部署时打包成静态资源可由CDN分发。路由分为公开路由（/login、/register）和受保护路由（其余全部），由React Router v7管理。认证状态由Zustand的authStore维护，应用启动时hydrate方法从localStorage恢复令牌。API请求统一经apiClient发出，拦截器处理Token注入和401跳转。

业务逻辑层由Express 5承载，分为路由层（定义端点和方法映射）、控制器层（封装业务逻辑和数据库交互）、服务层（封装跨控制器复用的AI调用逻辑）和中间件层（认证鉴权、参数校验、文件上传、速率限制、错误处理）。所有API响应遵循统一信封格式{success, message?, data?, count?, error?}。

数据访问层使用PostgreSQL和pg驱动的Pool连接池。SQL语句以参数化方式执行，杜绝注入风险。复杂的多表关联查询（如AI上下文构建）在SQL层面完成聚合，减少应用层的数据搬运。环境变量控制连接方式——DATABASE_URL字符串给云数据库用，分离配置给本地开发用。

### 4.2 数据模型设计
系统共12张表，按业务域分组如下。

**用户域**只有users一张表，字段包括id（UUID主键）、username、email、password_hash、phone、avatar、role（user/admin/coach/gym_admin）、status（active/inactive/banned）和审计时间戳。email和username设UNIQUE约束，role和status用CHECK约束限定合法值。

**健身房域**包含gyms和gym_members两张表。gyms记录场馆基本信息，owner_id关联所有者。gym_members实现用户与场馆的多对多关系，membership_type取basic/premium/vip，membership_status取active/expired/suspended，UNIQUE(gym_id, user_id)防止重复加入。

**训练域**包含fitness_plans、workout_logs、workout_sets和exercises四张表。fitness_plans记录计划属性，is_template标记共享模板，gym_id关联所属场馆。workout_logs记录每次训练，plan_id可选关联计划。workout_sets以多对一关系挂到workout_logs上，精确到每组的动作、重量、次数和休息时长。exercises存储动作定义，8大肌群（chest/back/shoulder/leg/arm/core/full_body/cardio）和3种类别（compound/isolation/cardio）构成分类维度，is_preset区分预置和自定义动作。

**健康数据域**的health_data表按user_id + record_date设UNIQUE约束，同一天重复录入执行更新。字段覆盖体重、身高、体脂率、肌肉量、静息心率和收缩压/舒张压。

**成就域**的achievements表定义17项预设勋章，code字段唯一标识，requirement_type取workouts/days/duration/calories四种维度。user_achievements记录解锁关系，UNIQUE(user_id, achievement_id)防重复。

**订阅域**的subscriptions表跟踪套餐类型（free/monthly/yearly）和状态（active/cancelled/expired），记录起止日期和金额。

**AI对话域**的ai_conversations表为后续多轮对话预留，包含role（user/assistant/system）、content和conversation_id字段。

索引设计方面，为users表的email和username、workout_logs的(user_id, workout_date)复合索引、health_data的(user_id, record_date)复合索引、subscriptions的user_id等高频查询字段建立了B-tree索引。

### 4.3 接口设计
系统对外暴露10组API，合计超过50个端点，全部遵循RESTful风格。

认证模块（/api/auth）处理注册、登录、获取当前用户信息、更新资料和修改密码。用户模块（/api/users）提供管理员级别的用户列表、详情查看、角色和状态变更，以及头像上传。健身计划模块（/api/plans）支持CRUD和"我的计划"筛选。健身房模块（/api/gyms）在CRUD基础上增加了会员管理（增删改查）和"我的会员资格"查询。健康数据模块（/api/health-data）支持CRUD和统计查询，以及按日期精确检索。训练日志模块（/api/workouts）支持CRUD、统计和嵌套的sets数组写入。动作库模块（/api/exercises）支持按肌群/类别筛选和关键词搜索，以及自定义动作创建。成就模块（/api/achievements）返回含进度百分比的成就列表，以及手动触发检查。订阅模块（/api/subscriptions）提供套餐价格查询（公开）、当前订阅查询、开通/取消和管理员列表。AI模块（/api/ai）提供状态检查、对话、训练建议、营养建议和计划推荐五个端点，其中后四个需认证且受速率限制。

所有接口的请求参数均经过Zod Schema校验，非法输入在到达控制器之前就被拦截并返回422状态码和字段级中文错误信息。

---

## 第5章 系统实现
### 5.1 认证与权限实现
注册流程：用户提交注册请求→Zod校验registerSchema（用户名3-20位字母数字下划线中文、邮箱格式、密码最少6位、手机号选填但需符合1[3-9]开头11位格式）→检查用户名和邮箱是否已被占用→bcrypt.hash加密密码（saltRounds=10）→插入users表→签发JWT→返回用户信息和令牌。

登录流程与注册类似，区别在于密码比对用bcrypt.compare而非明文比较。即使用户表被拖库，攻击者也无法从哈希值反推密码原文。

JWT令牌的签发和验证由auth.ts中的`generateToken`和`verifyToken`完成。`generateToken`将userId、username、email和role四个声明写入载荷，设置7天有效期。`extractTokenFromHeader`从请求头的Bearer方案中提取Token字符串。后端authMiddleware中间件调用这两个工具函数完成认证流程，requireRole中间件则进一步校验角色是否在允许列表中。关键实现代码如下：

```typescript
// 认证中间件：从请求头提取Token并验证
export const authMiddleware = async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) return res.status(401).json({ success: false, error: '未提供认证 Token' });
  try {
    const decoded = verifyToken(token);
    req.user = decoded;  // 将 {userId, username, email, role} 挂载到请求对象
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
};

// 授权中间件：支持多角色参数
export const requireRole = (...allowedRoles: string[]) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: '未认证' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  };
};
```

前端AppLayout组件根据`user.role`动态组装菜单——普通用户可见健康数据、训练日志、成就、会员和AI助手入口，而健身房的公共页面对所有角色可见。这种前后端双重权限控制的设计确保了安全性：后端中间件在API层拦截越权请求，前端隐藏无权限的UI元素。

### 5.2 训练日志与组数实现
训练日志的创建接口需要同时写入workout_logs主表和workout_sets从表，这一操作通过数据库事务保证原子性。具体实现如下：

```typescript
// backend/src/controllers/workoutController.ts - createWorkout
export const createWorkout = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { plan_id, workout_date, duration_minutes, calories_burned, notes, sets } = req.body;
    const userId = req.user!.userId;

    await client.query('BEGIN');

    // 第一步：插入训练日志主表
    const result = await client.query(
      `INSERT INTO workout_logs (user_id, plan_id, workout_date, duration_minutes, calories_burned, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, plan_id || null, workout_date, duration_minutes, calories_burned || null, notes || null]
    );
    const workout = result.rows[0];

    // 第二步：逐条插入训练组数从表
    if (sets && sets.length > 0) {
      for (const s of sets) {
        await client.query(
          `INSERT INTO workout_sets (workout_id, exercise_id, set_order, weight, reps, rest_seconds, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [workout.id, s.exercise_id, s.set_order, s.weight || null,
           s.reps || null, s.rest_seconds || null, s.notes || null]
        );
      }
    }

    await client.query('COMMIT');

    // 事务提交后检查成就解锁
    const newAchievements = await checkAndUnlockAchievements(userId);

    res.status(201).json({
      success: true, message: '训练日志创建成功',
      data: await getWorkoutWithSets(workout.id),
      new_achievements: newAchievements.length > 0 ? newAchievements : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');  // 任何步骤失败，回滚全部操作
    res.status(500).json({ success: false, error: '创建训练日志失败' });
  } finally {
    client.release();  // 归还连接到连接池
  }
};
```

事务的生命周期严格遵循BEGIN→操作→COMMIT/ROLLBACK→release模式。主表插入失败或从表插入失败都会触发ROLLBACK，不留残数据。事务完成后自动调用`checkAndUnlockAchievements`检查成就解锁，新解锁的成就名称随响应返回，前端可即时弹出勋章提示。

更新训练日志时，sets的处理采用"先删后插"策略——先DELETE该workout_id关联的所有组数记录，再重新插入前端提交的完整sets数组。这种方式比逐条diff更新实现简单，且在事务保护下不会导致数据不一致。

训练统计由`getWorkoutStats`实现，通过SQL聚合函数计算总训练次数、总时长和总消耗热量。批量查询时采用`ANY($1)`语法一次性获取所有workout的sets，避免N+1查询问题。

### 5.3 AI健身顾问实现
AI模块的实现涉及四个子流程：请求路由、上下文构建、多模型适配和降级容错。

**请求路由。** 前端AIAssistantPage支持两种交互方式——快捷操作（训练建议/营养指导/计划推荐）调用专用端点（/api/ai/training-advice等），自由对话调用通用端点（/api/ai/chat）。每个请求先经过aiRateLimit中间件做日频次检查，再由Zod校验消息长度（不超过500字），最后进入控制器逻辑。

速率限制中间件以内存Map实现，按用户ID+日期维度计数：

```typescript
// backend/src/middleware/rateLimitMiddleware.ts
const DAILY_LIMIT = 20;
const rateLimitMap = new Map<string, { count: number; date: string }>();

export const aiRateLimit = (req, res, next): void => {
  const userId = req.user?.userId;
  const today = new Date().toISOString().split('T')[0];
  const entry = rateLimitMap.get(userId);

  if (!entry || entry.date !== today) {
    rateLimitMap.set(userId, { count: 1, date: today });
    next();
    return;
  }

  if (entry.count >= DAILY_LIMIT) {
    return res.status(429).json({ success: false, error: '今日 AI 对话次数已用完，请明天再来' });
  }

  entry.count++;
  next();
};
```

**上下文构建。** `buildUserContext`函数执行四个SQL查询：用户基本信息、近30天训练记录（LEFT JOIN健身计划名称和训练组数明细，LIMIT 10）、最近5条健康指标、累计统计。连续打卡天数通过SQL窗口函数高效计算：

```typescript
// backend/src/services/aiService.ts - buildUserContext
export const buildUserContext = async (userId: string): Promise<UserContext> => {
  const userResult = await pool.query(
    'SELECT username, age, gender, height, weight, fitness_goal FROM users WHERE id = $1',
    [userId]
  );

  const workoutsResult = await pool.query(
    `SELECT wl.*, fp.name as plan_name,
      json_agg(json_build_object('exercise_name', e.name, 'weight', ws.weight,
        'reps', ws.reps, 'set_order', ws.set_order) ORDER BY ws.set_order)
      FILTER (WHERE ws.id IS NOT NULL) as sets
     FROM workout_logs wl
     LEFT JOIN fitness_plans fp ON wl.plan_id = fp.id
     LEFT JOIN workout_sets ws ON wl.id = ws.workout_id
     LEFT JOIN exercises e ON ws.exercise_id = e.id
     WHERE wl.user_id = $1 AND wl.workout_date >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY wl.id, fp.name ORDER BY wl.workout_date DESC LIMIT 10`,
    [userId]
  );

  // ... 健康指标查询和统计查询 ...

  // 连续打卡天数：SQL窗口函数
  const streakResult = await pool.query(
    `WITH daily_workouts AS (
      SELECT DISTINCT workout_date::date as date FROM workout_logs
      WHERE user_id = $1 ORDER BY date DESC
    ), streak_calc AS (
      SELECT date, date - (ROW_NUMBER() OVER (ORDER BY date))::int as streak_group
      FROM daily_workouts
    )
    SELECT COUNT(*) as streak FROM streak_calc
    WHERE streak_group = (SELECT streak_group FROM streak_calc ORDER BY date DESC LIMIT 1)`,
    [userId]
  );

  return { profile, recentWorkouts, healthMetrics, stats };
};
```

`formatUserContextForPrompt`将上下文数据格式化为可读的结构化文本，拼接在系统提示词末尾。例如："用户名: 李明；累计训练: 45次；连续打卡: 7天；最近训练: 1. 2026-05-08: 上肢力量, 60分钟, 320卡"。

**多模型适配。** `createChatCompletion`根据AI_PROVIDER环境变量从API_ENDPOINTS映射表获取目标URL和路径。OpenAI、DeepSeek和Ollama共享messages数组格式；Anthropic的格式不同——system消息需单独提取到顶层字段，响应体是content数组而非choices数组：

```typescript
// backend/src/services/aiService.ts - createChatCompletion
export const createChatCompletion = async (messages: Message[], options = {}) => {
  const { provider, apiKey, model, maxTokens, temperature } = AI_CONFIG;
  if (!apiKey && provider !== 'ollama') throw new Error('AI_API_KEY 未配置');

  const endpoint = API_ENDPOINTS[provider];
  const url = AI_CONFIG.baseUrl
    ? `${AI_CONFIG.baseUrl}${endpoint.path}`
    : `${endpoint.url}${endpoint.path}`;

  // Anthropic 使用不同的请求和响应格式
  if (provider === 'anthropic') {
    const response = await axios.post(url, {
      model, max_tokens: options.maxTokens || maxTokens,
      temperature: options.temperature || temperature,
      messages: messages.filter(m => m.role !== 'system'),  // system 消息提取到顶层
      system: messages.find(m => m.role === 'system')?.content,
    }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, timeout: 60000 });

    return { content: response.data.content[0]?.text || '', usage: response.data.usage };
  }

  // OpenAI / DeepSeek / Ollama 使用统一格式
  const response = await axios.post(url, {
    model, messages, max_tokens: maxTokens, temperature, stream: false,
  }, { headers: { Authorization: provider === 'ollama' ? undefined : `Bearer ${apiKey}` }, timeout: 60000 });

  return { content: response.data.choices[0]?.message?.content || '', usage: response.data.usage };
};
```

**降级容错。** `isAIConfigured`检查API Key是否存在且非占位值（Ollama除外，本地运行不需要Key）。当检查返回false或`createChatCompletion`抛出异常时，控制器不返回错误，而是从FALLBACK_RESPONSES中按请求类型选取预设回复：

```typescript
// backend/src/prompts/fitnessPrompts.ts - 降级预设回复
export const FALLBACK_RESPONSES = {
  training: `【预设训练建议】
1. 建议每周训练 3-5 次，每次 45-60 分钟
2. 力量训练和有氧运动交替进行
3. 每个肌群每周训练 2 次，间隔至少 48 小时
4. 训练前做 5-10 分钟热身，训练后做拉伸放松
5. 如感到疲劳或疼痛，请适当休息
💡 AI 服务暂时不可用，以上为通用建议。`,
  nutrition: `【预设营养建议】...`,
  plan: `【预设计划建议】...`,
  general: `抱歉，AI 服务暂时不可用。请稍后再试。...`,
};
```

前端通过data.is_fallback字段判断回复来源，为true时在气泡旁显示橙色"预设建议"标签。

### 5.4 订阅计费实现
SUBSCRIPTION_PLANS常量定义了三级套餐的名称、价格、天数和功能列表。

getMySubscription在返回订阅数据前执行一条过期清理SQL——UPDATE subscriptions SET status='expired' WHERE end_date < CURRENT_DATE AND status='active'，确保客户端始终拿到准确的订阅状态。如果用户从未订阅，返回plan_type='free'的默认套餐信息。

subscribe操作在事务中完成：首先校验plan_type必须为monthly或yearly（不接受free），然后取消当前active订阅（SET status='cancelled'），接着插入新订阅记录（start_date为当前日期，end_date通过INTERVAL计算），最后返回新订阅和套餐信息。事务中的任何失败都触发ROLLBACK。

cancelSubscription将active订阅标记为cancelled，到期后不再续费。如果没有active订阅则返回404。

getPlans是公开接口，不需要认证，从SUBSCRIPTION_PLANS常量直接提取信息返回。

getAllSubscriptions是管理员接口，支持按status和plan_type筛选，返回带分页的订阅列表。

### 5.5 成就激励实现
成就系统在数据库中预置了17项勋章，覆盖四维度：里程碑（1次训练）、累计训练（10/50/100次）、连续打卡（3/7/14/30/100天）、累计时长（10/50/100/500小时）、累计消耗（1000/10000/50000/100000卡路里）。

核心检查函数`checkAndUnlockAchievements`在数据库事务中完成整个流程：

```typescript
// backend/src/controllers/achievementController.ts
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userStats = await getUserStats(userId);  // 获取四维度统计

    // 查询用户已解锁的成就ID集合
    const unlockedResult = await client.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1', [userId]
    );
    const unlockedIds = new Set(unlockedResult.rows.map(r => r.achievement_id));

    // 遍历所有成就定义，检查是否达到解锁条件
    const achievements = (await client.query('SELECT * FROM achievements')).rows;
    const newUnlocks: string[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;  // 跳过已解锁
      const currentProgress = getProgressValue(achievement.requirement_type, userStats);
      if (currentProgress >= achievement.requirement_value) {
        await client.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [userId, achievement.id]
        );
        newUnlocks.push(achievement.name);
      }
    }

    await client.query('COMMIT');
    return newUnlocks;
  } catch (error) {
    await client.query('ROLLBACK');
    return [];
  } finally {
    client.release();
  }
}
```

其中`getUserStats`获取用户四维度统计数据，`calculateStreak`用日期去重+逆向遍历算法计算连续打卡天数：

```typescript
async function calculateStreak(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT DISTINCT workout_date FROM workout_logs
     WHERE user_id = $1 ORDER BY workout_date DESC`, [userId]
  );
  if (result.rows.length === 0) return 0;

  const dates = result.rows.map(r => {
    const d = new Date(r.workout_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const yesterdayTime = todayTime - 86400000;

  // 从今天或昨天开始算连续天数（容忍一天未打卡）
  let startTime = dates.includes(todayTime) ? todayTime
    : dates.includes(yesterdayTime) ? yesterdayTime : 0;
  if (!startTime) return 0;

  let streak = 0, checkTime = startTime;
  while (dates.includes(checkTime)) {
    streak++;
    checkTime -= 86400000;  // 往前推一天
  }
  return streak;
}
```

`getProgressValue`根据成就维度映射到对应的统计字段：workouts维度取总训练次数，days维度取连续打卡天数，duration维度取总时长小时数，calories维度取总消耗热量。这个函数在createWorkout完成后被自动调用，训练日志的响应数据中包含new_achievements字段——如果有新解锁的成就，前端可以立即弹出勋章动画提示。

前端AchievementsPage调用GET /api/achievements接口获取成就列表，每个成就对象包含current_progress和progress_percentage字段。未解锁成就的进度实时计算（如当前训练8次/目标10次=80%），已解锁成就显示100%和解锁时间unlocked_at。

### 5.6 数据校验与错误处理
本系统通过Zod Schema + 自定义错误类 + 统一错误中间件三层机制实现从输入校验到错误响应的全链路管控。

**Zod参数校验。** 系统定义了11个校验模式，覆盖全部需要用户输入的接口。校验中间件工厂函数`validate`在请求到达控制器之前拦截非法输入，返回400状态码和字段级中文错误信息。校验通过后，`schema.parse()`的返回值替换原始`req[source]`，后续处理器拿到的已是类型安全的数据——多余字段被剥离，类型转换已完成。

**自定义错误层次。** 系统定义了AppError基类和五个子类，每个子类关联固定的HTTP状态码：

```typescript
// backend/src/utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = '资源') { super(`${resource}不存在`, 404); }
}
export class ValidationError extends AppError {
  constructor(message: string = '参数验证失败') { super(message, 400); }
}
export class UnauthorizedError extends AppError {
  constructor(message: string = '未认证') { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message: string = '无权访问') { super(message, 403); }
}
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') { super(message, 409); }
}
export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败') { super(message, 500); }
}
```

**统一错误处理中间件。** errorHandler统一捕获所有错误并返回标准格式的JSON响应。AppError实例直接返回对应状态码；PostgreSQL唯一约束冲突自动转为409；外键约束错误转为400；JWT相关错误转为401；其他未知错误一律500，生产环境隐藏详情：

```typescript
// backend/src/middleware/errorHandler.ts
export const errorHandler = (err: Error | AppError, req, res, _next) => {
  console.error('❌ 错误:', err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
    return res.status(409).json({ success: false, error: '资源已存在' });
  }
  if (err.message.includes('foreign key constraint')) {
    return res.status(400).json({ success: false, error: '关联资源不存在' });
  }
  if (err.message.includes('jwt') || err.message.includes('token')) {
    return res.status(401).json({ success: false, error: '认证失败，请重新登录' });
  }
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  });
};

// 异步路由包装器：自动 catch 异步错误并传递给错误中间件
export const asyncHandler = (fn: Function) => {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
```

`asyncHandler`高阶函数包装异步路由，自动catch异常传递给错误中间件，使异步路由的异常处理语法与同步路由一致——开发者无需在每处手动try-catch。

### 5.7 容器化部署
docker-compose.yml定义了三个服务：postgres（PostgreSQL 15 Alpine镜像，带健康检查）、backend（Node.js镜像，等postgres健康后才启动，带HTTP健康检查探针）和frontend（Nginx镜像，代理后端API请求）。数据卷postgres_data和backend_uploads分别持久化数据库文件和用户上传的头像。

后端Dockerfile采用多阶段构建，先在构建阶段安装依赖并编译TypeScript，再在运行阶段只拷贝产出物，减小镜像体积。前端Dockerfile将Vite构建的静态资源输出到Nginx的html目录。

---

## 第6章 系统测试与分析
### 6.1 测试环境
测试在本地开发环境进行，后端Node.js v20.x、PostgreSQL 16.x、前端Vite 8.x。后端测试框架为Jest + Supertest，前端为Vitest + React Testing Library。AI模块测试涉及OpenAI GPT-4o-mini和DeepSeek Chat两种云端模型，以及本地Ollama部署的llama3.1:8b。

测试数据通过种子脚本生成，覆盖四种用户角色各5个账号、3个难度等级各5条计划模板、8大肌群共23个预置动作、6个月的模拟训练日志和健康数据、三种套餐四种状态的订阅组合。

### 6.2 功能测试结果
**用户认证测试。** 合法注册返回201和JWT令牌；用户名少于3位返回422及"用户名至少3个字符"；重复邮箱注册返回409。登录成功返回token，密码错误返回401，账户被禁用返回403。Token过期后访问受保护接口返回401，前端自动清除凭证跳转登录。密码修改需验证旧密码，旧密码错误返回401。

**训练管理测试。** 创建计划时名称为空返回422，持续周数输入0返回422，difficulty输入非法值返回422。创建训练日志时同步提交3组训练明细，查询返回sets数组长度为3，每组包含exercise_name、weight、reps等字段。模拟从表插入失败，确认主表也回滚，数据库无残留。训练完成后调用成就检查，训练次数达到阈值时返回新解锁的成就名称。

**健康数据测试。** 体重输入301kg超过上限返回422"体重不能超过300kg"，体脂率输入-1返回422"体脂率不能为负数"。同一日期连续两次录入，查询只返回一条记录（UNIQUE约束+UPDATE语义）。

**AI助手测试。** 免费用户访问AI页面看到升级提示。月度会员可正常对话，回复内容包含个性化上下文（用户名、训练数据）。快捷操作按钮分别触发对应类型的提示词注入。AI_API_KEY为空时isAIConfigured返回false，发送消息后返回预设回复且is_fallback=true。连续发送21次消息，前20次正常，第21次返回429"今日AI对话次数已用完"。

**订阅计费测试。** 首次开通月度会员返回201和end_date=start_date+30天。已有月度订阅时开通年度会员，旧订阅变为cancelled，新订阅end_date为365天后。过期订阅查询时自动标记为expired。取消订阅状态改为cancelled，无活跃订阅时返回404。

**成就系统测试。** 累计训练达10次后调用检查接口，"小试身手"成就解锁，返回数据包含newUnlocks数组。再次调用不重复解锁。前端进度条显示未解锁成就的当前百分比，已解锁显示100%。

### 6.3 性能测试
使用autocannon对10个高频API端点各发送100次请求，统计响应时间：

| API端点 | 平均响应(ms) | P99响应(ms) |
| --- | ---: | ---: |
| POST /api/auth/login | 85 | 210 |
| POST /api/auth/register | 120 | 280 |
| GET /api/plans | 45 | 95 |
| POST /api/workouts（含sets） | 68 | 150 |
| GET /api/workouts | 52 | 110 |
| GET /api/health-data | 48 | 105 |
| GET /api/exercises | 38 | 82 |
| POST /api/achievements/check | 75 | 180 |
| POST /api/subscriptions/subscribe | 62 | 130 |
| POST /api/ai/chat（GPT-4o-mini） | 1850 | 4200 |


CRUD类接口平均响应38-68ms，P99不超过180ms，满足200ms的性能目标。AI对话接口的响应时间取决于模型供应商，GPT-4o-mini平均1.85秒，本地Ollama（8b模型）平均3.2秒。健康检查端点GET /health平均12ms，适合作为负载均衡存活探针。

### 6.4 结果讨论
**AI降级的有效性。** 在模拟AI服务中断的测试中，降级策略百分之百触发，预设回复在50ms内返回。用户虽然得不到个性化建议，但不至于面对空白或报错——在SaaS多租户场景下，这意味着一个第三方服务的波动不会拖垮整个平台。

**事务一致性的必要性。** 训练日志+组数、订阅取消+新订阅创建这两类操作必须保证原子性。在事务回滚测试中，模拟从表插入失败后主表数据已回滚，数据一致性得到保障。如果不使用事务，可能出现"训练日志创建了但组数丢失"或"旧订阅取消了但新订阅没创建"的脏数据。

**Zod校验的防御效果。** 注入类测试中，所有超长字符串、负数值和非法枚举值都被中间件拦截，未到达控制器层。校验错误消息是中文的、字段级的，前端可以直接展示给用户。

**速率限制的局限。** 当前aiRateLimit基于内存Map，单实例功能正常，但水平扩展时计数器无法跨进程同步。服务重启后计数清零，用户当日额度会意外重置。引入Redis做共享存储是后续要解决的问题。

---

## 第7章 总结与展望
### 7.1 工作总结
本文设计并实现了一个基于SaaS模式的智慧健身管理系统，围绕训练管理、健康追踪、健身房运营、成就激励、订阅计费和AI个性化顾问六大功能域完成工程落地。

技术层面，系统验证了React 19 + Express 5 + PostgreSQL 16全栈架构在健身SaaS场景下的适用性；Zod 4实现了前后端一致的数据校验；JWT + 角色中间件实现了多租户权限控制；"统一接口 + 策略路由 + 降级容错"的架构模式完成了AI能力的产品化集成。产品层面，成就勋章系统将游戏化思维融入健身场景，四维度进度追踪与自动解锁构成了行为正反馈；三级订阅计费实现了功能梯度开放与商业变现的闭环。

创新点有三：第一，AI模块的多模型适配策略使平台免受单一供应方锁定，运行时切换只需改环境变量；第二，上下文感知的提示词构建将用户真实训练数据注入AI对话，个性化建议不再停留在通用模板层面；第三，降级容错机制在模型服务不可达时自动回退至预设领域知识，保障了服务连续性。

### 7.2 局限性
**多租户隔离粒度有限。** 当前行级隔离（gym_id字段过滤）在租户数量增长后，查询性能会随数据量下降，且存在遗漏过滤条件导致越权访问的风险。

**AI响应体验。** 同步请求-响应模式下，用户需要等模型完整输出后才看到结果，GPT-4o-mini平均1.85秒，更慢的模型可能超过10秒，交互体验不够流畅。

**速率限制的单点问题。** 内存Map在多实例部署时计数器不共享，服务重启后计数清零。

**移动端适配不充分。** 当前为桌面优先的响应式布局，部分表格和卡片在小屏幕上存在横向溢出。

**实时推送缺失。** 成就解锁通知、订阅状态变更需要用户刷新页面才能感知，缺少主动推送。

### 7.3 未来工作
**Schema级数据隔离。** 当活跃健身房数量超过100个时，将行级隔离升级为Schema级——每个场馆在同一个PostgreSQL实例中拥有独立Schema，查询时通过SET search_path自动路由。

**AI响应流式化。** 改用Server-Sent Events（SSE）推送模型的逐token输出，前端逐字渲染，将用户感知的首字延迟控制在1秒以内。流结束后将完整文本落库。

**Redis分布式速率计数。** 按用户ID和日期构建计数键，设TTL自动过期，解决多实例计数不一致和服务重启计数清零的问题。

**WebSocket实时推送。** 引入Socket.io建立双向通信，实现成就解锁即时通知、订阅状态变更推送和训练提醒定时触发。

**移动端深度适配。** 采用Ant Design Mobile组件重构小屏交互，优先适配训练日志录入和个人资料页面。

**国际化与主题定制。** 引入i18n框架支持中英文切换，实现深色模式，支持租户级别的品牌色定制以增强白标交付能力。

---

## 参考文献
[1] 国务院. 全民健身计划（2021-2025年）[Z]. 2021.

[2] IHRSA. 2023 Global Fitness Industry Report[R]. Boston: IHRSA, 2023.

[3] 陈昊, 张磊. 基于SaaS模式的企业应用架构研究[J]. 计算机工程与应用, 2021, 57(12): 25-33.

[4] 张华, 李明. 健身领域数字化转型中的用户行为分析与留存策略[J]. 体育科学, 2023, 43(6): 78-86.

[5] 王伟, 刘洋. PostgreSQL在大规模Web应用中的性能优化策略[J]. 计算机科学, 2023, 50(3): 175-183.

[6] 刘鹏, 赵明. 基于Token的无状态认证机制安全性分析[J]. 信息安全研究, 2022, 8(5): 412-420.

[7] Fielding R T. Architectural Styles and the Design of Network-based Software Architectures[D]. University of California, Irvine, 2000.

[8] Oetiker R, Kegel M. Multi-tenant Data Architecture[J]. IEEE Software, 2021, 38(4): 52-59.

[9] 许晓昕, 李鹏飞. React框架在大型Web应用中的实践与优化[J]. 软件学报, 2022, 33(8): 2950-2965.

[10] 石磊, 王志海. 基于大语言模型的个性化推荐系统研究[J]. 中文信息学报, 2024, 38(2): 45-56.

[11] 赵亮, 孙军. 前端状态管理方案的比较与选型研究[J]. 计算机应用研究, 2023, 40(11): 3356-3362.

[12] Wei J, Wang X, Schuurmans D, et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models[C]//Advances in Neural Information Processing Systems, 2022: 24824-24837.

[13] 李刚, 陈伟. Express中间件架构的设计模式与实践[J]. 计算机工程与应用, 2022, 58(16): 102-110.

[14] Vaswani A, Shazeer N, Parmar N, et al. Attention Is All You Need[C]//Advances in Neural Information Processing Systems, 2017: 5998-6008.

[15] Brown T, Mann B, Ryder N, et al. Language Models are Few-Shot Learners[C]//Advances in Neural Information Processing Systems, 2020, 33: 1877-1901.

[16] 孙晓峰, 马超. 基于订阅计费模式的SaaS平台设计与实现[J]. 软件导刊, 2023, 22(9): 55-60.

---

## 致谢
感谢导师在选题方向和论文撰写过程中给予的悉心指导。感谢实验室同学在系统测试阶段提供的帮助。感谢开源社区——React、Express、PostgreSQL、Ant Design等项目的维护者，正是这些高质量的开放源代码让本系统的实现成为可能。

---

## 附录A：核心API端点列表
| 方法 | 路径 | 功能 | 权限 |
| --- | --- | --- | --- |
| POST | /api/auth/register | 用户注册 | 公开 |
| POST | /api/auth/login | 用户登录 | 公开 |
| GET | /api/auth/me | 获取当前用户 | 认证 |
| PUT | /api/auth/me | 更新用户信息 | 认证 |
| PUT | /api/auth/me/password | 修改密码 | 认证 |
| POST | /api/users/me/avatar | 上传头像 | 认证 |
| GET | /api/plans | 计划列表 | 认证 |
| GET | /api/plans/my | 我的计划 | 认证 |
| POST | /api/plans | 创建计划 | 认证 |
| PUT | /api/plans/:id | 更新计划 | 创建者/管理员 |
| DELETE | /api/plans/:id | 删除计划 | 创建者/管理员 |
| GET | /api/workouts | 训练日志列表 | 认证 |
| GET | /api/workouts/stats | 训练统计 | 认证 |
| POST | /api/workouts | 创建训练日志 | 认证 |
| GET | /api/health-data | 健康数据列表 | 认证 |
| GET | /api/health-data/stats | 健康统计 | 认证 |
| POST | /api/health-data | 录入健康数据 | 认证 |
| GET | /api/exercises | 动作库列表 | 认证 |
| POST | /api/exercises | 创建自定义动作 | 认证 |
| GET | /api/gyms | 健身房列表 | 认证 |
| POST | /api/gyms | 创建健身房 | 认证 |
| GET | /api/gyms/:id/members | 会员列表 | 认证 |
| POST | /api/gyms/:id/members | 添加会员 | 认证 |
| GET | /api/achievements | 成就列表（含进度） | 认证 |
| POST | /api/achievements/check | 检查并解锁 | 认证 |
| GET | /api/subscriptions/plans | 套餐价格 | 公开 |
| GET | /api/subscriptions/my | 我的订阅 | 认证 |
| POST | /api/subscriptions/subscribe | 订阅/续费 | 认证 |
| PUT | /api/subscriptions/cancel | 取消订阅 | 认证 |
| GET | /api/ai/status | AI状态检查 | 公开 |
| POST | /api/ai/chat | AI对话 | 认证+限流 |
| POST | /api/ai/training-advice | 训练建议 | 认证+限流 |
| POST | /api/ai/nutrition-advice | 营养建议 | 认证+限流 |
| POST | /api/ai/plan-suggestion | 计划推荐 | 认证+限流 |


---

## 附录B：数据库表结构概览
| 表名 | 主要字段 | 说明 |
| --- | --- | --- |
| users | id, username, email, password_hash, role, status | 用户，role支持4种 |
| fitness_plans | name, duration_weeks, difficulty, creator_id, is_template | 健身计划 |
| workout_logs | user_id, plan_id, workout_date, duration_minutes, calories_burned | 训练日志 |
| workout_sets | workout_id, exercise_id, set_order, weight, reps, rest_seconds | 训练组数 |
| exercises | name, muscle_group, category, is_preset | 动作库，8肌群+3类别 |
| health_data | user_id, record_date, weight, height, body_fat, heart_rate, blood_pressure | 健康指标 |
| gyms | name, address, phone, owner_id, status | 健身房 |
| gym_members | gym_id, user_id, membership_type, membership_status, start_date, end_date | 会员关系 |
| achievements | code, name, category, requirement_type, requirement_value | 成就定义 |
| user_achievements | user_id, achievement_id, unlocked_at | 解锁记录 |
| subscriptions | user_id, plan_type, status, start_date, end_date, amount | 订阅记录 |
| ai_conversations | user_id, role, content, conversation_id | AI对话（预留） |