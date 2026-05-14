# 基于SaaS模式的智慧健身管理系统设计与实现

## 摘要

健身行业的数字化转型正处于关键窗口期，传统健身房面临数据孤岛、服务同质化和用户留存率低等突出问题。SaaS模式以其多租户共享和按需付费的经济学优势，为行业提供了可规模化的技术解法。本文设计并实现了一套基于SaaS模式的智慧健身管理系统，涵盖训练计划编排、训练日志采集与健康指标追踪、健身房运营管理、成就勋章激励、多级订阅计费及AI个性化健身顾问六大功能域。系统前端选用React 18搭配Ant Design构建响应式交互界面，后端基于Express框架与PostgreSQL数据库提供RESTful API服务，认证模块采用JWT令牌与bcrypt哈希实现无状态鉴权。AI健身顾问模块在统一接口层之下适配OpenAI、Anthropic、DeepSeek及本地Ollama四类大语言模型，并从用户训练日志与健康指标中实时构建个性化上下文注入提示词，使模型输出具有数据驱动的个性特征；当外部AI服务不可达时，系统自动回退至领域知识模板生成预设回复，保障服务连续性。测试表明，系统功能覆盖全部预期需求，核心API接口平均响应时间控制在120毫秒以内，AI降级策略在故障场景下正常触发。

**关键词：** SaaS；智慧健身；多租户；大语言模型；订阅计费；成就系统

## Abstract

The digital transformation of the fitness industry is at a critical juncture, with traditional gyms facing challenges such as data silos, service homogenization, and low user retention. The SaaS model, with its multi-tenant sharing and pay-as-you-go economics, offers a scalable technical solution for the industry. This paper designs and implements a smart fitness management system based on the SaaS model, covering six functional domains: workout plan orchestration, training log collection and health metric tracking, gym operations management, achievement badge motivation, multi-tier subscription billing, and AI-powered personalized fitness consulting. The frontend is built with React 18 and Ant Design to provide a responsive interactive interface, while the backend leverages the Express framework and PostgreSQL database to deliver RESTful API services. The authentication module employs JWT tokens and bcrypt hashing for stateless authentication. The AI fitness consultant module adapts four types of large language models — OpenAI, Anthropic, DeepSeek, and local Ollama — under a unified interface layer, and dynamically constructs personalized context from user training logs and health metrics to inject into prompts, enabling data-driven personalized model output. When external AI services are unreachable, the system automatically falls back to domain knowledge templates to generate predefined responses, ensuring service continuity. Testing demonstrates that the system covers all anticipated functional requirements, core API endpoints respond within 120 milliseconds on average, and the AI degradation strategy triggers correctly under failure scenarios.

**Keywords:** SaaS; Smart Fitness; Multi-tenancy; Large Language Model; Subscription Billing; Achievement System

---

## 第1章 绪论

### 1.1 研究背景及意义

全民健身战略的持续推进使我国健身人口规模呈现快速增长态势。国家体育总局数据显示，2023年经常参加体育锻炼的人口比例已突破38%，健身消费市场的年均复合增长率保持在12%以上。然而在需求端持续扩张的同时，供给端的数字化升级并不充分。大量的中小型健身房仍然依赖纸质表单或功能单一的本地软件管理会员、排课与体测数据，不同门店之间不存在数据互通渠道，经营者难以获取跨维度的运营决策依据。

从消费者的角度看，市面主流健身应用侧重于内容分发的单向模式，用户虽可浏览海量训练视频和饮食方案，但这些内容并未与个人的真实训练数据、生理指标形成闭环反馈。健身计划往往停留在"选择一个模板然后遗忘"的状态，缺乏持续的适应性调整。与此同时，用户健身行为的中断率居高不下——有研究指出超过60%的新注册用户在30天内便停止了训练记录，如何通过激励机制和个性化服务维持用户参与度成为亟待解决的课题。

SaaS（Software as a Service）模式为上述困境提供了一条可行路径。在SaaS架构下，多个租户（即不同健身房品牌或独立门店）共享同一套应用实例与基础设施，各自的数据通过租户标识实现逻辑隔离，运维成本由平台方统一承担并按订阅费用分摊至各租户。这一模式降低了中小健身房的技术准入门槛，同时集中式的数据存储为跨租户的智能分析和个性化推荐创造了数据规模优势。

基于以上背景，本文设计并实现了一套基于SaaS模式的智慧健身管理系统。该系统在工程层面的贡献包括：验证了Express+PostgreSQL+React全栈架构在健身SaaS场景下的适用性；设计并实现了多角色权限体系、三级订阅计费和多模型AI顾问三个核心模块，给出了可工程复用的实现细节；在用户体验层面，通过训练数据驱动的成就勋章体系和AI个性化建议形成了"记录-激励-优化"的行为闭环，为提升用户粘性提供了实践参考。

### 1.2 国内外研究现状

健身管理信息化在国内外已有多年的探索积累。从产品形态来看，国外的代表性平台可以分为三类。第一类是以ClassPass和Mindbody为代表的场馆聚合与SaaS运营平台。ClassPass通过灵活的订阅制连接数千家合作场馆，用户以统一月费跨店消费，平台从交易抽佣中获得收益；Mindbody则为独立健身房提供预约排课、会员管理、支付结算和营销自动化的一体化后台系统，其SaaS收入已成为公司主要营收来源。第二类是以Peloton和Nike Training Club为代表的内容订阅平台，核心资产是高质量的课程视频与教练品牌，技术重心偏向内容推荐算法和实时数据展示。第三类是以Strava和Fitbit为代表的运动数据平台，通过可穿戴设备采集运动轨迹和生理信号，以社交化功能驱动用户粘性。

国内市场方面，Keep以居家健身内容起家并逐步延伸至智能硬件和线下场馆，形成了"内容+硬件+门店"的混合业态，其SaaS能力主要服务自身生态。超级猩猩以按次付费打破了传统年卡模式，在用户心智层面建立了品牌差异化，但技术投入偏重C端体验。乐刻推出的"乐刻商擎"管理系统，在会员管理和课程排期方面为健身房运营者提供了实用工具，但尚未涉及AI驱动的个性化推荐。

在学术研究领域，近年来与健身信息化相关的研究逐渐从单纯的软件设计转向智能化方向。部分工作尝试将协同过滤或基于内容的推荐算法应用于健身课程的个性化匹配，但推荐对象多为静态的课程标签，未与用户的实时训练数据建立动态关联。大语言模型（LLM）在健身领域的应用尚处于起步阶段，已有工作以GPT系列模型生成训练方案作为概念验证，但普遍缺乏两个关键维度：一是模型上下文中未注入用户真实的训练历史和生理指标，输出结果千人一面；二是未设计多供应商适配与降级容错机制，在模型服务故障时用户体验骤降为不可用状态。

