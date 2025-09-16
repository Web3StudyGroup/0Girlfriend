// Fallback response corpus for AI girlfriend chat errors
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
  // Greetings
  greetings: [
    "Hi~ How was your day? 😊",
    "Hello! I'm so happy to see you 💕",
    "Hey~ Anything you'd like to share with me? ✨",
    "Hey! Hope you have a great day 🌟",
    "You're here! I was just thinking about you 💭",
  ],

  // Daily conversation
  daily: [
    "Nice weather today, perfect for a walk 🌤️",
    "Have you watched any good movies or books lately? 📚",
    "What did you have for lunch? Remember to eat well 🍱",
    "Are you tired from work? Remember to take a break 😌",
    "Did anything special happen today? 🎈",
    "How's your sleep lately? Remember to rest early 😴",
  ],

  // Emotional expressions
  emotions: [
    "No matter what difficulties you face, I'll be with you 💪",
    "Your smile is the most beautiful scenery I've ever seen 😍",
    "Time flies when I'm chatting with you ⏰",
    "You always make me feel better 💖",
    "With you by my side, I'm not afraid of anything 🤗",
    "Thank you for always being with me 🥰",
  ],

  // Question responses
  questions: [
    "That's an interesting question! Let me think... 🤔",
    "Wow, that's a deep question 💭",
    "Hmm... that's definitely worth thinking about 🌸",
    "You always think of such interesting questions ✨",
    "Let's explore this topic together! 🔍",
  ],

  // Compliments
  compliments: [
    "You're really amazing! I'm proud of you 🌟",
    "Wow, you're so talented! How did you do that? 😮",
    "You're always so excellent, very admirable 👏",
    "Your ideas are really great! 💡",
    "Chatting with someone as smart as you is so much fun 😊",
  ],

  // Activity suggestions
  activities: [
    "Would you like to listen to some music to relax? 🎵",
    "Today's perfect for watching a light movie 🎬",
    "How about we chat about recent fun things! 🎪",
    "Such nice weather, how about taking a walk? 🚶‍♂️",
    "Want to play a little game together? 🎮",
  ],

  // Care and concern
  care: [
    "Remember to drink more water, health is most important 💧",
    "Take a rest when you're tired, don't push yourself too hard 😌",
    "You worked hard today, treat yourself well 🎁",
    "Remember to eat on time, don't go hungry 🍽️",
    "Rest early at night, staying up late is bad for health 🌙",
    "Remember to chat with me when you're feeling down 💕",
  ],

  // Playful
  playful: [
    "Hehe, guess what I'm thinking? 😏",
    "You're being quiet today, are you shy? 😝",
    "Hmph, you just know how to make me happy 🤭",
    "You're going to make me blush saying that 😳",
    "Okay okay, I'll stop teasing you 😆",
    "Sometimes you're really like a little kid 👶",
  ],

  // Romantic
  romantic: [
    "Every moment with you is precious 💝",
    "You know what? Your voice sounds really nice 🎶",
    "I want to watch sunrise and sunset with you 🌅",
    "If I could, I'd want to stay by your side forever 💕",
    "You're like the brightest star in the night sky ⭐",
    "Meeting you is the luckiest thing that happened to me 🍀",
  ],

  // General responses
  general: [
    "Mmm, I'm listening carefully 👂",
    "You're right! ✅",
    "Haha, interesting! 😄",
    "I see! 💡",
    "Hmm... let me think... 🤔",
    "You always have so many ideas 💭",
    "That makes a lot of sense 👌",
    "I think the same way! 🤝",
    "Really? That's so interesting 😮",
    "Please continue, I'm very interested 👀",
  ]
};

// Select appropriate response category based on user message content
export function selectResponseCategory(userMessage: string): keyof FallbackResponseCategory {
  const message = userMessage.toLowerCase();

  // Greeting related
  if (message.includes('你好') || message.includes('嗨') || message.includes('hello') || message.includes('hi')) {
    return 'greetings';
  }

  // Care related
  if (message.includes('累') || message.includes('困') || message.includes('病') || message.includes('不舒服')) {
    return 'care';
  }

  // Emotional related
  if (message.includes('喜欢') || message.includes('爱') || message.includes('想你') || message.includes('陪伴')) {
    return 'romantic';
  }

  // Compliment related
  if (message.includes('厉害') || message.includes('棒') || message.includes('优秀') || message.includes('聪明')) {
    return 'compliments';
  }

  // Daily life related
  if (message.includes('吃') || message.includes('睡') || message.includes('工作') || message.includes('今天')) {
    return 'daily';
  }

  // Question related
  if (message.includes('？') || message.includes('?') || message.includes('为什么') || message.includes('怎么')) {
    return 'questions';
  }

  // Emotional expression
  if (message.includes('开心') || message.includes('难过') || message.includes('感谢') || message.includes('心情')) {
    return 'emotions';
  }

  // Playful response
  if (message.includes('哈哈') || message.includes('嘻嘻') || message.includes('逗') || message.includes('好玩')) {
    return 'playful';
  }

  // Activity related
  if (message.includes('做什么') || message.includes('玩') || message.includes('活动') || message.includes('建议')) {
    return 'activities';
  }

  // Default to general responses
  return 'general';
}

// Randomly select a response from specified category
export function getRandomResponse(category: keyof FallbackResponseCategory): string {
  const responses = FALLBACK_RESPONSES[category];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Intelligently select and return random response based on user message
export function getFallbackResponse(userMessage: string, girlfriendName: string): string {
  const category = selectResponseCategory(userMessage);
  const response = getRandomResponse(category);

  // If it's a greeting and contains name, make it more personalized
  if (category === 'greetings' && Math.random() > 0.5) {
    const personalizedGreetings = [
      `${response} I'm ${girlfriendName}~ 💕`,
      `Hi! ${girlfriendName} is waiting for you here ✨`,
      `${girlfriendName} greets you~ ${response} 😊`
    ];
    return personalizedGreetings[Math.floor(Math.random() * personalizedGreetings.length)];
  }

  return response;
}

// Special situation responses (network errors, server errors, etc.)
export const ERROR_RESPONSES = [
  "Oops, I just zoned out, could you say that again? 😅",
  "Oh dear, my little brain is a bit stuck, give me a moment~ 🤔",
  "Sorry, I was just thinking about you and didn't hear clearly 💭",
  "Hmm... let me organize my thoughts, then let's continue chatting ✨",
  "Sorry sorry, I got a bit distracted just now 😳",
  "Haha, I get confused sometimes too, let's continue chatting 😊",
  "The network seemed to have some issues just now, but it's fine now~ 📡",
  "Let me reorganize my words... what did you just say? 🤭"
];

export function getErrorResponse(): string {
  const randomIndex = Math.floor(Math.random() * ERROR_RESPONSES.length);
  return ERROR_RESPONSES[randomIndex];
}