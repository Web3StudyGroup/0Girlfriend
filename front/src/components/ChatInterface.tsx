'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/lib/wallet';
import { use0GStorage } from '@/lib/storage';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIGirlfriend {
  tokenId: string;
  name: string;
  imageHash: string;
  creator: string;
  totalChats: number;
  isPublic: boolean;
}

interface ChatInterfaceProps {
  girlfriend: AIGirlfriend;
  onBack: () => void;
}



export default function ChatInterface({ girlfriend, onBack }: ChatInterfaceProps) {
  const { address } = useWallet();
  const { downloadKeyValue } = use0GStorage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personalityData, setPersonalityData] = useState<any>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadPersonalityData();
  }, []);

  const loadPersonalityData = async () => {
    try {
      // 暂时使用默认人格数据，实际应该从合约中获取
      const defaultPersonality = {
        name: girlfriend.name,
        personality: '温柔可爱的AI女友',
        preferences: {
          chattingStyle: 'sweet',
          responseLength: 'medium',
          emotionalLevel: 'moderate'
        }
      };
      setPersonalityData(defaultPersonality);
    } catch (error) {
      console.error('Failed to load personality data:', error);
    }
  };

  const startChatSession = async () => {
    if (hasStartedChat) return;

    try {
      setIsLoading(true);

      // 检查钱包连接状态
      if (!address) {
        toast.error('请先连接钱包');
        return;
      }

      // 使用前端合约调用开始聊天会话
      const { startChatSession: contractStartChat } = await import('@/lib/contract-utils');

      // 获取用户的signer
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 显示loading消息
      toast.loading('正在开始聊天会话...', { duration: 2000 });

      const result = await contractStartChat(signer, girlfriend.tokenId);
      console.log('Chat session started:', result);

      setHasStartedChat(true);

      // 显示成功消息
      toast.success('聊天会话开始成功！开始和你的AI女友聊天吧 💕', {
        duration: 3000,
      });

      // 添加欢迎消息
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);

    } catch (error: any) {
      console.error('Failed to start chat session:', error);
      toast.error(`开始聊天失败: ${error.message}`, {
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const personalityDesc = personalityData?.personality || '我是你的AI女友';
    return `你好！我是${girlfriend.name}～ ${personalityDesc} 今天想聊什么呢？💕`;
  };

  const getPlaceholderUrl = () => {
    return `/temp/image.jpg`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !hasStartedChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 构建对话历史
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 添加当前用户消息
      const chatMessages = [
        ...conversationHistory,
        { role: 'user', content: userMessage.content }
      ];

      // 调用后端AI聊天API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          girlfriendName: girlfriend.name,
          personality: personalityData?.personality || '温柔可爱的AI女友'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我现在有点累了，稍后再聊好吗？💭',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const messageStyle: React.CSSProperties = {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem'
  };

  const userMessageStyle: React.CSSProperties = {
    ...messageStyle,
    flexDirection: 'row-reverse'
  };

  const messageContentStyle = (isUser: boolean): React.CSSProperties => ({
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: isUser ? '#007bff' : '#f1f3f4',
    color: isUser ? 'white' : '#333',
    wordBreak: 'break-word',
    fontSize: '0.9rem',
    lineHeight: 1.4
  });

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#e91e63',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.8rem',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          ← 返回
        </button>
        <div style={avatarStyle}>
          <span style={{
            position: 'absolute',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            {girlfriend.name[0]}
          </span>
          <img
            src={getPlaceholderUrl()}
            alt={`${girlfriend.name} placeholder`}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              objectFit: 'contain',
              objectPosition: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              backgroundColor: 'transparent'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0';
            }}
          />
          {girlfriend.imageHash && (
            <img
              src={`/api/download?hash=${girlfriend.imageHash}`}
              alt={girlfriend.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '6px',
                objectFit: 'contain',
                objectPosition: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
                backgroundColor: 'transparent'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />
          )}
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#e91e63' }}>{girlfriend.name}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
            {personalityData?.personality || '温柔可爱的AI女友'}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: '#f8f9fa'
        }}
      >
        {!hasStartedChat ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{...avatarStyle, width: '120px', height: '120px', fontSize: '3rem', margin: '0 auto', borderRadius: '12px'}}>
              <span style={{
                position: 'absolute',
                zIndex: 1,
                pointerEvents: 'none'
              }}>
                {girlfriend.name[0]}
              </span>
              <img
                src={getPlaceholderUrl()}
                alt={`${girlfriend.name} placeholder`}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  backgroundColor: 'transparent'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0';
                }}
              />
              {girlfriend.imageHash && (
                <img
                  src={`/api/download?hash=${girlfriend.imageHash}`}
                  alt={girlfriend.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 3,
                    backgroundColor: 'transparent'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0';
                  }}
                />
              )}
            </div>
            <h3 style={{ color: '#e91e63', marginTop: '1rem' }}>{girlfriend.name}</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              点击开始聊天，与{girlfriend.name}开始对话
            </p>
            <button
              onClick={startChatSession}
              disabled={isLoading || !address}
              style={{
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                opacity: isLoading || !address ? 0.5 : 1
              }}
            >
              {isLoading ? '正在开始...' : '开始聊天 (0.001 $OG)'}
            </button>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={message.role === 'user' ? userMessageStyle : messageStyle}
              >
                <div style={avatarStyle}>
                  {message.role === 'user' ? (address ? address.slice(0, 2) : 'U') : girlfriend.name[0]}
                </div>
                <div>
                  <div style={messageContentStyle(message.role === 'user')}>
                    {message.content}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#999',
                    marginTop: '0.25rem',
                    textAlign: message.role === 'user' ? 'right' : 'left'
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={messageStyle}>
                <div style={avatarStyle}>{girlfriend.name[0]}</div>
                <div style={{
                  ...messageContentStyle(false),
                  fontStyle: 'italic',
                  opacity: 0.7
                }}>
                  正在思考中...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {hasStartedChat && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`给${girlfriend.name}说点什么...`}
              disabled={isLoading}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #ddd',
                borderRadius: '20px',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                maxHeight: '120px',
                minHeight: '44px'
              }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                backgroundColor: '#e91e63',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !inputMessage.trim() || isLoading ? 0.5 : 1
              }}
            >
              💬
            </button>
          </div>
        </div>
      )}
    </div>
  );
}