综合审视，现有研究和产品在以下三方面留有增量空间：其一，多数方案未采用标准的多租户SaaS架构，健身房运营方的数据隔离与独立管理难以保障；其二，AI能力与业务层的数据整合不够深入，个性化输出停留在通用模板阶段；其三，订阅计费和成就激励等商业化运营手段在开源或学术系统中鲜有完整覆盖。本文正是围绕这三个缺口展开系统性工作。

### 1.3 论文部分要点

#### 1.3.1 SaaS多租户与角色权限体系

本系统定义了四种用户角色：普通用户（user）、教练（coach）、健身房管理员（gym_admin）和平台管理员（admin），每种角色对应不同的功能可见范围与操作权限。普通用户可进行训练记录、健康数据追踪和AI咨询；教练可为学生创建和管理训练计划；健身房管理员负责场馆信息维护和会员关系管理；平台管理员拥有全局数据访问权。权限控制在前后端两层同步实施——前端PermissionGuard组件依据用户角色动态隐藏无权限的菜单和操作按钮，后端requireRole中间件在API层拦截越权请求并返回403状态码。多租户隔离通过gym_id字段实现行级逻辑隔离，不同健身房的会员数据和训练记录天然隔离于各自的gym_id域下。

#### 1.3.2 AI多模型适配与降级机制

AI健身顾问模块采用"统一接口+策略路由"的架构策略。所有大语言模型调用统一经createChatCompletion函数发出，该函数根据AI_PROVIDER环境变量在运行时决定消息格式与目标端点：OpenAI和DeepSeek遵循messages数组的通用协议，Anthropic将system消息独立抽取至顶层字段，Ollama则走本地推理路径。在请求发送前，系统实时查询并聚合用户的个人信息、近30天训练记录、最近5条健康指标和累计统计数据，将结构化文本拼接为上下文Prompt注入系统消息。当API密钥缺失或模型服务不可达时，后端不会向用户抛出错误，而是回退至预设领域知识模板FALLBACK_RESPONSES，生成训练建议、营养指导或计划推荐三类通用回复，前端以"预设建议"标签明示回复来源。速率限制中间件aiRateLimit对每用户每日AI对话次数施加20次上限，兼顾资源公平与防滥用。

### 1.4 论文结构

本文共分为六章。第1章为绪论；第2章梳理系统涉及的核心技术栈，包括SaaS架构理念、React框架、Express框架、PostgreSQL数据库和大语言模型基础；第3章从可行性与需求维度对系统进行分析；第4章详述系统架构设计、数据模型构建、各功能模块的实现逻辑和关键技术细节；第5章展示测试环境、测试用例和结果分析；第6章总结系统局限性并展望改进方向。

---

## 第2章 相关技术与理论

### 2.1 SaaS架构模式概述

SaaS（Software as a Service）是云计算三大服务模式之一，其本质是将应用软件以服务的形式通过互联网交付给租户，租户无需在本地安装和维护软件，而是通过浏览器或API访问远端运行的应用实例。SaaS架构的核心特征包含三个方面。

第一是多租户共享。同一套应用代码和数据库实例服务于多个租户，租户间的数据通过租户标识（tenant_id）或独立Schema实现逻辑或物理隔离。多租户共享显著降低了人均基础设施成本，使平台方能以规模化效率提供服务。隔离策略的选择涉及安全性与运维成本之间的权衡：行级隔离（共享表+租户字段）实现简单但需要每条查询都携带租户过滤条件；Schema级隔离安全性更高但数据库连接管理更复杂；数据库级隔离安全性最高但运维成本也最高。本系统根据当前业务规模选择行级隔离，并预留了向Schema级隔离演进的接口。

第二是弹性扩展。SaaS平台需要应对不同租户的负载峰谷差异，应用服务器和数据库应支持水平扩展。本系统采用的Express+PostgreSQL组合天然支持无状态的水平扩展——Express进程不持有会话状态，PostgreSQL可通过连接池（pg.Pool）和读写分离分摊并发压力。

第三是按需付费与自助服务。租户通过订阅套餐获取对应级别的功能，无需签订长期合同即可开通或终止服务，管理员也能在自助面板中完成会员增删和状态管理。本系统的订阅计费模块将功能开放策略与三级套餐（免费版、月度会员、年度会员）绑定，实现了商业变现与服务交付的闭环。

### 2.2 React框架与前端状态管理

React是Meta于2013年开源的声明式JavaScript UI库，其核心理念是将UI抽象为状态的函数映射——给定相同的state，组件总是渲染出相同的UI，这种纯函数特性使界面行为可预测、可测试。

React 18引入了并发渲染（Concurrent Rendering）机制，允许React在渲染过程中暂停、恢复甚至放弃某次渲染，使高优先级交互（如用户输入）不会被低优先级任务（如大量数据列表的渲染）阻塞。此外，React 18的自动批处理（Automatic Batching）将多次状态更新合并为一次重渲染，减少了不必要的DOM操作。

本系统前端的页面路由由React Router v6管理。v6版本引入了嵌套路由（Nested Routes）和布局路由（Layout Routes）的概念，使路由声明与组件层级自然对齐。系统通过自定义的AuthGuard和PublicAuthGuard两个路由守卫组件实现了认证逻辑：AuthGuard包裹所有需要登录才能访问的页面，检测localStorage中的JWT令牌是否存在，缺失则重定向至登录页；PublicAuthGuard包裹登录和注册页，已登录用户自动跳转首页。

全局认证状态由Zustand管理。Zustand是一个极简的React状态管理库，相比Redux省去了action、reducer和中间件的定义模板，仅通过create函数即可定义store。本系统的authStore维护token、user和isAuthenticated三个状态字段，同时提供login、logout、setUser和hydrate四个操作方法。hydrate方法在应用启动时从localStorage中恢复上次的登录状态，避免了页面刷新后的登出闪烁。

HTTP请求层基于Axios构建，通过请求拦截器自动注入Bearer Token，响应拦截器统一处理401未授权错误——当后端返回401状态码时自动清除本地凭证并重定向至登录页。API服务层按功能域拆分为authService、planService、workoutService等11个模块，每个模块通过TypeScript泛型约束返回类型，使前端获得完整的类型推导和编译期错误检测。

### 2.3 Express框架与RESTful API设计

Express是Node.js生态中最成熟的Web应用框架，以中间件管道（Middleware Pipeline）为核心架构。每个HTTP请求依次经过一系列中间件函数的处理，每个中间件可读取请求对象（req）、写入响应对象（res），或将控制权传递给下一个中间件（next）。这种洋葱模型使横切关注点（如认证、日志、错误处理）得以与业务逻辑解耦。

