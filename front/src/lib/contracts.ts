import contractAddresses from './contract-addresses.json';

// 网络配置
export const NETWORK_CONFIG = {
  chainId: 16601,
  name: '0G Galileo Testnet',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  blockExplorer: 'https://chainscan-galileo.0g.ai',
  nativeCurrency: {
    name: '0G',
    symbol: 'OG',
    decimals: 18
  }
};

// 从部署信息文件中获取合约地址
export const AI_GIRLFRIEND_CONTRACT = contractAddresses?.contractAddress || '';

// 合约 ABI（用于后端）
export const AI_GIRLFRIEND_ABI = [
  // 查询函数
  'function MINT_PRICE() view returns (uint256)',
  'function CHAT_PRICE() view returns (uint256)',
  'function getAllPublicGirlfriends() view returns (uint256[])',
  'function getUserCreatedGirlfriends(address user) view returns (uint256[])',
  'function getGirlfriendDetails(uint256 tokenId) view returns (tuple(string name, string encryptedURI, bytes32 metadataHash, string imageHash, address creator, uint256 createdAt, uint256 totalChats, bool isPublic))',
  'function getUserChatCount(uint256 tokenId, address user) view returns (uint256)',
  'function getEncryptedURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',

  // 状态修改函数
  'function mintGirlfriend(string name, string encryptedURI, bytes32 metadataHash, string imageHash, bool isPublic) payable',
  'function startChatSession(uint256 tokenId) payable',
  'function setGirlfriendPublic(uint256 tokenId, bool isPublic)',
  'function transferWithMetadata(address from, address to, uint256 tokenId, bytes sealedKey, bytes proof)',
  'function authorizeUsage(uint256 tokenId, address user, bytes authData)',

  // 事件
  'event AIGirlfriendMinted(uint256 indexed tokenId, address indexed creator, string name, string personality, string encryptedURI, bytes32 metadataHash, string imageHash)',
  'event ChatSessionStarted(uint256 indexed tokenId, address indexed user, uint256 sessionCount)',
  'event MetadataUpdated(uint256 indexed tokenId, bytes32 metadataHash)'
];

// 检查合约是否已部署
export function isContractDeployed(): boolean {
  return !!AI_GIRLFRIEND_CONTRACT && AI_GIRLFRIEND_CONTRACT !== '';
}