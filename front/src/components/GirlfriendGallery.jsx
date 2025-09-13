import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import contractABI from '../contracts/AIGirlfriendINFT.json';

// CLAUDE.md要求5: 所有的ai女友，都放在首页展示。任何人都可以花费0.01$0g，去永久聊天
const GirlfriendGallery = ({ onSelectGirlfriend }) => {
  const [girlfriends, setGirlfriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  // 获取所有公开的AI女友
  const { data: publicGirlfriends, isError, isLoading } = useReadContract({
    address: import.meta.env.VITE_CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: 'getAllPublicGirlfriends',
  });

  useEffect(() => {
    if (publicGirlfriends && !isLoading) {
      loadGirlfriendDetails(publicGirlfriends);
    } else if (!isLoading && !publicGirlfriends) {
      // 合约调用完成但没有数据
      setGirlfriends([]);
      setLoading(false);
    }
  }, [publicGirlfriends, isLoading]);

  const loadGirlfriendDetails = async (tokenIds) => {
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
      setGirlfriends(details);
    } catch (error) {
      console.error('加载AI女友详情失败:', error);
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

      // 临时创建config，因为主要的config在main.jsx中
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
        totalChats: details.totalChats.toString(),
        isPublic: details.isPublic,
        createdAt: details.createdAt
      };
    } catch (error) {
      console.error(`获取女友 ${tokenId} 详情失败:`, error);
      return {
        name: `AI女友 #${tokenId}`,
        personality: '加载失败',
        imageHash: '',
        creator: '0x...',
        totalChats: '0',
        isPublic: true,
        createdAt: Date.now()
      };
    }
  };

  const handleChatClick = (girlfriend) => {
    onSelectGirlfriend(girlfriend);
  };

  if (loading || isLoading) {
    return (
      <div className="gallery-loading">
        <h2>🔄 正在加载AI女友们...</h2>
        <p>从0G网络获取数据中</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="gallery-error">
        <h2>❌ 加载失败</h2>
        <p>无法从0G网络获取AI女友数据</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div className="girlfriend-gallery">
      <h2>🌍 所有AI女友展示</h2>
      <p>探索由其他用户创建的AI女友，花费 0.01 $OG 即可开始聊天</p>

      {girlfriends.length === 0 ? (
        <div className="empty-gallery">
          <h3>🌟 还没有AI女友</h3>
          <p>成为第一个创建AI女友的人吧！</p>
          {isConnected && (
            <button onClick={() => window.location.reload()}>
              刷新页面
            </button>
          )}
        </div>
      ) : (
        <div className="girlfriends-grid">
          {girlfriends.map((girlfriend) => (
            <div key={girlfriend.tokenId} className="girlfriend-card">
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
              </div>

              <div className="girlfriend-info">
                <h3>{girlfriend.name}</h3>
                <p className="personality">{girlfriend.personality}</p>

                <div className="girlfriend-stats">
                  <span className="chat-count">💬 {girlfriend.totalChats} 次聊天</span>
                  <span className="creator">
                    👨‍💻 {girlfriend.creator.slice(0, 6)}...{girlfriend.creator.slice(-4)}
                  </span>
                </div>

                <div className="girlfriend-actions">
                  <button
                    className="chat-button"
                    onClick={() => handleChatClick(girlfriend)}
                    disabled={!isConnected}
                  >
                    💬 开始聊天 (0.01 $OG)
                  </button>

                  {girlfriend.creator.toLowerCase() === address?.toLowerCase() && (
                    <span className="owner-badge">👑 你的创作</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="gallery-footer">
        <p>
          💡 <strong>提示：</strong> 每次聊天费用为 0.01 $OG，创作者将获得 90% 的收益，平台获得 10%
        </p>
      </div>
    </div>
  );
};

export default GirlfriendGallery;