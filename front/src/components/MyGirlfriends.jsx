import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import contractABI from '../contracts/AIGirlfriendINFT.json';

const MyGirlfriends = ({ onSelectGirlfriend }) => {
  const [myGirlfriends, setMyGirlfriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  // 获取用户创建的AI女友
  const { data: userGirlfriends, isError, isLoading } = useReadContract({
    address: import.meta.env.VITE_CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: 'getUserCreatedGirlfriends',
    args: [address],
    enabled: !!address && isConnected,
  });

  useEffect(() => {
    if (userGirlfriends && !isLoading && address) {
      loadMyGirlfriendDetails(userGirlfriends);
    }
  }, [userGirlfriends, isLoading, address]);

  const loadMyGirlfriendDetails = async (tokenIds) => {
    setLoading(true);
    try {
      const details = await Promise.all(
        tokenIds.map(async (tokenId) => {
          // 获取女友详情
          const girlfriend = await getGirlfriendDetails(tokenId);
          return {
            tokenId: tokenId.toString(),
            ...girlfriend
          };
        })
      );
      setMyGirlfriends(details);
    } catch (error) {
      console.error('加载我的AI女友详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGirlfriendDetails = async (tokenId) => {
    // 这里应该调用合约获取详情
    // 暂时返回模拟数据
    return {
      name: `我的AI女友 #${tokenId}`,
      personality: '温柔，聪明，幽默',
      imageHash: 'QmXXXXXX',
      creator: address,
      totalChats: Math.floor(Math.random() * 100),
      isPublic: true,
      createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000, // 随机30天内
      earnings: (Math.random() * 0.5).toFixed(3) // 随机收益
    };
  };

  const handleChatClick = (girlfriend) => {
    onSelectGirlfriend(girlfriend);
  };

  const handleTogglePublic = async (tokenId, currentStatus) => {
    // TODO: 实现公开/私有状态切换
    console.log(`切换 tokenId ${tokenId} 的公开状态，当前状态: ${currentStatus}`);
  };

  if (!isConnected) {
    return (
      <div className="my-girlfriends-not-connected">
        <h2>🔐 请先连接钱包</h2>
        <p>连接钱包以查看你创建的AI女友</p>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="my-girlfriends-loading">
        <h2>🔄 正在加载你的AI女友...</h2>
        <p>从0G网络获取数据中</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="my-girlfriends-error">
        <h2>❌ 加载失败</h2>
        <p>无法从0G网络获取你的AI女友数据</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className="my-girlfriends">
      <h2>👑 我的AI女友</h2>
      <p>管理你创建的AI女友，查看收益和聊天统计</p>

      {myGirlfriends.length === 0 ? (
        <div className="empty-my-girlfriends">
          <h3>🌟 你还没有创建任何AI女友</h3>
          <p>点击"Mint AI女友"开始创建你的第一个AI女友吧！</p>
        </div>
      ) : (
        <div className="my-girlfriends-grid">
          {myGirlfriends.map((girlfriend) => (
            <div key={girlfriend.tokenId} className="my-girlfriend-card">
              <div className="girlfriend-image">
                {girlfriend.imageHash ? (
                  <img
                    src={`https://gateway.0g.ai/${girlfriend.imageHash}`}
                    alt={girlfriend.name}
                    onError={(e) => {
                      e.target.src = '/placeholder-avatar.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-image">
                    👩‍🦰
                  </div>
                )}
                <div className="owner-badge">👑 我的创作</div>
              </div>

              <div className="girlfriend-info">
                <h3>{girlfriend.name}</h3>
                <p className="personality">{girlfriend.personality}</p>

                <div className="girlfriend-stats">
                  <div className="stat-row">
                    <span className="stat-label">💬 聊天次数:</span>
                    <span className="stat-value">{girlfriend.totalChats}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">💰 累计收益:</span>
                    <span className="stat-value">{girlfriend.earnings} $OG</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">📅 创建时间:</span>
                    <span className="stat-value">
                      {new Date(girlfriend.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">🌍 公开状态:</span>
                    <span className={`status-badge ${girlfriend.isPublic ? 'public' : 'private'}`}>
                      {girlfriend.isPublic ? '公开' : '私有'}
                    </span>
                  </div>
                </div>

                <div className="girlfriend-actions">
                  <button
                    className="chat-button"
                    onClick={() => handleChatClick(girlfriend)}
                  >
                    💬 开始聊天
                  </button>

                  <button
                    className="toggle-public-button"
                    onClick={() => handleTogglePublic(girlfriend.tokenId, girlfriend.isPublic)}
                  >
                    {girlfriend.isPublic ? '🔒 设为私有' : '🌍 设为公开'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="my-girlfriends-summary">
        <div className="summary-card">
          <h3>📊 统计概览</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="summary-label">创建数量:</span>
              <span className="summary-value">{myGirlfriends.length}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">总聊天次数:</span>
              <span className="summary-value">
                {myGirlfriends.reduce((sum, gf) => sum + gf.totalChats, 0)}
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">总收益:</span>
              <span className="summary-value">
                {myGirlfriends.reduce((sum, gf) => sum + parseFloat(gf.earnings || 0), 0).toFixed(3)} $OG
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">公开数量:</span>
              <span className="summary-value">
                {myGirlfriends.filter(gf => gf.isPublic).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-girlfriends-tips">
        <h4>💡 管理技巧</h4>
        <ul>
          <li>设为公开的AI女友可以被其他用户发现和聊天</li>
          <li>每次其他用户聊天，你将获得 90% 的收益 (0.009 $OG)</li>
          <li>私有的AI女友只有你可以聊天</li>
          <li>你可以随时切换公开/私有状态</li>
        </ul>
      </div>
    </div>
  );
};

export default MyGirlfriends;