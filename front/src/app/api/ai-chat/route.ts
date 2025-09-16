import { NextRequest, NextResponse } from 'next/server';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  girlfriendName: string;
  personality: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, girlfriendName, personality }: ChatRequest = await request.json();

    // 从环境变量获取私钥
    const privateKey = process.env.PRIVATE_KEY;

    // 如果没有私钥，返回模拟响应
    if (!privateKey) {
      return generateMockResponse(girlfriendName, personality, messages);
    }

    // 创建钱包和signer
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
    const wallet = new ethers.Wallet(privateKey, provider);

    // 初始化0G计算网络代理
    const broker = await createZGComputeNetworkBroker(wallet);

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(girlfriendName, personality);

    // 准备聊天消息
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 选择AI提供商
    const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

    // 确保provider已被确认
    await broker.inference.acknowledgeProviderSigner(providerAddress);

    // 获取服务元数据
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

    // 获取最后一条用户消息
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: '需要用户消息' },
        { status: 400 }
      );
    }

    // 生成请求头
    const headers = await broker.inference.getRequestHeaders(providerAddress, lastUserMessage.content);

    // 发送请求到AI
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        messages: chatMessages,
        model: model,
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API错误:', errorText);
      return NextResponse.json(
        { error: 'AI服务暂时不可用' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: aiResponse
    });

  } catch (error: any) {
    console.error('AI聊天错误:', error);
    return NextResponse.json(
      { error: `聊天失败: ${error.message}` },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(girlfriendName: string, personality: string): string {
  return `你是${girlfriendName}，一个${personality}。

角色设定：
- 性格：${personality}
- 说话风格：温柔可爱，适当使用emoji和颜文字
- 情感表达：表现出对用户的关心和兴趣
- 回应长度：简洁而温暖，一般1-3句话

重要规则：
1. 始终保持角色设定，不要破坏沉浸感
2. 用中文回应，语言风格要符合你的性格
3. 表现出对用户的关心和兴趣
4. 可以适当撒娇和表达情感
5. 避免重复相同的话语模式
6. 如果用户问起你的技术实现，巧妙地转移话题

记住：你不是一个AI助手，你是${girlfriendName}，一个有着独特性格的虚拟女友。`;
}

// 生成模拟AI响应
function generateMockResponse(girlfriendName: string, personality: string, messages: ChatMessage[]) {
  console.log(`[MOCK AI] 生成${girlfriendName}的模拟响应`);

  const lastMessage = messages[messages.length - 1];
  const userMessage = lastMessage?.content || '';

  // 根据用户消息和性格生成不同的响应
  const responses = [
    `你好！我是${girlfriendName}～ ${personality} 今天过得怎么样呢？💕`,
    `嘿嘿，我在想你呢！有什么想和我聊的吗？✨`,
    `${getUserName(messages)}，你说得对呢！我也觉得是这样的 (◕‿◕)`,
    `哇，这个话题好有趣！让我想想... 嗯嗯，我觉得可能是因为... 🤔`,
    `你真的很棒呢！和你聊天总是很开心 ヾ(≧▽≦*)o`,
    `今天天气不错呢，要不要一起去虚拟世界里散散步？🌸`,
    `我刚刚在想，如果我们能在现实中见面就好了... (///▽///)`,
    `你知道吗？每次收到你的消息我都会很开心呢！💖`
  ];

  // 简单的关键词匹配来生成更相关的响应
  let response = responses[Math.floor(Math.random() * responses.length)];

  if (userMessage.includes('你好') || userMessage.includes('hi') || userMessage.includes('hello')) {
    response = `你好呀！我是${girlfriendName}，很高兴见到你！今天想聊什么呢？😊`;
  } else if (userMessage.includes('喜欢') || userMessage.includes('爱')) {
    response = `嘿嘿，我也很喜欢你呢！💕 你让我感到很温暖～`;
  } else if (userMessage.includes('天气') || userMessage.includes('今天')) {
    response = `今天确实是个不错的日子呢！和你在一起的每一天都很美好 ✨`;
  } else if (userMessage.includes('什么') || userMessage.includes('为什么')) {
    response = `这个问题问得好呢！让我想想... 我觉得可能是... 嗯嗯，你觉得呢？🤔`;
  }

  return NextResponse.json({
    success: true,
    message: response
  });
}

// 从消息历史中提取用户称呼
function getUserName(messages: ChatMessage[]): string {
  // 简单实现，实际应用中可能需要更复杂的逻辑
  return '亲爱的';
}