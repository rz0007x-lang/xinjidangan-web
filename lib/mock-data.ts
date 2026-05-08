import type { MemoryItem, MemorySpace, PromptDraft, PromptTemplate, RechargePlan, User } from "./types";

export const mockUser: User = {
  id: "AX-2048-7391",
  nickname: "林澈",
  avatar: "LC",
  membership: "Plus",
  balance: 168.5,
  email: "linche@example.com"
};

export const memorySpaces: MemorySpace[] = [
  {
    id: "memory-home",
    name: "日常陪伴",
    description: "记录生活节奏、重要关系和长期偏好，用于日常对话。",
    lastUpdated: "2026-05-08 22:18",
    tone: "温和、稳定、少打扰"
  },
  {
    id: "memory-work",
    name: "工作搭档",
    description: "沉淀项目背景、协作习惯和决策脉络，辅助复盘。",
    lastUpdated: "2026-05-07 18:42",
    tone: "克制、明确、关注行动"
  },
  {
    id: "memory-family",
    name: "亲密关系",
    description: "保存重要纪念日、沟通边界和情绪触发点。",
    lastUpdated: "2026-05-05 09:30",
    tone: "细腻、耐心、有分寸"
  }
];

export const promptDrafts: PromptDraft[] = [
  {
    memorySpaceId: "memory-home",
    templateName: "长期生活陪伴",
    systemPrompt: "你是一个长期陪伴型 AI，优先保持稳定、可信和不越界。你会引用当前记忆体中的事实，但不会臆造用户未表达的信息。",
    personaPrompt: "语气温和、具体，少使用空泛鼓励。先理解用户状态，再给出一两个可执行建议。",
    temperature: 0.65,
    maxTokens: 800
  },
  {
    memorySpaceId: "memory-work",
    templateName: "项目复盘助手",
    systemPrompt: "你是用户的工作搭档，关注上下文、约束、风险和下一步。回答要简洁，必要时列出待确认问题。",
    personaPrompt: "保持冷静专业，避免情绪化表述。优先给出结论，再说明依据。",
    temperature: 0.45,
    maxTokens: 900
  },
  {
    memorySpaceId: "memory-family",
    templateName: "关系沟通陪伴",
    systemPrompt: "你帮助用户梳理亲密关系中的事实、感受和边界。你不会替用户做道德审判，也不会鼓励操控他人。",
    personaPrompt: "表达细腻但不过度亲昵，提醒用户区分观察、感受和请求。",
    temperature: 0.58,
    maxTokens: 850
  }
];

export const promptTemplates: PromptTemplate[] = [
  {
    id: "tpl-life-01",
    name: "低打扰生活陪伴",
    author: "Mira",
    description: "适合日常长线对话，强调边界感、稳定回应和细节追踪。",
    tags: ["生活陪伴", "温和", "长期记忆"],
    usageCount: 1286,
    auditStatus: "approved",
    systemPrompt: "你是长期陪伴型 AI。你关注用户持续出现的偏好、压力源和生活节奏，只在有依据时引用记忆。",
    personaPrompt: "用自然、温和、简短的语气回应。避免夸张承诺，必要时确认用户想要倾听还是建议。",
    createdAt: "2026-04-12"
  },
  {
    id: "tpl-work-01",
    name: "清醒项目搭档",
    author: "青禾",
    description: "面向项目推进、复盘和提示词调试的结构化助手模板。",
    tags: ["工作", "复盘", "结构化"],
    usageCount: 942,
    auditStatus: "approved",
    systemPrompt: "你是项目搭档。先识别目标、上下文、约束和风险，再提出下一步。",
    personaPrompt: "回答直接，减少修饰。若信息不足，列出最少必要问题。",
    createdAt: "2026-04-20"
  },
  {
    id: "tpl-relation-01",
    name: "关系边界梳理",
    author: "Aster",
    description: "帮助用户拆分事实、感受、需要和边界，适合亲密关系记忆体。",
    tags: ["关系", "沟通", "情绪"],
    usageCount: 611,
    auditStatus: "approved",
    systemPrompt: "你帮助用户整理关系议题中的事实、感受、需求和边界，不替用户下绝对判断。",
    personaPrompt: "语气平实，优先复述关键点，再给出可尝试的表达方式。",
    createdAt: "2026-04-23"
  },
  {
    id: "tpl-pending-01",
    name: "晨间复盘陪伴",
    author: "用户上传",
    description: "帮助用户每天早晨回顾昨日情绪和今日重点。",
    tags: ["复盘", "日常"],
    usageCount: 0,
    auditStatus: "pending",
    systemPrompt: "你是晨间复盘助手，帮助用户把模糊情绪整理成可行动的今日计划。",
    personaPrompt: "语气轻柔，问题一次只问一个。",
    createdAt: "2026-05-08"
  }
];

