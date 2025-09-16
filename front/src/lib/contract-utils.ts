import { ethers } from 'ethers';
import { AI_GIRLFRIEND_ABI } from './contracts';
import contractAddresses from './contract-addresses.json';

const AI_GIRLFRIEND_CONTRACT = contractAddresses.contractAddress;
const RPC_URL = 'https://evmrpc-testnet.0g.ai';

// 创建只读合约实例
export function getReadOnlyContract() {
  if (!AI_GIRLFRIEND_CONTRACT) {
    throw new Error('合约地址未配置，请先部署合约');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, provider);
}

// 创建可写合约实例（需要钱包签名）
export function getContract(signer: ethers.Signer) {
  if (!AI_GIRLFRIEND_CONTRACT) {
    throw new Error('合约地址未配置，请先部署合约');
  }

  return new ethers.Contract(AI_GIRLFRIEND_CONTRACT, AI_GIRLFRIEND_ABI, signer);
}

// 获取所有公开的AI女友
export async function getAllPublicGirlfriends() {
  const contract = getReadOnlyContract();
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

  return publicGirlfriends;
}

// 获取用户创建的AI女友
export async function getUserCreatedGirlfriends(userAddress: string) {
  const contract = getReadOnlyContract();
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

  return userGirlfriends;
}

// 获取AI女友详情
export async function getGirlfriendDetails(tokenId: string) {
  const contract = getReadOnlyContract();
  const details = await contract.getGirlfriendDetails(tokenId);

  return {
    tokenId,
    name: details.name,
    imageHash: details.imageHash,
    creator: details.creator,
    totalChats: Number(details.totalChats),
    isPublic: details.isPublic,
    createdAt: Number(details.createdAt)
  };
}

// 获取价格信息
export async function getPrices() {
  const contract = getReadOnlyContract();
  const mintPrice = await contract.MINT_PRICE();
  const chatPrice = await contract.CHAT_PRICE();

  return {
    mintPrice: ethers.formatEther(mintPrice),
    chatPrice: ethers.formatEther(chatPrice)
  };
}

// 开始聊天会话（需要用户签名和支付）
export async function startChatSession(signer: ethers.Signer, tokenId: string) {
  const contract = getContract(signer);
  const chatPrice = await contract.CHAT_PRICE();

  const tx = await contract.startChatSession(tokenId, { value: chatPrice });
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
}

// 铸造AI女友NFT（需要用户签名和支付）
export async function mintGirlfriend(
  signer: ethers.Signer,
  name: string,
  encryptedURI: string,
  metadataHash: string,
  imageHash: string,
  isPublic: boolean
) {
  const contract = getContract(signer);
  const mintPrice = await contract.MINT_PRICE();

  const tx = await contract.mintGirlfriend(
    name,
    encryptedURI,
    metadataHash,
    imageHash,
    isPublic,
    { value: mintPrice }
  );

  const receipt = await tx.wait();

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

  return {
    tokenId,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  };
}