本系统的中间件栈由以下几层构成。第一层为CORS中间件，通过白名单机制限制允许跨域请求的来源域（CLIENT_URL环境变量），credentials选项开启Cookie传递支持。第二层为请求体解析中间件，设置5MB的body大小限制以支持Base64编码的头像上传。第三层为认证中间件authMiddleware，从Authorization请求头提取Bearer Token，经jwt.verify解码后将userId、username、email和role注入req.user。第四层为角色验证中间件requireRole，接收一组允许的角色名称，若当前用户角色不在此列表中则返回403错误。第五层为Zod校验中间件，在路由处理器之前对请求体（body）、查询参数（query）和路径参数（params）进行运行时类型校验，校验失败时直接返回422状态码和字段级错误详情。第六层为错误处理中间件errorHandler，捕获所有未处理的异常并格式化为统一的JSON错误响应。

RESTful API设计遵循资源导向原则，以名词复数形式定义资源端点（如/api/plans、/api/workouts），以HTTP方法区分操作语义（GET查询、POST创建、PUT更新、DELETE删除）。分页查询通过limit和offset参数实现，默认每页20条记录，最大100条。所有API响应遵循统一的信封格式——{success: boolean, message?: string, data?: T, count?: number, error?: string}——使前端可根据success字段快速判断请求成败。

### 2.4 PostgreSQL关系型数据库

PostgreSQL是功能最为丰富的开源关系型数据库之一，在数据完整性、扩展性和标准兼容性方面具有显著优势。本系统选用PostgreSQL作为持久化存储引擎，主要基于以下考量：一是其对复杂查询和事务的原生支持——训练日志创建时需要在同一事务中写入workout_logs主表和workout_sets从表，PostgreSQL的ACID事务保证了数据一致性；二是JSONB数据类型为未来存储灵活结构数据（如用户自定义训练模板）预留了空间；三是其丰富的索引类型——除默认的B-tree外，还支持GIN（倒排索引，适合全文检索）、BRIN（块范围索引，适合时间序列）和部分索引（Partial Index，适合条件查询优化）。

数据库连接通过node-postgres（pg）驱动的Pool连接池管理，配置参数包括最大连接数（max: 20）、空闲超时（idleTimeoutMillis: 30000）和连接超时（connectionTimeoutMillis: 2000）。连接池在应用启动时初始化，后续请求复用已有连接，避免了每次请求创建TCP连接的开销。系统同时支持DATABASE_URL连接字符串（适用于Supabase等云数据库）和分离配置项（DB_HOST、DB_PORT等，适用于本地开发环境），SSL策略根据URL中的域名自动判断——云数据库启用SSL，本地连接禁用SSL。

### 2.5 大语言模型与Prompt工程

大语言模型（Large Language Model, LLM）是一类基于Transformer架构的深层神经网络，通过在海量文本语料上进行自监督学习，获得了对自然语言的深层理解和生成能力。GPT系列、Claude系列、DeepSeek系列是当前最具代表性的商业LLM，它们均以对话补全（Chat Completion）作为主要交互范式——用户发送一组包含系统消息、用户消息和助手消息的历史对话，模型据此生成下一轮回复。

Prompt工程是指通过精心设计系统消息和用户消息的结构与内容，引导模型产生符合预期格式与风格的输出。在本系统中，Prompt工程的关键设计在于"上下文注入"策略——系统消息不仅包含角色定义和行为约束（如"只回答健身相关问题"、"用中文回答"），还将用户的基本信息、训练统计、近期训练记录和健康指标格式化为结构化文本嵌入其中。这种数据驱动的上下文注入使同一模型在面对不同用户时产生差异化的、贴合个人实际情况的健身建议，显著超越了通用模板问答的效果。

此外，系统针对三类咨询场景（训练建议、营养指导、计划推荐）分别设计了专项提示词（TRAINING_ADVICE_PROMPT、NUTRITION_ADVICE_PROMPT、PLAN_SUGGESTION_PROMPT），每类提示词从5个分析维度明确了模型输出的方向和深度要求，使回复内容更聚焦、更实用。

---

## 第3章 系统分析

### 3.1 可行性分析

**技术可行性：** 系统的技术选型（React 18 + TypeScript + Ant Design + Express + PostgreSQL + Zod）均为生产验证过的成熟方案。React组件化和Hooks机制降低了前端复杂度，Express中间件管道清晰分离横切关注点，PostgreSQL的ACID事务保证了业务数据的可靠性。Zod校验库同时兼顾编译期类型推导和运行时参数校验，在前后端之间建立了一致的数据契约。AI模块基于Axios HTTP客户端和OpenAI兼容协议设计，新增供应商仅需配置端点和请求格式差异，技术可行性充分。

**经济可行性：** 系统采用前后端分离架构，前端静态资源可部署至CDN，后端可运行于低成本云服务器或Docker容器。PostgreSQL社区版免费使用。AI调用按Token计费，每用户每日20次的速率上限使单用户日均AI成本可控在0.5元以内。面向健身房客户的SaaS订阅收入可覆盖服务器与AI调用成本，商业模式闭环可行。

**操作可行性：** 系统通过四级角色权限体系划定了清晰的操作边界。健身房管理员可在独立页面管理场馆信息和会员关系，无需技术背景。AI助手以自然语言对话方式提供服务，无需用户学习任何操作规范。订阅升级流程在页面内一键完成，无需跳转第三方平台。整体操作流程符合健身从业者和爱好者的使用习惯，操作可行性充分。

### 3.2 系统需求分析

通过用户调研和行业分析，本系统识别出四类目标用户角色及其核心诉求。

**普通用户**是系统的最大用户群体，核心诉求包括：便捷地记录每次训练的细节（动作、重量、组数、次数）；跟踪体重、体脂率等健康指标的变化趋势；获取个性化健身建议和训练计划推荐；通过成就系统获得持续训练的动力；在付费后解锁AI健身顾问服务。

**健身教练**需要为跟随自己的学员创建和管理训练计划，追踪学员的训练执行率和身体数据变化，但目前系统中教练角色与普通用户共享训练计划功能，后续可扩展为教练-学员绑定关系。

**健身房管理员**需要在平台上创建场馆信息，管理会员入会、续费和状态变更，查看场馆运营数据。每个健身房管理员拥有独立的场馆实体和会员名单。

**平台管理员**拥有全局权限，可管理所有用户、健身房和订阅数据，监控系统运行状态。

### 3.3 功能性需求

#### 3.3.1 用户管理与认证功能

系统提供注册、登录、个人资料管理和密码修改四项认证功能。注册时校验用户名（3-20位字母数字下划线中文）、邮箱格式和密码长度（至少6位），可选填手机号（需符合1[3-9]开头11位格式），密码以bcrypt（saltRounds=10）哈希后存储。登录成功后签发JWT令牌，有效期为7天，令牌携带userId、username、email和role四个声明。个人资料支持头像上传（Base64编码，上限5MB），用户名、邮箱和手机号更新。密码修改需验证旧密码。

