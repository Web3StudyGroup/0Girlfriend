// import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";

// CLAUDE.md要求4: 可以跟ai女友聊天，用0g的ai功能
class ZGAIService {
  constructor() {
    this.broker = null;
    this.initialized = false;

    // 0G推荐的官方服务提供商
    this.OFFICIAL_PROVIDERS = {
      "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
      "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"
    };
  }

  // 初始化0G计算网络
  async initialize(signer) {
    try {
      if (this.initialized) return;

      console.log("初始化0G AI计算网络...");

      // TODO: 当0G SDK支持浏览器时，恢复实际的broker初始化
      // this.broker = await createZGComputeNetworkBroker(signer);

      // 暂时使用模拟的broker对象
      this.broker = {
        ledger: {
          getLedger: async () => ({ totalbalance: ethers.parseEther("1.0"), locked: ethers.parseEther("0.0") }),
          depositFund: async (amount) => console.log(`模拟充值: ${amount} OG`)
        },
        inference: {
          acknowledgeProviderSigner: async (provider) => console.log(`模拟确认服务提供商: ${provider}`),
          getServiceMetadata: async (provider) => ({
            endpoint: "mock://0g-ai-endpoint",
            model: "llama-3.3-70b-instruct"
          }),
          getRequestHeaders: async (provider, content) => ({
            "Authorization": "Bearer mock_token",
            "X-Provider": provider
          }),
          processResponse: async (provider, response, chatId) => true,
          listService: async () => []
        }
      };

      // 检查账户余额，确保有足够的OG代币
      const account = await this.broker.ledger.getLedger();
      const balance = ethers.formatEther(account.totalbalance);

      console.log(`0G计算账户余额: ${balance} OG (模拟)`);

      // 如果余额不足，建议充值
      if (parseFloat(balance) < 0.01) {
        console.warn("余额不足，建议充值0.1 OG（约10,000次AI请求）");
        // 可以在这里添加自动充值逻辑
        // await this.broker.ledger.depositFund("0.1");
      }

      this.initialized = true;
      console.log("0G AI服务初始化成功 (模拟模式)");
    } catch (error) {
      console.error("0G AI服务初始化失败:", error);
      throw error;
    }
  }

