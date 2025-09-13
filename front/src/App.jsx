import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import MintGirlfriend from './components/MintGirlfriend';
import GirlfriendGallery from './components/GirlfriendGallery';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('gallery');
  const [selectedGirlfriend, setSelectedGirlfriend] = useState(null);
  const { address, isConnected } = useAccount();

  const renderContent = () => {
    switch (currentView) {
      case 'mint':
        return <MintGirlfriend onMinted={() => setCurrentView('gallery')} />;
      case 'chat':
        return (
          <ChatInterface
            girlfriend={selectedGirlfriend}
            onBack={() => setCurrentView('gallery')}
          />
        );
      case 'gallery':
      default:
        return (
          <GirlfriendGallery
            onSelectGirlfriend={(gf) => {
              setSelectedGirlfriend(gf);
              setCurrentView('chat');
            }}
          />
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖💕 0Girlfriend</h1>
        <p>用iNFT创造你的AI女友，在0G网络上永久存储和聊天</p>

        <div className="header-controls">
          <nav className="nav-buttons">
            <button
              className={currentView === 'gallery' ? 'active' : ''}
              onClick={() => setCurrentView('gallery')}
            >
              🏠 首页展示
            </button>

            {isConnected && (
              <button
                className={currentView === 'mint' ? 'active' : ''}
                onClick={() => setCurrentView('mint')}
              >
                ✨ Mint AI女友
              </button>
            )}
          </nav>

          <ConnectButton />
        </div>
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="welcome-screen">
            <h2>欢迎来到 AI 0Girlfriend 平台</h2>
            <p>🎯 功能特色：</p>
            <ul>
              <li>💰 只需 0.01 $OG 即可 Mint 专属AI女友</li>
              <li>🖼️ 上传本地照片，设定个性化性格</li>
              <li>🔒 图片和性格数据安全存储在0G Storage</li>
              <li>💬 使用0G AI功能与女友聊天</li>
              <li>🌍 所有AI女友公开展示，任何人都可付费聊天</li>
            </ul>
            <p>请先连接钱包开始使用</p>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      <footer className="app-footer">
        <p>
          Powered by <strong>0G Network</strong> •
          Built with <strong>iNFT</strong> •
          地址: {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
        </p>
      </footer>
    </div>
  );
}

export default App