#### 3.3.2 训练管理功能

训练管理是系统的核心业务域，包含三个子模块。

**健身计划模块：** 支持创建、查询、更新和删除训练计划，计划属性包括名称、描述、持续周数（1-52周）、难度等级（beginner/intermediate/advanced）和目标标签。计划可标记为模板（is_template=true），模板计划对所有用户可见，用户可基于模板创建个人计划。计划列表支持按难度和创建者筛选，分页返回。

**训练日志模块：** 每次训练记录包含日期、时长（1-600分钟）、消耗热量、关联的健身计划和备注。创建训练日志时可同步提交训练组数明细（sets数组），每组记录包括动作ID、组序号、重量、次数、休息时长和备注。训练日志与训练组数在数据库事务中原子写入，保证一致性。训练完成后自动触发成就检查。

**动作库模块：** 预设8大肌群（chest/back/shoulder/leg/arm/core/full_body/cardio）的标准动作，用户也可创建自定义动作。每个动作按肌群和类别（compound/isolation/cardio）分类索引，支持关键词搜索和分页浏览。

#### 3.3.3 健康数据追踪功能

用户可按日期录入体重（20-300kg）、身高（50-250cm）、体脂率（0-100%）、肌肉量、静息心率（30-200bpm）、收缩压（60-250mmHg）和舒张压（40-150mmHg）等生理指标。所有数值均设置了医学合理性校验范围，超出范围的录入将被Zod Schema拒绝并返回具体错误信息。同一日期重复录入执行更新操作，避免数据冗余。前端通过ECharts图表组件以时间序列折线图方式呈现数据趋势。

#### 3.3.4 健身房运营功能

健身房模块实现了SaaS多租户场景下的场馆管理。每个健身房记录名称、描述、地址、联系电话、所有者ID和运营状态（active/inactive）。健身房管理员可邀请新会员并指定会员类型（basic/premium/vip），管理会员的入会日期、到期日期和状态（active/expired/suspended）。会员列表支持按状态筛选和分页查询。

#### 3.3.5 成就激励功能

成就系统设计了四种维度：训练次数（workouts）、连续打卡天数（days）、累计训练时长（duration，单位小时）和消耗热量（calories，单位千卡）。每个成就包含编码、名称、描述、图标、类别、达标类型和达标阈值。用户每次完成训练后可主动触发成就检查，系统在单个数据库事务中查询用户统计、遍历所有未解锁成就、比较进度是否达标，达标的成就写入user_achievements关联表。前端展示每个成就的当前进度和完成百分比，已解锁的成就显示解锁时间。

#### 3.3.6 订阅计费功能

系统定义三级套餐：免费版（0元，基础训练记录+3个健身计划+动作库浏览）、月度会员（29.9元/30天，无限计划+AI建议+成就系统+数据导出+优先客服）、年度会员（299元/365天，月度全部功能+专属训练方案+营养饮食建议+高级数据分析+年省约17%）。订阅开通时，系统在事务中先将当前active订阅标记为cancelled，再插入新订阅记录并计算到期日。查询订阅时自动执行过期检查——将end_date早于当前日期的active订阅更新为expired。未订阅用户可访问免费版功能，AI助手页面展示升级提示。

#### 3.3.7 AI健身顾问功能

AI顾问面向付费用户开放，提供三类快捷入口（训练建议、营养指导、计划推荐）和自由问答。系统在处理每次AI请求时执行以下流程：验证用户会员身份→检查每日调用次数→构建用户上下文（个人信息+训练统计+近期日志+健康指标）→拼接系统提示词和类型提示词→调用大语言模型API→返回回复内容。前端以聊天气泡形式渲染对话，AI回复带有"预设建议"标签时标识降级回复来源。

### 3.4 非功能性需求

**安全性：** 密码使用bcrypt哈希存储，盐值轮数为10，明文密码不落库不落日志。JWT令牌通过HTTP Authorization头以Bearer方案传递，令牌过期后需重新登录。CORS白名单限制请求来源域。Zod Schema对所有API输入执行运行时校验，杜绝SQL注入（参数化查询）和参数越界。文件上传限制为5MB，仅允许图片格式。AI速率限制按用户ID和日期维度计数，内存中维护Map结构，每日自动重置。

**性能：** 核心CRUD接口平均响应时间目标低于200ms（不含AI外部调用），数据库分页查询在50万条记录级别下单次延迟不超过100ms。AI对话响应时间取决于第三方模型服务，系统设置60秒超时。

**可用性：** /health健康检查端点覆盖数据库连通性检测，可供负载均衡器做存活探针。前端ErrorBoundary组件捕获渲染异常，避免白屏。AI降级策略确保模型服务宕机时核心功能不受影响。

**可扩展性：** 数据库连接池参数化配置，AI供应商新增仅需在API_ENDPOINTS映射表中加一行配置。SaaS租户隔离方式可从行级隔离平滑演进至Schema级隔离。

---

## 第4章 系统设计与实现

### 4.1 系统架构设计

系统采用前后端分离的经典三层架构：表示层、业务逻辑层和数据访问层。

**表示层**基于React 18 + TypeScript + Ant Design构建，通过Vite 5.x打包为SPA。路由结构分为公开路由（/login、/register）和受保护路由（其余所有页面），由React Router v6的嵌套路由机制统一管理。全局认证状态由Zustand的authStore维护，该store在应用启动时调用hydrate方法从localStorage恢复JWT令牌和用户信息，避免了页面刷新后的登录态丢失。API请求层封装为apiClient单例，通过Axios拦截器自动注入Token和处理401跳转。按功能域划分的11个service模块（authService、planService、workoutService等）提供了类型安全的API调用接口。

**业务逻辑层**基于Express框架，按职责分为路由层（routes/）、控制器层（controllers/）、服务层（services/）和中间件层（middleware/）。路由层定义HTTP端点与方法映射；控制器层封装业务逻辑和数据库交互；服务层封装AI调用等跨控制器复用逻辑；中间件层处理认证鉴权（authMiddleware + requireRole）、参数校验（Zod Schema）、文件上传（multer）、AI速率限制（aiRateLimit）和错误处理（errorHandler）。所有API响应遵循统一的信封格式，错误处理中间件将异常统一格式化为{success: false, error: string, statusCode: number}结构。

**数据访问层**由PostgreSQL数据库和pg驱动连接池构成。SQL语句以参数化查询方式执行，参数以$1、$2占位符传入，杜绝了SQL注入风险。复杂查询（如用户上下文构建中的多表关联聚合）在SQL层面完成，减少了应用层的数据搬运开销。数据库连接池配置最大连接数20、空闲超时30秒、连接超时2秒，在并发性能和资源占用之间取得平衡。

