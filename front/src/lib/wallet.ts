import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useMemo } from 'react';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const signer = useMemo(() => {
    if (!walletClient) return null;
    return new ethers.BrowserProvider(walletClient.transport).getSigner();
  }, [walletClient]);

  return {
    address,
    isConnected,
    signer
  };
}