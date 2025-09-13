import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 按照CLAUDE.md技术栈要求：react + vite + viem + rainbow
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

// 配置0G测试网
const og_testnet = {
  id: 16601,
  name: '0G-Galileo-Testnet',
  iconUrl: 'https://0g.ai/favicon.ico',
  iconBackground: '#fff',
  nativeCurrency: { name: '0G', symbol: 'OG', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: '0Girlfriend',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // 从WalletConnect获取
  chains: [og_testnet],
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