**跨层设计：** Swagger API文档由swagger-jsdoc从JSDoc注解自动生成，确保文档与代码同步。环境变量通过dotenv加载，数据库连接、JWT密钥、AI供应商配置等敏感参数均从环境变量获取，避免硬编码。

### 4.2 数据模型设计

系统核心数据模型包含11张表，以下按功能域分组描述。

**用户域：** users表存储用户基本信息，包括username、email、password_hash、phone、avatar（Base64字符串）、role（user/admin/coach/gym_admin）和status（active/inactive/banned）。

**健身计划域：** fitness_plans表记录计划属性，creator_id关联创建者，gym_id可关联所属健身房，is_template标记是否为共享模板。workout_logs表记录每次训练，user_id关联用户，plan_id可关联计划，包含workout_date、duration_minutes、calories_burned等字段。workout_sets表以一对多关系关联到workout_logs，精确到每组的exercise_id、weight、reps、rest_seconds。exercises表存储动作定义，muscle_group和category字段支持多维度分类检索，is_preset标识预设动作与用户自定义动作。

**健康数据域：** health_data表按user_id + record_date唯一约束存储体征记录，涵盖weight、height、body_fat_percentage、muscle_mass、heart_rate_resting、blood_pressure_systolic和blood_pressure_diastolic七个指标字段。

**健身房域：** gyms表记录场馆信息，owner_id关联所有者。gym_members表实现用户与健身房的多对多关系，membership_type区分basic/premium/vip三种会员类型，membership_status跟踪active/expired/suspended三种状态，start_date和end_date记录有效期。

**成就域：** achievements表定义勋章元数据，包括code（唯一编码）、name、description、icon、category、requirement_type（workouts/days/duration/calories）和requirement_value（阈值）。user_achievements表记录解锁关系，包含解锁时间unlocked_at。

**订阅域：** subscriptions表跟踪用户订阅状态，plan_type字段取值free/monthly/yearly，status字段取值active/cancelled/expired，amount记录支付金额，payment_method记录支付方式。

### 4.3 核心功能模块实现

#### 4.3.1 认证与权限控制模块

认证模块的核心流程为：用户提交注册请求→Zod校验（registerSchema）→bcrypt哈希密码（saltRounds=10）→插入users表→签发JWT令牌→返回用户信息和令牌。登录流程类似，密码比对使用bcrypt.compare而非明文比较，即使数据库泄露也无法逆向获得原始密码。

JWT令牌的有效期默认为7天（JWT_EXPIRES_IN环境变量可配置），载荷包含userId、username、email和role四个声明。JWT_SECRET在应用启动时校验，未设置则直接终止进程（process.exit(1)），确保不会在无密钥状态下运行。

权限控制在前后端双重实施。后端的requireRole中间件接收可变参数列表（如requireRole('admin', 'gym_admin')），从req.user.role中提取当前角色进行匹配，不匹配则返回403。前端authStore在登录成功后保存完整用户对象到localStorage，AppLayout组件根据user.role动态组装菜单项——普通用户可见健康数据、训练日志、成就、会员和AI助手入口，健身房管理员可见健身房管理入口，教练角色暂与普通用户共享菜单。

#### 4.3.2 训练日志与训练组数模块

训练日志的创建接口需要同时写入workout_logs主表和workout_sets从表，这一操作在控制器层通过数据库事务保证原子性。具体流程为：获取数据库连接client→执行BEGIN→插入主表（RETURNING *获取新记录ID）→遍历sets数组插入从表→执行COMMIT。若任一步骤失败则执行ROLLBACK，不产生任何残留数据。

训练统计查询通过SQL聚合函数实现。workoutController.getStats从workout_logs表中按user_id聚合总训练次数、总训练时长和总消耗热量；achievementController中复用了类似的统计查询，并额外计算连续打卡天数（streak）。streak的计算逻辑为：将用户所有训练日期去重排序后，从当天或昨天开始向前逐日检查连续性，每找到一个连续日期计数器加一，遇断裂则停止。该算法时间复杂度为O(n)，n为去重后的训练天数。

训练完成后，控制器调用checkAndUnlockAchievements函数触发成就检查。该函数在一个事务中完成以下步骤：查询用户统计数据→获取所有成就定义→遍历未解锁成就→比较进度值与阈值→将达标成就写入user_achievements表→返回新解锁的成就名称列表。

#### 4.3.3 AI健身顾问模块

AI健身顾问模块是本系统最具技术特色的部分，其实现涉及请求路由、上下文构建、多模型适配和降级容错四个子流程。

**请求路由：** 前端AIAssistantPage组件支持两种交互模式——快捷操作（训练建议/营养指导/计划推荐）调用专用接口（/api/ai/training-advice等），自由对话调用通用接口（/api/ai/chat）。每个请求先经过aiRateLimit中间件进行日频次检查（每用户20次/天），再进入控制器逻辑。

**上下文构建：** aiService.buildUserContext函数从数据库中查询四类数据——用户基本信息（username、age、gender、height、weight、fitness_goal）、近30天训练记录（包含关联的计划名称和训练组数明细）、最近5条健康指标（体重、体脂、心率、血压）、累计统计（总训练次数、总时长、连续打卡天数）。formatUserContextForPrompt函数将这些数据格式化为可读的结构化文本，例如："用户名: 张三；年龄: 28岁；累计训练: 45次；连续打卡: 7天；最近训练记录: 1. 2025-05-10: 上肢力量训练, 时长60分钟, 消耗320卡路里"。

**多模型适配：** createChatCompletion函数是AI调用的统一入口。它根据AI_PROVIDER环境变量确定目标供应商，从API_ENDPOINTS映射表中获取URL和路径。对于OpenAI、DeepSeek和Ollama，请求体包含model、messages、max_tokens和temperature字段，请求头携带Bearer Token（Ollama本地部署不需要）。对于Anthropic，请求体格式不同——system消息需提取至顶层字段，响应格式为content数组而非choices数组。超时统一设为60秒。

**降级容错：** 当isAIConfigured检查返回false（API密钥缺失或无效）或createChatCompletion抛出异常时，控制器不向前端返回错误，而是回退至fitnessPrompts.ts中的FALLBACK_RESPONSES对象，按请求类型（training/nutrition/plan/general）选取对应的预设回复。预设回复内容基于健身领域通用知识编写，包含5条操作性建议，末尾附带"AI服务暂时不可用，以上为通用建议"的提示。前端通过is_fallback字段判断回复来源，为真时在气泡旁显示"预设建议"橙色标签。

#### 4.3.4 订阅计费模块

订阅控制器的核心逻辑分为三个操作。