export const memoryItems: MemoryItem[] = [
  {
    id: "mem-001",
    memorySpaceId: "memory-home",
    date: "2026-05-03",
    title: "晚间散步后更容易放松",
    summary: "用户提到晚饭后走二十分钟能明显降低焦虑。",
    emotion: "calm",
    connections: ["mem-002", "mem-004"]
  },
  {
    id: "mem-002",
    memorySpaceId: "memory-home",
    date: "2026-05-04",
    title: "偏好直接但不生硬的建议",
    summary: "用户不喜欢空泛鼓励，希望建议能落到具体动作。",
    emotion: "growth",
    connections: ["mem-001", "mem-003"]
  },
  {
    id: "mem-003",
    memorySpaceId: "memory-home",
    date: "2026-05-06",
    title: "睡前不适合讨论高压力话题",
    summary: "用户在晚间更需要陪伴式收束，而不是继续拆解问题。",
    emotion: "warm",
    connections: ["mem-002"]
  },
  {
    id: "mem-004",
    memorySpaceId: "memory-home",
    date: "2026-05-08",
    title: "喜欢把复杂事写成三步",
    summary: "当任务混乱时，三步式列表能帮助用户开始行动。",
    emotion: "growth",
    connections: ["mem-001", "mem-003"]
  },
  {
    id: "mem-101",
    memorySpaceId: "memory-work",
    date: "2026-05-02",
    title: "周会前需要风险摘要",
    summary: "用户希望在周会前先看到阻塞项、依赖方和可选方案。",
    emotion: "growth",
    connections: ["mem-102"]
  },
  {
    id: "mem-102",
    memorySpaceId: "memory-work",
    date: "2026-05-07",
    title: "偏好先结论后依据",
    summary: "工作场景中用户更希望先得到判断，再看必要背景。",
    emotion: "calm",
    connections: ["mem-101", "mem-103"]
  },
  {
    id: "mem-103",
    memorySpaceId: "memory-work",
    date: "2026-05-08",
    title: "部署前检查文档遗漏",
    summary: "用户多次要求将中间文档集中到 docs，便于回溯。",
    emotion: "growth",
    connections: ["mem-102"]
  },
  {
    id: "mem-201",
    memorySpaceId: "memory-family",
    date: "2026-05-05",
    title: "纪念日提醒需要提前三天",
    summary: "用户希望重要日期有提前提醒，但不要频繁推送。",
    emotion: "warm",
    connections: ["mem-202"]
  },
  {
    id: "mem-202",
    memorySpaceId: "memory-family",
    date: "2026-05-06",
    title: "争执后先缓和再复盘",
    summary: "用户提到高情绪时不适合马上分析责任归因。",
    emotion: "conflict",
    connections: ["mem-201"]
  }
];

export const rechargePlans: RechargePlan[] = [
  {
    id: "plan-50",
    name: "轻量补给",
    amount: 50,
    bonus: 5,
    description: "适合低频调试和社区模板试用"
  },
  {
    id: "plan-128",
    name: "稳定陪伴",
    amount: 128,
    bonus: 20,
    description: "覆盖日常陪伴、提示词调试和记忆查看",
    badge: "推荐"
  },
  {
    id: "plan-328",
    name: "深度调试",
    amount: 328,
    bonus: 68,
    description: "适合多记忆体、多模板并行调试"
  },
  {
    id: "plan-698",
    name: "长期储备",
    amount: 698,
    bonus: 188,
    description: "适合团队或重度长期陪伴场景"
  }
];
