'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })

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

      {isConnected && (
        <div>
          <p><strong>Address:</strong> {address}</p>
          <p><strong>Balance:</strong> {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}</p>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#d1edff',
            borderRadius: '5px',
            fontSize: '0.9rem',
            color: '#0c5460'
          }}>
            📝 Connected successfully! You can now upload files below (payment required first)
          </div>
        </div>
      )}
    </div>
  )
}