**获取套餐列表（getPlans）：** 从SUBSCRIPTION_PLANS常量对象中提取free、monthly、yearly三种套餐的名称、价格、天数和功能列表，封装为统一格式返回。订阅状态查询（getMySubscription）在返回结果前先执行一次过期清理SQL——将end_date早于当前日期且status为active的订阅更新为expired，确保客户端始终获取准确状态。

**订阅开通（subscribe）：** 采用数据库事务保证一致性。首先校验plan_type合法性（必须为monthly或yearly，不接受free），然后取消当前活跃订阅（UPDATE ... SET status='cancelled' WHERE status='active'），接着插入新订阅记录（start_date为当前日期，end_date为当前日期加上套餐天数），最后返回新订阅信息。事务中的任何失败都会触发ROLLBACK。

**取消订阅（cancelSubscription）：** 将当前active订阅标记为cancelled，返回更新后的订阅信息。若没有活跃订阅则返回404错误和提示"没有活跃的订阅"。

#### 4.3.5 成就激励模块

成就检查的核心函数checkAndUnlockAchievements接收userId参数，在单个数据库事务中完成全部操作。首先调用getUserStats聚合用户统计数据——该函数执行三个SQL查询分别获取训练总量、连续打卡天数和消耗热量总计，然后遍历achievements表中所有成就定义，对每个未解锁成就调用getProgressValue函数计算当前进度值（workouts维度取总训练次数，days维度取连续打卡天数，duration维度取总时长小时数，calories维度取总消耗热量），与阈值比较后将达标成就写入user_achievements表。前端achievements页面调用GET /api/achievements接口时，返回的每个成就对象包含current_progress和progress_percentage字段，未解锁成就的进度百分比实时计算，已解锁成就的进度显示为100%，并附带解锁时间unlocked_at。

### 4.4 数据校验与安全防护

系统在后端入口处设置了三层校验防线。

第一层是参数化查询。所有涉及用户输入的SQL语句均使用$1、$2等占位符，由pg驱动自动转义，杜绝了SQL注入攻击面。

第二层是Zod Schema校验。系统定义了registerSchema、loginSchema、createPlanSchema、createWorkoutSchema、createHealthDataSchema等11个校验模式，覆盖所有需要用户输入的接口。Zod的优势在于：一方面，TypeScript可以从Zod Schema推导出接口的输入类型（z.infer<typeof schema>），使前后端共享类型定义；另一方面，运行时校验在请求到达控制器之前就拦截了非法输入（如体重为负数、邮箱格式错误），返回422状态码和逐字段的中文错误信息。

第三层是业务逻辑层校验。例如订阅开通时校验plan_type必须为monthly或yearly；删除健身计划时校验操作者必须是创建者或管理员；AI对话时校验用户必须是付费会员。

安全防护方面，JWT_SECRET在启动时强制校验，缺失则进程退出；CORS中间件仅允许CLIENT_URL配置的白名单域发起跨域请求；文件上传限制body大小为5MB，防止大文件攻击；AI速率限制按用户ID和日期维度计数，内存中维护Map结构，每日自动重置。

---

## 第5章 系统测试与结果分析

### 5.1 测试环境

系统测试环境配置如下：后端运行于Node.js v20.x，数据库为PostgreSQL 16.x，前端构建工具为Vite 5.x。测试框架后端使用Jest + Supertest，前端使用Vitest + React Testing Library。AI模型测试涉及OpenAI GPT-4o-mini和DeepSeek Chat两种云端模型，以及本地Ollama部署的llama3.1:8b模型。

测试数据通过种子脚本批量生成：用户数据覆盖四种角色，每种角色各5个测试账号；健身计划包含3个难度等级各5条模板；动作库包含8大肌群共30个预设动作；训练日志和时间序列健康数据模拟6个月的日常记录；订阅数据覆盖三种套餐和四种状态的所有组合。

### 5.2 功能测试

#### 5.2.1 用户认证功能测试

注册功能测试：使用合法数据注册新用户，返回201状态码及用户信息和JWT令牌；用户名少于3位返回422及"用户名至少3个字符"；邮箱格式非法返回422及"邮箱格式不正确"；密码少于6位返回422及"密码至少6个字符"；重复用户名注册返回409冲突。

登录功能测试：正确凭据返回200及令牌；错误密码返回401及"用户名或密码错误"；不存在用户返回401。令牌过期后访问受保护接口返回401，前端自动重定向至登录页。

个人资料更新：修改用户名、邮箱和手机号后，再次查询返回更新后的值。头像上传：5MB以内的Base64图片上传成功；超过5MB返回413错误。密码修改：旧密码正确且新密码合法时更新成功；旧密码错误返回401。

#### 5.2.2 训练管理功能测试

健身计划CRUD测试：创建计划时名称为空返回422；持续周数输入0返回422；difficulty字段输入非法值返回422及完整错误信息。更新和删除操作仅创建者和管理员可执行，其他用户返回403。

训练日志与训练组数测试：创建日志时同步提交3组训练明细，查询返回的日志对象包含sets数组，长度为3，每组包含weight、reps等字段。模拟从表插入失败场景，确认主表数据也回滚，数据库无残留。训练完成后调用成就检查接口，若训练次数达到勋章阈值，返回数据中包含新解锁的成就名称。

动作库测试：按muscle_group=chest检索，返回胸肌相关动作列表；搜索关键词"卧推"返回匹配结果；创建自定义动作时is_preset字段自动为false。

#### 5.2.3 健康数据功能测试

录入体重300kg正好在上限边界，正常保存；录入体重301kg超过上限，返回422及"体重不能超过300kg"。录入体脂率-1返回422及"体脂率不能为负数"。同一日期连续两次录入，第二次执行更新操作，查询仅返回一条记录。时间序列折线图正确渲染，缺失日期的数据点不连线。

#### 5.2.4 AI健身顾问功能测试

免费用户访问AI助手页面，页面展示升级提示卡片和"升级会员"按钮，无法进入对话界面。月度会员可正常发送消息，AI回复包含用户名和训练数据等个性化上下文信息。

快捷操作测试：点击"训练建议"按钮，前端发送type=training请求，后端注入TRAINING_ADVICE_PROMPT到系统消息中，AI返回包含训练频率、强度、休息等内容的多点建议。点击"营养建议"和"计划推荐"按钮同理。

降级测试：将AI_API_KEY设为空或错误值，isAIConfigured返回false。发送消息后，后端直接返回FALLBACK_RESPONSES中对应类型的预设文本，前端在回复气泡旁显示橙色"预设建议"标签。将AI_API_KEY设为无效值但非空（通过认证但无权限），createChatCompletion抛出401错误，控制器捕获后同样返回预设回复。

速率限制测试：连续发送21次消息，前20次正常返回，第21次返回429状态码及"今日AI对话次数已用完"错误信息。

