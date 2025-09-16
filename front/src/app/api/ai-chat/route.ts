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
  privateKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, girlfriendName, personality, privateKey }: ChatRequest = await request.json();

    if (!privateKey) {
      return NextResponse.json(
        { error: '需要私钥来调用AI服务' },
        { status: 400 }
      );
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