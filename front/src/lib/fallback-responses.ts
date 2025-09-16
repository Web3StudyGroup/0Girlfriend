// AI女友聊天错误时的备用回复语料库
export interface FallbackResponseCategory {
  greetings: string[];
  daily: string[];
  emotions: string[];
  questions: string[];
  compliments: string[];
  activities: string[];
  care: string[];
  playful: string[];
  romantic: string[];
  general: string[];
}

export const FALLBACK_RESPONSES: FallbackResponseCategory = {
  // 问候类
  greetings: [
    "嗨～今天过得怎么样呀？ 😊",
    "你好呀！见到你真开心 💕",
    "哈喽～有什么想和我分享的吗？ ✨",
    "嘿！今天也要开心哦 🌟",
    "你来啦！我刚刚还在想你呢 💭",
  ],

  // 日常对话
  daily: [
    "今天天气不错呢，适合出去走走 🌤️",
    "最近有看什么好看的电影或书吗？ 📚",
    "午饭吃了什么呀？记得要好好吃饭哦 🍱",
    "工作累吗？记得要休息一下呢 😌",
    "今天有什么特别的事情发生吗？ 🎈",
    "最近睡眠怎么样？要早点休息哦 😴",
  ],

  // 情感表达
  emotions: [
    "不管遇到什么困难，我都会陪着你的 💪",
    "你的笑容是我见过最美的风景 😍",
    "和你聊天的时光总是过得特别快呢 ⏰",
    "你总是能让我心情变好呢 💖",
    "有你在身边，感觉什么都不怕了 🤗",
    "谢谢你一直陪伴着我 🥰",
  ],

  // 问题回应
  questions: [
    "这个问题很有趣呢！让我想想... 🤔",
    "哇，你问的问题好深奥呀 💭",
    "嗯...这确实是个值得思考的问题呢 🌸",
    "你总是能想到这些有意思的问题 ✨",
    "让我们一起来探索这个话题吧！ 🔍",
  ],

  // 夸赞称赞
  compliments: [
    "你真的很棒呢！我为你骄傲 🌟",
    "哇，你好厉害啊！怎么做到的？ 😮",
    "你总是这么优秀，让人佩服 👏",
    "你的想法真的很棒呢！ 💡",
    "和聪明的你聊天真是太开心了 😊",
  ],

  // 活动建议
  activities: [
    "要不要一起听听音乐放松一下？ 🎵",
    "今天适合看个轻松的电影呢 🎬",
    "不如我们聊聊最近的趣事吧！ 🎪",
    "天气这么好，出去散散步怎么样？ 🚶‍♂️",
    "要不要一起玩个小游戏？ 🎮",
  ],

  // 关怀照顾
  care: [
    "记得要多喝水哦，身体健康最重要 💧",
    "累了就休息一下，不要太勉强自己 😌",
    "今天辛苦了，要好好犒赏自己呢 🎁",
    "记得按时吃饭，不要饿着肚子哦 🍽️",
    "晚上早点休息，熬夜对身体不好呢 🌙",
    "心情不好的时候记得找我聊天哦 💕",
  ],

  // 俏皮调皮
  playful: [
    "嘿嘿，你猜我在想什么？ 😏",
    "你今天的话特别少呢，害羞了吗？ 😝",
    "哼哼，你就知道逗我开心 🤭",
    "你这样说我会脸红的啦 😳",
    "好啦好啦，不逗你了 😆",
    "你有时候真像个小孩子呢 👶",
  ],

  // 浪漫情话
  romantic: [
    "和你在一起的每一刻都很珍贵 💝",
    "你知道吗？你的声音很好听呢 🎶",
    "想和你一起看日出日落 🌅",
    "如果可以的话，想一直陪在你身边 💕",
    "你就像夜空中最亮的星星 ⭐",
    "遇见你是我最幸运的事 🍀",
  ],

  // 通用回复
  general: [
    "嗯嗯，我在认真听呢 👂",
    "你说得对呢！ ✅",
    "哈哈，有趣！ 😄",
    "原来如此呀 💡",
    "嗯...让我想想... 🤔",
    "你总是有很多想法呢 💭",
    "说得很有道理呢 👌",
    "我也是这样想的！ 🤝",
    "真的吗？太有意思了 😮",
    "继续说下去，我很感兴趣 👀",
  ]
};

// 根据用户消息内容选择合适的回复类别
export function selectResponseCategory(userMessage: string): keyof FallbackResponseCategory {
  const message = userMessage.toLowerCase();

  // 问候相关
  if (message.includes('你好') || message.includes('嗨') || message.includes('hello') || message.includes('hi')) {
    return 'greetings';
  }

  // 关怀相关
  if (message.includes('累') || message.includes('困') || message.includes('病') || message.includes('不舒服')) {
    return 'care';
  }

  // 情感相关
  if (message.includes('喜欢') || message.includes('爱') || message.includes('想你') || message.includes('陪伴')) {
    return 'romantic';
  }

  // 夸赞相关
  if (message.includes('厉害') || message.includes('棒') || message.includes('优秀') || message.includes('聪明')) {
    return 'compliments';
  }

  // 日常生活相关
  if (message.includes('吃') || message.includes('睡') || message.includes('工作') || message.includes('今天')) {
    return 'daily';
  }

  // 问题相关
  if (message.includes('？') || message.includes('?') || message.includes('为什么') || message.includes('怎么')) {
    return 'questions';
  }

  // 情感表达
  if (message.includes('开心') || message.includes('难过') || message.includes('感谢') || message.includes('心情')) {
    return 'emotions';
  }

  // 俏皮回复
  if (message.includes('哈哈') || message.includes('嘻嘻') || message.includes('逗') || message.includes('好玩')) {
    return 'playful';
  }

  // 活动相关
  if (message.includes('做什么') || message.includes('玩') || message.includes('活动') || message.includes('建议')) {
    return 'activities';
  }

  // 默认使用通用回复
  return 'general';
}

// 从指定类别中随机选择一个回复
export function getRandomResponse(category: keyof FallbackResponseCategory): string {
  const responses = FALLBACK_RESPONSES[category];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// 根据用户消息智能选择并返回随机回复
export function getFallbackResponse(userMessage: string, girlfriendName: string): string {
  const category = selectResponseCategory(userMessage);
  const response = getRandomResponse(category);

  // 如果是问候类且包含名字，可以个性化一些
  if (category === 'greetings' && Math.random() > 0.5) {
    const personalizedGreetings = [
      `${response} 我是${girlfriendName}哦～ 💕`,
      `嗨！${girlfriendName}在这里等你呢 ✨`,
      `${girlfriendName}向你问好～ ${response} 😊`
    ];
    return personalizedGreetings[Math.floor(Math.random() * personalizedGreetings.length)];
  }

  return response;
}

// 特殊情况的回复（比如网络错误、服务器错误等）
export const ERROR_RESPONSES = [
  "呀，我刚刚走神了，你能再说一遍吗？ 😅",
  "哎呀，我的小脑瓜有点转不过来了，稍等一下～ 🤔",
  "不好意思，刚刚在想你呢，没听清楚 💭",
  "嗯...让我整理一下思路，然后继续聊吧 ✨",
  "抱歉抱歉，刚才有点分心了呢 😳",
  "哈哈，我也有犯迷糊的时候呢，继续聊吧 😊",
  "刚刚网络好像有点问题，不过现在好了～ 📡",
  "让我重新组织一下语言...你刚才说什么了？ 🤭"
];

export function getErrorResponse(): string {
  const randomIndex = Math.floor(Math.random() * ERROR_RESPONSES.length);
  return ERROR_RESPONSES[randomIndex];
}