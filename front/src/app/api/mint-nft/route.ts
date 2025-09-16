import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { AI_GIRLFRIEND_ABI } from '@/lib/contracts';
import contractAddresses from '@/lib/contract-addresses.json';

const AI_GIRLFRIEND_CONTRACT = contractAddresses.contractAddress;
const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

interface MintRequest {
  name: string;
  personality: string;
  customPersonality?: string;
  isPublic: boolean;
  privateKey: string;
  imageBase64: string; // Base64 编码的图片
  imageFileName: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      personality,
      customPersonality,
      isPublic,
      privateKey,
      imageBase64,
      imageFileName
    }: MintRequest = await request.json();

    if (!privateKey) {
      return NextResponse.json(
        { error: '需要私钥来铸造NFT' },
        { status: 400 }
      );
    }

    if (!AI_GIRLFRIEND_CONTRACT) {
      return NextResponse.json(
        { error: '合约地址未配置' },
        { status: 500 }
      );
    }

    // 创建钱包和signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 1. 上传图片到0G存储
    console.log('正在上传图片到0G存储...');

    // 将Base64转换为Uint8Array
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    const imageUint8Array = new Uint8Array(imageBuffer);

    const indexer = new Indexer(INDEXER_RPC);
    const zgFile = new ZgFile(imageUint8Array);

    const [tree, treeErr] = await zgFile.merkleTree();
    if (treeErr) {
      throw new Error(`Merkle tree error: ${treeErr}`);
    }

    const imageHash = tree?.rootHash();
    if (!imageHash) {
      throw new Error('Failed to get image root hash');
    }

    console.log("Image Root Hash:", imageHash);

    const [uploadTx, uploadErr] = await indexer.upload(zgFile, RPC_URL, wallet);
    if (uploadErr) {
      throw new Error(`Image upload error: ${uploadErr}`);
    }

    await zgFile.close();
    console.log('图片上传完成');

    // 2. 准备加密的人格数据
    console.log('准备人格数据...');

    const personalityDescription = personality === 'custom'
      ? (customPersonality || '')
      : getPersonalityDescription(personality);

    const personalityData = {
      name: name,
      personality: personalityDescription,
      preferences: {
        chattingStyle: personality,
        responseLength: 'medium',
        emotionalLevel: 'moderate'
      },
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    // 3. 存储加密的人格数据到KV存储
    const encryptedData = JSON.stringify(personalityData);
    const personalityKey = `girlfriend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 使用现有的KV上传API
    const kvResponse = await fetch(`${request.nextUrl.origin}/api/kv-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: personalityKey,
        value: encryptedData
      })
    });

    if (!kvResponse.ok) {
      throw new Error('人格数据存储失败');
    }

    const encryptedURI = `kv://${personalityKey}`;
    console.log('人格数据存储完成');

    // 4. 计算metadata hash
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(encryptedData));

    // 5. 调用智能合约铸造NFT
    console.log('正在铸造NFT...');

    const contract = new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, wallet);
    const mintPrice = await contract.MINT_PRICE();

    const mintTx = await contract.mintGirlfriend(
      name,
      encryptedURI,
      metadataHash,
      imageHash,
      isPublic,
      { value: mintPrice }
    );

    console.log('等待交易确认...');
    const receipt = await mintTx.wait();

    // 从事件中获取tokenId
    let tokenId = '';
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsedLog && parsedLog.name === 'AIGirlfriendMinted') {
          tokenId = parsedLog.args.tokenId.toString();
          break;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    console.log('NFT铸造完成！');

    return NextResponse.json({
      success: true,
      data: {
        tokenId,
        txHash: mintTx.hash,
        imageHash,
        encryptedURI,
        metadataHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }
    });

  } catch (error: any) {
    console.error('NFT铸造错误:', error);
    return NextResponse.json(
      { error: `铸造失败: ${error.message}` },
      { status: 500 }
    );
  }
}

function getPersonalityDescription(personality: string): string {
  const personalities: { [key: string]: string } = {
    'sweet': '温柔体贴，说话软萌，喜欢撒娇',
    'cool': '性格冷静，独立自主，有时会傲娇',
    'cheerful': '乐观向上，充满活力，爱说话爱笑',
    'gentle': '成熟稳重，善解人意，充满智慧',
    'mysterious': '神秘莫测，魅力十足，话语间充满暗示',
    'tsundere': '外冷内热，嘴硬心软，经常说反话'
  };

  return personalities[personality] || personalities['sweet'];
}