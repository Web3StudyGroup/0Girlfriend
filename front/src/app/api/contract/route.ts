import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AI_GIRLFRIEND_ABI } from '@/lib/contracts';
import contractAddresses from '@/lib/contract-addresses.json';

const AI_GIRLFRIEND_CONTRACT = contractAddresses.contractAddress;
const RPC_URL = 'https://evmrpc-testnet.0g.ai';

interface ContractRequest {
  action: 'getAllPublicGirlfriends' | 'getUserCreatedGirlfriends' | 'getGirlfriendDetails' | 'startChatSession' | 'getPrices';
  userAddress?: string;
  tokenId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, userAddress, tokenId }: ContractRequest = await request.json();

    // 如果合约未部署，返回模拟数据用于开发
    if (!AI_GIRLFRIEND_CONTRACT) {
      return handleMockData(action, userAddress, tokenId);
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
        if (!tokenId) {
          return NextResponse.json({ error: '需要tokenId' }, { status: 400 });
        }

        // 从环境变量获取私钥
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
          return NextResponse.json({ error: '服务器未配置私钥' }, { status: 500 });
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
      if (action === 'prices') {
        return NextResponse.json({
          success: true,
          data: {
            mintPrice: '0.01',
            chatPrice: '0.01'
          }
        });
      }
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

// 处理模拟数据的函数
function handleMockData(action: string, userAddress?: string, tokenId?: string) {
  console.log(`[MOCK DATA] 处理操作: ${action}`);

  switch (action) {
    case 'getAllPublicGirlfriends':
      return NextResponse.json({
        success: true,
        data: [
          {
            tokenId: '1',
            name: '小美',
            imageHash: 'mock-image-hash-1',
            creator: '0x1234...5678',
            totalChats: 15,
            isPublic: true,
            createdAt: Date.now() - 86400000 // 1天前
          },
          {
            tokenId: '2',
            name: '小雨',
            imageHash: 'mock-image-hash-2',
            creator: '0x9876...4321',
            totalChats: 8,
            isPublic: true,
            createdAt: Date.now() - 172800000 // 2天前
          }
        ]
      });

    case 'getUserCreatedGirlfriends':
      if (!userAddress) {
        return NextResponse.json({ success: true, data: [] });
      }
      return NextResponse.json({
        success: true,
        data: [
          {
            tokenId: '3',
            name: '我的女友',
            imageHash: 'mock-image-hash-3',
            creator: userAddress,
            totalChats: 5,
            isPublic: false,
            createdAt: Date.now() - 43200000 // 12小时前
          }
        ]
      });

    case 'getGirlfriendDetails':
      if (!tokenId) {
        return NextResponse.json({ error: '需要tokenId' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        data: {
          tokenId,
          name: `女友${tokenId}`,
          imageHash: `mock-image-hash-${tokenId}`,
          creator: '0x1234...5678',
          totalChats: Math.floor(Math.random() * 50),
          isPublic: true,
          createdAt: Date.now() - Math.random() * 86400000 * 7 // 随机7天内
        }
      });

    case 'startChatSession':
      if (!tokenId) {
        return NextResponse.json({ error: '需要tokenId' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        data: {
          txHash: '0xmock-transaction-hash',
          blockNumber: 12345
        }
      });

    case 'getPrices':
      return NextResponse.json({
        success: true,
        data: {
          mintPrice: '0.01',
          chatPrice: '0.01'
        }
      });

    default:
      return NextResponse.json(
        { error: '不支持的操作' },
        { status: 400 }
      );
  }
}