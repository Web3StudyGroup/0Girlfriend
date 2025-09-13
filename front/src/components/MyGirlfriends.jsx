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
    if (!address || !isConnected) {
      setLoading(false);
      return;
    }

    if (userGirlfriends && !isLoading) {
      loadMyGirlfriendDetails(userGirlfriends);
    } else if (!isLoading && !userGirlfriends) {
      // 合约调用完成但没有数据
      setMyGirlfriends([]);
      setLoading(false);
    }
  }, [userGirlfriends, isLoading, address, isConnected]);

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
    try {
      // 使用 wagmi 的 readContract 调用合约
      const { readContract } = await import('wagmi/actions');
      const { http } = await import('viem');
      const { createConfig } = await import('wagmi');

      // 临时创建config
      const tempConfig = createConfig({
        chains: [{
          id: 16601,
          name: '0G-Galileo-Testnet',
          nativeCurrency: { name: '0G', symbol: 'OG', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://evmrpc-testnet.0g.ai'] },
          },
        }],
        transports: {
          16601: http('https://evmrpc-testnet.0g.ai'),
        },
      });

      const details = await readContract(tempConfig, {
        address: import.meta.env.VITE_CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: 'getGirlfriendDetails',
        args: [tokenId]
      });

      return {
        name: details.name,
        personality: details.encryptedURI, // 临时显示，实际应该解密
        imageHash: details.imageHash,
        creator: details.creator,
        totalChats: Number(details.totalChats),
        isPublic: details.isPublic,
        createdAt: Number(details.createdAt) * 1000, // 转换为毫秒
        earnings: (Number(details.totalChats) * 0.009).toFixed(3) // 计算收益: totalChats * 0.009 OG
      };
    } catch (error) {
      console.error(`获取女友 ${tokenId} 详情失败:`, error);
      return {
        name: `AI女友 #${tokenId}`,
        personality: '加载失败',
        imageHash: '',
        creator: address,
        totalChats: 0,
        isPublic: true,
        createdAt: Date.now(),
        earnings: '0.000'
      };
    }
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