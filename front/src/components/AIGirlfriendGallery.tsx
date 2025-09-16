'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet';
import ChatInterface from './ChatInterface';

interface AIGirlfriend {
  tokenId: string;
  name: string;
  imageHash: string;
  creator: string;
  totalChats: number;
  isPublic: boolean;
  createdAt?: number;
}


export default function AIGirlfriendGallery() {
  const { address } = useWallet();
  const [girlfriends, setGirlfriends] = useState<AIGirlfriend[]>([]);
  const [myGirlfriends, setMyGirlfriends] = useState<AIGirlfriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedGirlfriend, setSelectedGirlfriend] = useState<AIGirlfriend | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    loadGirlfriends();
  }, [address]);

  const loadGirlfriends = async () => {
    try {
      setLoading(true);

      // 加载所有公开的AI女友
      const { getAllPublicGirlfriends, getUserCreatedGirlfriends } = await import('@/lib/contract-utils');

      const publicGirlfriends = await getAllPublicGirlfriends();
      setGirlfriends(publicGirlfriends);

      // 如果用户已连接，加载用户创建的AI女友
      if (address) {
        const userGirlfriends = await getUserCreatedGirlfriends(address);
        setMyGirlfriends(userGirlfriends);
      }

    } catch (error) {
      console.error('Failed to load girlfriends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedGirlfriends = (girlfriendsList: AIGirlfriend[]) => {
    const sorted = [...girlfriendsList];
    if (sortBy === 'newest') {
      return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      return sorted.sort((a, b) => b.totalChats - a.totalChats);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getImageUrl = (imageHash: string) => {
    // 如果是0G存储的hash，构建访问URL
    // 这里需要根据实际的0G存储访问方式来调整
    return `/api/download?hash=${imageHash}`;
  };

  if (selectedGirlfriend) {
    return (
      <ChatInterface
        girlfriend={selectedGirlfriend}
        onBack={() => setSelectedGirlfriend(null)}
      />
    );
  }

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    height: '280px',
    display: 'flex',
    flexDirection: 'column'
  };

  const cardHoverStyle: React.CSSProperties = {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: isActive ? '#e91e63' : 'transparent',
    color: isActive ? 'white' : '#666',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : 'normal'
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '3rem',
        fontSize: '2.5rem',
        background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        💖 AI女友世界
      </h1>

      {/* 导航标签 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        backgroundColor: '#f8f9fa',
        padding: '0.5rem',
        borderRadius: '30px',
        width: 'fit-content',
        margin: '0 auto 2rem auto'
      }}>
        <button
          onClick={() => setActiveTab('all')}
          style={tabStyle(activeTab === 'all')}
        >
          🌟 所有女友 ({girlfriends.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          style={tabStyle(activeTab === 'my')}
        >
          💕 我的女友 ({myGirlfriends.length})
        </button>
      </div>

      {/* 排序控制 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {activeTab === 'all'
            ? `发现 ${girlfriends.length} 个AI女友`
            : `你创建了 ${myGirlfriends.length} 个AI女友`
          }
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSortBy('newest')}
            style={{
              ...tabStyle(sortBy === 'newest'),
              padding: '0.5rem 1rem',
              fontSize: '0.8rem'
            }}
          >
            最新创建
          </button>
          <button
            onClick={() => setSortBy('popular')}
            style={{
              ...tabStyle(sortBy === 'popular'),
              padding: '0.5rem 1rem',
              fontSize: '0.8rem'
            }}
          >
            最受欢迎
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #e91e63',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666' }}>加载中...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {getSortedGirlfriends(activeTab === 'all' ? girlfriends : myGirlfriends).map((girlfriend) => (
            <div
              key={girlfriend.tokenId}
              style={cardStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cardStyle);
              }}
              onClick={() => setSelectedGirlfriend(girlfriend)}
            >
              {/* 头像区域 */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#e91e63',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                backgroundImage: girlfriend.imageHash ? `url(${getImageUrl(girlfriend.imageHash)})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {!girlfriend.imageHash && girlfriend.name[0]}
              </div>

              {/* 基本信息 */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.2rem',
                  color: '#333'
                }}>
                  {girlfriend.name}
                </h3>

                <p style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.8rem',
                  color: '#999'
                }}>
                  创建者: {formatAddress(girlfriend.creator)}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e91e63' }}>
                      {girlfriend.totalChats}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>对话数</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', color: girlfriend.isPublic ? '#28a745' : '#dc3545' }}>
                      {girlfriend.isPublic ? '🌐' : '🔒'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>
                      {girlfriend.isPublic ? '公开' : '私人'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部按钮区域 */}
              <div style={{ marginTop: 'auto' }}>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#e91e63',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  💬 开始聊天
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'all' && girlfriends.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
          <p>还没有公开的AI女友</p>
          <p style={{ fontSize: '0.9rem' }}>成为第一个创建AI女友的人吧！</p>
        </div>
      )}

      {!loading && activeTab === 'my' && myGirlfriends.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💕</div>
          <p>你还没有创建AI女友</p>
          <p style={{ fontSize: '0.9rem' }}>去创建你的第一个专属AI女友吧！</p>
        </div>
      )}
    </div>
  );
}