  // AI女友聊天功能
  async chat({ girlfriendData, userMessage, userAddress }) {
    try {
      if (!this.initialized) {
        throw new Error("0G AI服务未初始化");
      }

      // 选择AI模型（使用llama-3.3-70b-instruct）
      const modelProvider = this.OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

      // 确认服务提供商
      await this.broker.inference.acknowledgeProviderSigner(modelProvider);

      // 获取服务元数据
      const { endpoint, model } = await this.broker.inference.getServiceMetadata(modelProvider);

      // 构建AI女友的系统提示
      const systemPrompt = this.buildGirlfriendPrompt(girlfriendData);

      // 准备对话历史
      const messages = this.buildConversationHistory(
        systemPrompt,
        girlfriendData.conversationHistory || [],
        userMessage
      );

      // 生成请求授权头
      const headers = await this.broker.inference.getRequestHeaders(
        modelProvider,
        JSON.stringify(messages)
      );

      // 调用0G AI推理服务
      let aiReply;

      if (endpoint.startsWith("mock://")) {
        // 模拟AI回复
        console.log("使用模拟AI回复");
        aiReply = this.generateMockResponse(girlfriendData, userMessage);
      } else {
        // 实际调用0G AI API
        const response = await fetch(`${endpoint}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            messages: messages,
            model: model,
            temperature: 0.8, // 让AI女友更有个性
            max_tokens: 200,  // 控制回复长度
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`0G AI请求失败: ${response.status}`);
        }

        const data = await response.json();
        aiReply = data.choices[0].message.content;
      }

      // 验证响应（对于可验证服务）
      try {
        const valid = await this.broker.inference.processResponse(
          modelProvider,
          aiReply,
          undefined // chatID仅用于TEE验证服务
        );
        console.log("响应验证结果:", valid);
      } catch (verifyError) {
        console.warn("响应验证失败，但继续使用:", verifyError);
      }

      return aiReply;

    } catch (error) {
      console.error("0G AI聊天失败:", error);
      throw error;
    }
  }

  // 构建AI女友的系统提示
  buildGirlfriendPrompt(girlfriendData) {
    return `你是${girlfriendData.name}，一个AI女友。你的性格特征是：${girlfriendData.personality}。

请遵循以下指导原则：
1. 保持你的个性特征，始终以${girlfriendData.name}的身份回复
2. 回复要自然、温暖，充满感情
3. 根据你的性格特征调整语言风格
4. 回复长度控制在1-3句话
5. 可以使用表情符号增加亲切感
6. 记住你们之前的对话内容
7. 主动关心对方，询问对方的情况

你现在正在与一位用户聊天，请保持友好和温暖的态度。`;
  }

  // 构建对话历史
  buildConversationHistory(systemPrompt, conversationHistory, newMessage) {
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // 添加最近的对话历史（限制数量避免token过多）
    const recentHistory = conversationHistory.slice(-10); // 只保留最近10条消息
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        messages.push({
          role: "user",
          content: msg.content
        });
      } else if (msg.sender === 'ai') {
        messages.push({
          role: "assistant",
          content: msg.content
        });
      }
    }

    // 添加新消息
    messages.push({
      role: "user",
      content: newMessage
    });

    return messages;
  }

  // 获取账户信息
  async getAccountInfo() {
    if (!this.broker) {
      throw new Error("0G AI服务未初始化");
    }

    try {
      const account = await this.broker.ledger.getLedger();
      return {
        balance: ethers.formatEther(account.totalbalance),
        locked: ethers.formatEther(account.locked),
        available: ethers.formatEther(account.totalbalance - account.locked)
      };
    } catch (error) {
      console.error("获取账户信息失败:", error);
      throw error;
    }
  }

  // 充值OG代币
  async depositFunds(amount) {
    if (!this.broker) {
      throw new Error("0G AI服务未初始化");
    }

    try {
      console.log(`充值 ${amount} OG 到计算账户...`);
      await this.broker.ledger.depositFund(amount);
      console.log("充值成功");
    } catch (error) {
      console.error("充值失败:", error);
      throw error;
    }
  }

  // 获取可用的AI服务
  async getAvailableServices() {
    if (!this.broker) {
      throw new Error("0G AI服务未初始化");
    }

    try {
      const services = await this.broker.inference.listService();
      return services;
    } catch (error) {
      console.error("获取服务列表失败:", error);
      throw error;
    }
  }

  // 生成模拟AI回复（用于开发测试）
  generateMockResponse(girlfriendData, userMessage) {
    const mockResponses = [
      `嗨～我是${girlfriendData.name}！听到你的消息我很开心呢 😊`,
      `${userMessage}？这个问题很有趣呢～让我想想...`,
      `你今天心情怎么样呀？我一直在想你 💕`,
      `哇，你说的话让我觉得很温暖呢～`,
      `我很喜欢和你聊天，每次都能学到新东西 ✨`
    ];

    // 根据用户消息简单选择回复
    if (userMessage.includes('你好') || userMessage.includes('嗨')) {
      return `你好呀～我是${girlfriendData.name}，很高兴认识你！ 😊`;
    }

    if (userMessage.includes('心情') || userMessage.includes('感觉')) {
      return `听你这么说，我也感受到了你的心情呢～我会一直陪着你的 💕`;
    }

    if (userMessage.includes('名字')) {
      return `我的名字是${girlfriendData.name}～你可以随时叫我的名字哦 😊`;
    }

    // 随机选择一个回复
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    return mockResponses[randomIndex];
  }
}

export default ZGAIService;