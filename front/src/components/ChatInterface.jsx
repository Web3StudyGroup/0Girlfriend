import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import ZGAIService from '../utils/0g-ai';
import contractABI from '../contracts/AIGirlfriendINFT.json';

// CLAUDE.md要求4: 可以跟ai女友聊天，用0g的ai功能
// CLAUDE.md要求5: 任何人都可以花费0.01$0g，去永久聊天
const ChatInterface = ({ girlfriend, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [payingForAccess, setPayingForAccess] = useState(false);
  const messagesEndRef = useRef(null);

  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const zgAI = new ZGAIService();

  useEffect(() => {
    // 检查用户是否有聊天权限
    checkChatAccess();
    // 初始化对话
    if (hasAccess) {
      initializeChat();
    }
  }, [girlfriend, hasAccess, isConfirmed]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkChatAccess = async () => {
    if (!girlfriend || !address) return;

    // 检查是否是创作者（免费聊天）
    if (girlfriend.creator.toLowerCase() === address.toLowerCase()) {
      setHasAccess(true);
      return;
    }

    // 检查是否已经付费
    try {
      // 这里应该调用合约检查用户是否已经为此女友付过费
      // const chatCount = await getUserChatCount(girlfriend.tokenId, address);
      // setHasAccess(chatCount > 0);

      // 暂时设置为false，需要付费
      setHasAccess(false);
    } catch (error) {
      console.error('检查聊天权限失败:', error);
      setHasAccess(false);
    }
  };

  const handlePayForChat = async () => {
    setPayingForAccess(true);

    try {
      // CLAUDE.md要求5: 花费0.01$0g，去永久聊天
      writeContract({
        address: import.meta.env.VITE_CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: 'startChatSession',
        args: [girlfriend.tokenId],
        value: parseEther('0.01') // 0.01 $OG
      });
    } catch (error) {
      console.error('支付聊天费用失败:', error);
      setPayingForAccess(false);
    }
  };

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      sender: 'ai',
      content: `你好！我是${girlfriend.name}。${girlfriend.personality}。很高兴认识你！有什么想聊的吗？`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !hasAccess) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // CLAUDE.md要求4: 用0g的ai功能
      const aiResponse = await zgAI.chat({
        girlfriendData: {
          name: girlfriend.name,
          personality: girlfriend.personality,
          conversationHistory: messages
        },
        userMessage: inputMessage,
        userAddress: address
      });

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI聊天失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!girlfriend) {
    return (
      <div className="chat-error">
        <h2>❌ 无法加载AI女友信息</h2>
        <button onClick={onBack}>返回首页</button>
      </div>
    );
  }

  // 如果没有聊天权限，显示付费页面
  if (!hasAccess) {
    return (
      <div className="chat-payment">
        <div className="girlfriend-profile">
          <div className="profile-image">
            {girlfriend.imageHash ? (
              <img
                src={`https://gateway.0g.ai/${girlfriend.imageHash}`}
                alt={girlfriend.name}
                onError={(e) => {
                  e.target.src = '/placeholder-avatar.png';
                }}
              />
            ) : (
              <div className="placeholder-image">👩‍🦰</div>
            )}
          </div>
          <h2>{girlfriend.name}</h2>
          <p>{girlfriend.personality}</p>
        </div>

        <div className="payment-info">
          <h3>💬 开始聊天</h3>
          <p>与 {girlfriend.name} 聊天需要支付 0.01 $OG</p>
          <p>一次付费，永久聊天！</p>

          <div className="payment-benefits">
            <h4>✨ 聊天特权：</h4>
            <ul>
              <li>🤖 基于0G AI的智能对话</li>
              <li>💾 聊天记录永久保存在0G存储</li>
              <li>🔒 隐私保护，安全聊天</li>
              <li>🎭 个性化AI女友体验</li>
            </ul>
          </div>

          <button
            className="pay-button"
            onClick={handlePayForChat}
            disabled={payingForAccess || isPending || isConfirming}
          >
            {payingForAccess || isPending ? '支付中...' : isConfirming ? '确认中...' : '支付 0.01 $OG 开始聊天'}
          </button>

          <button className="back-button" onClick={onBack}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>

        <div className="girlfriend-info">
          <div className="avatar">
            {girlfriend.imageHash ? (
              <img
                src={`https://gateway.0g.ai/${girlfriend.imageHash}`}
                alt={girlfriend.name}
                onError={(e) => {
                  e.target.src = '/placeholder-avatar.png';
                }}
              />
            ) : (
              <div className="placeholder-avatar">👩‍🦰</div>
            )}
          </div>
          <div className="info">
            <h3>{girlfriend.name}</h3>
            <p>{girlfriend.personality}</p>
          </div>
        </div>

        <div className="chat-status">
          {girlfriend.creator.toLowerCase() === address?.toLowerCase() ? (
            <span className="owner-badge">👑 你的AI女友</span>
          ) : (
            <span className="paid-badge">💎 永久聊天</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message ai-message typing">
            <div className="message-content">
              {girlfriend.name} 正在输入...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`与 ${girlfriend.name} 聊天...`}
          disabled={isTyping}
          rows={2}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isTyping}
          className="send-button"
        >
          发送
        </button>
      </div>

      <div className="chat-footer">
        <p>💡 使用0G AI技术提供的智能对话体验</p>
      </div>
    </div>
  );
};

export default ChatInterface;