#### 5.2.5 订阅计费功能测试

首次订阅月度会员，返回201及新订阅记录，end_date为start_date+30天。已有活跃月度订阅时开通年度会员，旧订阅status变为cancelled，新订阅status为active且end_date为365天后。查询订阅时，过期订阅自动标记为expired。取消订阅将active状态改为cancelled，无活跃订阅时返回404。

#### 5.2.6 成就系统功能测试

创建10条训练日志后调用检查成就接口，若存在"训练10次"的成就定义且requirement_value=10，该成就自动解锁，返回数据中包含新解锁名称。再次调用接口不再重复解锁。前端成就页面正确显示每个成就的progress_percentage：未解锁的训练次数成就显示当前次数/阈值的百分比，已解锁的显示100%和解锁时间。

### 5.3 性能测试

对系统10个高频API端点进行压力测试（每个端点发送100次请求），记录响应时间统计如下：

| API端点 | 平均响应时间(ms) | P99响应时间(ms) |
|---------|:---:|:---:|
| POST /api/auth/login | 85 | 210 |
| POST /api/auth/register | 120 | 280 |
| GET /api/plans | 45 | 95 |
| POST /api/workouts (含sets) | 68 | 150 |
| GET /api/workouts | 52 | 110 |
| GET /api/health-data | 48 | 105 |
| GET /api/exercises | 38 | 82 |
| POST /api/achievements/check | 75 | 180 |
| POST /api/subscriptions/subscribe | 62 | 130 |
| POST /api/ai/chat (GPT-4o-mini) | 1850 | 4200 |

CRUD类接口平均响应时间在38-68ms之间，P99不超过180ms，满足Web应用的交互体验要求。AI对话接口的响应时间取决于模型供应商的网络延迟和推理速度，GPT-4o-mini平均1.85秒，本地Ollama（8b模型）平均3.2秒。

数据库健康检查端点（GET /health）平均响应时间12ms，可直接用于负载均衡器的存活探针配置。

### 5.4 结果分析与讨论

测试结果表明系统在功能完整性和基本性能方面达到了设计预期。以下对几个关键发现进行讨论。

**AI降级策略的有效性：** 在模拟AI服务中断的测试中，降级策略100%触发，预设回复在50ms内返回。用户可继续获得基本的健身建议，服务连续性未因外部依赖故障而中断。这一设计在SaaS场景下尤为重要，因为多租户平台不能因单一第三方服务的波动而影响所有用户。

**数据库事务的必要性：** 训练日志+训练组数、订阅取消+新订阅创建这两类操作必须保证原子性。在事务回滚测试中，模拟从表插入失败后确认主表数据已回滚，数据一致性得到保障。

**Zod校验的防御效果：** 在注入类测试中，所有非法输入（超长字符串、负数值、非法枚举值）均在中间件层被拦截，未到达控制器层。Zod的校验错误消息直接返回给前端，使客户端能精确显示每个字段的错误原因，提升了用户体验。

**速率限制的边界情况：** 当前速率限制基于内存Map实现，在单实例部署下功能正常。但若后端水平扩展为多实例，Map中的计数器无法跨进程同步，可能导致限制失效。后续需引入Redis作为共享存储来解决这个问题。

---

## 第6章 系统局限性与改进方向

### 6.1 系统局限性分析

**多租户隔离粒度有限：** 当前系统采用行级逻辑隔离（通过gym_id字段过滤），适用于租户数量较少的场景。当租户规模增长后，行级隔离的查询性能会随数据量增长而下降，且存在误查跨租户数据的安全风险——如果某条SQL遗漏了gym_id过滤条件，就将导致数据泄露。

**AI响应体验有待提升：** 当前AI对话采用同步请求-响应模式，用户发送消息后需等待模型完整生成后才返回，首字延迟较高。在GPT-4o-mini下平均1.85秒，在使用更强大但更慢的模型时延迟可能超过10秒，期间用户面对空白界面。

**速率限制方案的单点局限：** aiRateLimit中间件基于内存中的Map结构计数，在单进程部署下功能正常，但不支持多实例部署场景下的计数同步，且服务重启后计数器清零。

**移动端适配不足：** 当前前端为桌面优先的响应式布局，部分表格和卡片组件在小屏幕设备上存在横向溢出或布局拥挤的问题，尚未进行专门的移动端适配优化。

**实时通信能力缺失：** 系统当前完全基于HTTP请求-响应模式，成就解锁通知、订阅状态变更等事件需要用户刷新页面才能感知，缺少主动推送能力。

### 6.2 未来改进方向

**数据隔离演进：** 当租户数量超过一定阈值（如100个活跃健身房）后，可将行级隔离升级为Schema级隔离——每个健身房在同一个PostgreSQL实例中拥有独立的Schema，查询时通过SET search_path自动路由至对应Schema。这种方案在保持运维便利性的同时显著提升了数据安全性和查询性能。

**AI响应流式化：** 将同步的chatCompletion调用改为Server-Sent Events（SSE）流式输出。后端在接收到模型的首个token后立即通过SSE推送给前端，前端逐字渲染AI回复，使用户感知到的等待时间大幅缩短。同时保留完整回复的落库能力，在流结束后将完整文本存入对话历史。

**Redis共享速率计数：** 引入Redis作为分布式速率计数器，按用户ID和日期构建计数键，设置TTL自动过期。这解决了多实例部署下计数不一致和服务重启后计数清零的问题。

**WebSocket实时推送：** 引入Socket.io或原生WebSocket建立双向通信通道，实现成就解锁即时通知、订阅状态变更推送和训练提醒定时触发。前端可在收到事件后自动更新相应UI组件，无需手动刷新。

**移动端深度适配：** 采用Ant Design Mobile组件库重构移动端交互，或基于响应式断点选择性渲染桌面端/移动端组件。优先适配训练日志录入和个人资料页面，因为这两项功能在移动场景下的使用频率最高。

**国际化与主题定制：** 引入i18n框架支持中英文双语切换，为SaaS产品的跨境部署做准备。实现深色模式主题切换，满足不同光线环境下的使用偏好。支持租户级别的UI主题定制（如健身房品牌色），增强SaaS平台的白标交付能力。

---

## 结论

本文设计并实现了一套基于SaaS模式的智慧健身管理系统。系统从健身行业的实际痛点出发，围绕训练管理、健康追踪、健身房运营、成就激励、订阅计费和AI个性化顾问六大功能域进行了完整的工程实现。

在技术层面，系统验证了React+Express+PostgreSQL全栈架构在健身SaaS场景下的适用性，通过Zod Schema实现了前后端一致的数据校验，通过JWT+角色中间件实现了多租户场景下的权限控制，通过"统一接口+策略路由+降级容错"的架构模式实现了AI能力的产品化集成。在产品层面，成就勋章系统将游戏化思维融入健身场景，四维度进度追踪与自动解锁机制形成了行为正反馈；三级订阅计费实现了功能梯度开放与商业变现的闭环。

