'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletConnect() {

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '20px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Wallet Connection</h3>

      <div style={{ marginBottom: '15px' }}>
        <ConnectButton />
      </div>

    </div>
  )
}