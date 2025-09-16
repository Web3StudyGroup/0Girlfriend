'use client';

import React, { useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import AIGirlfriendGallery from '@/components/AIGirlfriendGallery';
import MintAIGirlfriend from '@/components/MintAIGirlfriend';

type Page = 'gallery' | 'mint';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('gallery');

  const navButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: isActive ? '#e91e63' : 'transparent',
    color: isActive ? 'white' : '#666',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? '600' : 'normal',
    transition: 'all 0.2s'
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.8rem',
              background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              💝 0GirlfriendNFT
            </h1>

            <nav style={{
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: '#f8f9fa',
              padding: '0.25rem',
              borderRadius: '25px'
            }}>
              <button
                onClick={() => setCurrentPage('gallery')}
                style={navButtonStyle(currentPage === 'gallery')}
              >
                🏠 首页
              </button>
              <button
                onClick={() => setCurrentPage('mint')}
                style={navButtonStyle(currentPage === 'mint')}
              >
                ✨ 铸造
              </button>
            </nav>
          </div>

          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ minHeight: 'calc(100vh - 80px)' }}>
        {currentPage === 'gallery' && <AIGirlfriendGallery />}
        {currentPage === 'mint' && <MintAIGirlfriend />}
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0',
        padding: '2rem',
        marginTop: '4rem',
        textAlign: 'center'
      }}>
        <div style={{ color: '#666', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ marginBottom: '1rem', fontWeight: '600' }}>
            基于 0G Network 构建的 AI 女友 NFT 平台
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div>🔗 <strong>智能合约:</strong> AI girlfriend INFT</div>
            <div>💾 <strong>存储:</strong> 0G Storage</div>
            <div>🧠 <strong>AI:</strong> 0G Compute</div>
            <div>💰 <strong>费用:</strong> 铸造 0.01 $OG | 聊天 0.01 $OG</div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999' }}>
            所有数据永久存储在 0G 分布式网络中，确保你的 AI 女友永远不会消失 💕
          </div>
        </div>
      </footer>
    </main>
  );
}
