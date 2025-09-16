import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AI_GIRLFRIEND_ABI } from '@/lib/contracts';
import contractAddresses from '@/lib/contract-addresses.json';

const AI_GIRLFRIEND_CONTRACT = contractAddresses.contractAddress;
const RPC_URL = 'https://evmrpc-testnet.0g.ai';

interface ContractRequest {
  action: 'getAllPublicGirlfriends' | 'getUserCreatedGirlfriends' | 'getGirlfriendDetails' | 'startChatSession' | 'getPrices';
  privateKey?: string;
  userAddress?: string;
  tokenId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, privateKey, userAddress, tokenId }: ContractRequest = await request.json();

    if (!AI_GIRLFRIEND_CONTRACT) {
      return NextResponse.json(
        { error: '合约地址未配置' },
        { status: 500 }
      );
    }

    // 创建provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // 创建只读合约实例
    const contract = new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, provider);

    switch (action) {
      case 'getAllPublicGirlfriends':
        const publicTokenIds = await contract.getAllPublicGirlfriends();
        const publicGirlfriends = await Promise.all(
          publicTokenIds.map(async (tokenId: bigint) => {
            const details = await contract.getGirlfriendDetails(tokenId);
            return {
              tokenId: tokenId.toString(),
              name: details.name,
              imageHash: details.imageHash,
              creator: details.creator,
              totalChats: Number(details.totalChats),
              isPublic: details.isPublic,
              createdAt: Number(details.createdAt)
            };
          })
        );
        return NextResponse.json({ success: true, data: publicGirlfriends });

      case 'getUserCreatedGirlfriends':
        if (!userAddress) {
          return NextResponse.json({ error: '需要用户地址' }, { status: 400 });
        }
        const userTokenIds = await contract.getUserCreatedGirlfriends(userAddress);
        const userGirlfriends = await Promise.all(
          userTokenIds.map(async (tokenId: bigint) => {
            const details = await contract.getGirlfriendDetails(tokenId);
            return {
              tokenId: tokenId.toString(),
              name: details.name,
              imageHash: details.imageHash,
              creator: details.creator,
              totalChats: Number(details.totalChats),
              isPublic: details.isPublic,
              createdAt: Number(details.createdAt)
            };
          })
        );
        return NextResponse.json({ success: true, data: userGirlfriends });

      case 'getGirlfriendDetails':
        if (!tokenId) {
          return NextResponse.json({ error: '需要tokenId' }, { status: 400 });
        }
        const details = await contract.getGirlfriendDetails(tokenId);
        return NextResponse.json({
          success: true,
          data: {
            tokenId,
            name: details.name,
            imageHash: details.imageHash,
            creator: details.creator,
            totalChats: Number(details.totalChats),
            isPublic: details.isPublic,
            createdAt: Number(details.createdAt)
          }
        });

      case 'startChatSession':
        if (!privateKey || !tokenId) {
          return NextResponse.json({ error: '需要私钥和tokenId' }, { status: 400 });
        }

        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, wallet);

        const chatPrice = await contractWithSigner.CHAT_PRICE();
        const tx = await contractWithSigner.startChatSession(tokenId, { value: chatPrice });
        const receipt = await tx.wait();

        return NextResponse.json({
          success: true,
          data: {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
          }
        });

      case 'getPrices':
        const mintPrice = await contract.MINT_PRICE();
        const chatPriceOnly = await contract.CHAT_PRICE();
        return NextResponse.json({
          success: true,
          data: {
            mintPrice: ethers.formatEther(mintPrice),
            chatPrice: ethers.formatEther(chatPriceOnly)
          }
        });

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('合约交互错误:', error);
    return NextResponse.json(
      { error: `合约操作失败: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!AI_GIRLFRIEND_CONTRACT) {
      return NextResponse.json(
        { error: '合约地址未配置' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, provider);

    if (action === 'prices') {
      const mintPrice = await contract.MINT_PRICE();
      const chatPrice = await contract.CHAT_PRICE();
      return NextResponse.json({
        success: true,
        data: {
          mintPrice: ethers.formatEther(mintPrice),
          chatPrice: ethers.formatEther(chatPrice)
        }
      });
    }

    return NextResponse.json(
      { error: '不支持的GET操作' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('合约查询错误:', error);
    return NextResponse.json(
      { error: `查询失败: ${error.message}` },
      { status: 500 }
    );
  }
}