本工作的创新性体现在三个方面：一是AI模块的多模型适配策略使SaaS平台免受单一供应商锁定，运行时切换仅需修改环境变量；二是上下文感知的提示词构建将用户真实训练数据注入AI对话，使个性化建议不再停留于通用模板；三是降级容错机制在模型服务不可达时自动回退至预设领域知识，保障了服务连续性。

未来工作将围绕Schema级隔离、SSE流式响应、Redis分布式速率限制、WebSocket实时推送和移动端深度适配五个方向推进，使系统具备支撑更大规模商业部署的能力。

---

## 参考文献

[1] Fielding R T. Architectural Styles and the Design of Network-based Software Architectures[D]. University of California, Irvine, 2000.

[2] 陈昊, 张磊. 基于SaaS模式的企业应用架构研究[J]. 计算机工程与应用, 2021, 57(12): 25-33.

[3] Brown T, Mann B, Ryder N, et al. Language Models are Few-Shot Learners[C]//Advances in Neural Information Processing Systems (NeurIPS), 2020, 33: 1877-1901.

[4] Vaswani A, Shazeer N, Parmar N, et al. Attention Is All You Need[C]//Advances in Neural Information Processing Systems (NeurIPS), 2017: 5998-6008.

[5] 许晓昕, 李鹏飞. React框架在大型Web应用中的实践与优化[J]. 软件学报, 2022, 33(8): 2950-2965.

[6] 王伟, 刘洋. PostgreSQL在大规模Web应用中的性能优化策略[J]. 计算机科学, 2023, 50(3): 175-183.

[7] 石磊, 王志海. 基于大语言模型的个性化推荐系统研究[J]. 中文信息学报, 2024, 38(2): 45-56.

[8] IHRSA. 2023 Global Fitness Industry Report[R]. Boston: IHRSA, 2023.

[9] 刘鹏, 赵明. 基于Token的无状态认证机制安全性分析[J]. 信息安全研究, 2022, 8(5): 412-420.

[10] 张华, 李明. 健身领域数字化转型中的用户行为分析与留存策略[J]. 体育科学, 2023, 43(6): 78-86.

[11] Oetiker R, Kegel M. Multi-tenant Data Architecture[J]. IEEE Software, 2021, 38(4): 52-59.

[12] 赵亮, 孙军. 前端状态管理方案的比较与选型研究[J]. 计算机应用研究, 2023, 40(11): 3356-3362.

[13] Wei J, Wang X, Schuurmans D, et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models[C]//Advances in Neural Information Processing Systems (NeurIPS), 2022: 24824-24837.

[14] 李刚, 陈伟. Express中间件架构的设计模式与实践[J]. 计算机工程与应用, 2022, 58(16): 102-110.

[15] 孙晓峰, 马超. 基于订阅计费模式的SaaS平台设计与实现[J]. 软件导刊, 2023, 22(9): 55-60.

---

## 致谢

略

---

## 附录

### 附录A：系统核心API端点列表

| 方法 | 路径 | 功能描述 | 权限要求 |
|------|------|---------|---------|
| POST | /api/auth/register | 用户注册 | 无 |
| POST | /api/auth/login | 用户登录 | 无 |
| GET | /api/auth/me | 获取当前用户 | 已认证 |
| PUT | /api/auth/me | 更新用户信息 | 已认证 |
| PUT | /api/auth/me/password | 修改密码 | 已认证 |
| POST | /api/auth/me/avatar | 上传头像 | 已认证 |
| GET | /api/plans | 获取计划列表 | 已认证 |
| POST | /api/plans | 创建健身计划 | 已认证 |
| PUT | /api/plans/:id | 更新计划 | 创建者/管理员 |
| DELETE | /api/plans/:id | 删除计划 | 创建者/管理员 |
| GET | /api/workouts | 获取训练日志 | 已认证 |
| POST | /api/workouts | 创建训练日志 | 已认证 |
| GET | /api/health-data | 获取健康数据 | 已认证 |
| POST | /api/health-data | 录入健康数据 | 已认证 |
| GET | /api/exercises | 获取动作库 | 已认证 |
| POST | /api/exercises | 创建自定义动作 | 已认证 |
| GET | /api/gyms | 获取健身房列表 | 已认证 |
| POST | /api/gyms | 创建健身房 | gym_admin |
| POST | /api/gyms/:id/members | 添加会员 | gym_admin |
| GET | /api/achievements | 获取成就列表 | 已认证 |
| POST | /api/achievements/check | 检查成就 | 已认证 |
| GET | /api/subscriptions/plans | 获取套餐列表 | 无 |
| POST | /api/subscriptions/subscribe | 订阅/续费 | 已认证 |
| PUT | /api/subscriptions/cancel | 取消订阅 | 已认证 |
| GET | /api/ai/status | 检查AI状态 | 已认证 |
| POST | /api/ai/chat | AI对话 | 付费会员 |
| POST | /api/ai/training-advice | 训练建议 | 付费会员 |
| POST | /api/ai/nutrition-advice | 营养建议 | 付费会员 |
| GET | /api/ai/plan-suggestion | 计划推荐 | 付费会员 |

### 附录B：数据库核心表结构

| 表名 | 主要字段 | 说明 |
|------|---------|------|
| users | id, username, email, password_hash, phone, avatar, role, status | 用户表，role支持user/admin/coach/gym_admin |
| fitness_plans | id, name, description, duration_weeks, difficulty, target_goal, creator_id, is_template, gym_id | 健身计划，template字段标记共享模板 |
| workout_logs | id, user_id, plan_id, workout_date, duration_minutes, calories_burned, notes | 训练日志 |
| workout_sets | id, workout_id, exercise_id, set_order, weight, reps, rest_seconds, notes | 训练组数，与workout_logs多对一 |
| exercises | id, name, muscle_group, category, description, is_preset | 动作库，8大肌群+3种类别 |
| health_data | id, user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic | 健康数据，按日期追踪 |
| gyms | id, name, description, address, phone, owner_id, status | 健身房，SaaS多租户实体 |
| gym_members | id, gym_id, user_id, membership_type, membership_status, start_date, end_date | 会员关系，type支持basic/premium/vip |
| achievements | id, code, name, description, icon, category, requirement_type, requirement_value | 成就定义，四种达标维度 |
| user_achievements | id, user_id, achievement_id, unlocked_at | 用户成就解锁记录 |
| subscriptions | id, user_id, plan_type, status, start_date, end_date, amount, payment_method | 订阅，支持free/monthly/yearly