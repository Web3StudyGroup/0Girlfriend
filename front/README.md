# 💝 0GirlfriendNFT - AI女友NFT平台

基于0G Network生态系统构建的AI女友NFT平台，让你能够铸造、拥有和与AI女友聊天。

## 功能特性

- ✨ **AI女友铸造**: 创建独特的AI女友NFT，设定性格和外观
- 💾 **永久存储**: 使用0G Storage永久存储AI女友数据和图片
- 🧠 **智能聊天**: 基于0G Compute的AI对话功能
- 🎨 **个性化**: 6种预设性格模式 + 自定义性格
- 💰 **收益分成**: 公开AI女友可获得90%聊天费用分成
- 🔒 **隐私保护**: INFT加密技术保护AI女友数据
- 🌐 **去中心化**: 完全基于区块链和分布式存储

## 技术栈

- **区块链**: 0G Chain (EVM兼容)
- **存储**: 0G Storage (分布式存储)
- **AI计算**: 0G Compute (去中心化AI)
- **智能合约**: Solidity (基于ERC-7857 INFT标准)
- **前端**: Next.js 15 + TypeScript + React 19
- **Web3**: Wagmi + Viem + RainbowKit
- **合约框架**: Hardhat

## 安装和使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

在 `.env.local` 中设置:

```
PRIVATE_KEY=your_64_character_private_key_here
```

**重要说明**:
- 私钥必须是64位十六进制字符（可以包含或不包含0x前缀）
- 私钥对应的地址需要有0G测试网络的代币用于支付上传费用
- 可以从 https://faucet.0g.ai 获取测试代币
- 示例格式: `abc123def456789012345678901234567890123456789012345678901234abcd`

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用方法

### 📤 上传图片
1. 在"上传图片到0G Storage"区域点击选择图片文件
2. 选择后点击"上传到0G Storage"按钮
3. 等待上传完成，获得rootHash和交易哈希
4. 复制rootHash用于后续下载

### 📥 下载图片
1. 在"从0G Storage拉取图片"区域输入rootHash
2. 点击"下载图片"按钮
3. 等待下载完成，图片将在页面中显示
4. 点击"保存到本地"按钮可下载到电脑

### 💡 使用技巧
- 上传和下载可以独立使用
- rootHash是图片在0G Storage中的唯一标识
- 支持jpg、png、gif、webp等常见图片格式

## 0G网络信息

- **网络名称**: 0G-Galileo-Testnet
- **Chain ID**: 16601
- **RPC**: https://evmrpc-testnet.0g.ai
- **区块浏览器**: https://chainscan-galileo.0g.ai
- **Storage浏览器**: https://storagescan-galileo.0g.ai
- **代币水龙头**: https://faucet.0g.ai

## 项目结构

```
front/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts    # 图片上传API端点
│   │   │   └── download/route.ts  # 图片下载API端点
│   │   └── page.tsx               # 主页面
│   └── components/
│       ├── ImageUpload.tsx        # 图片上传组件
│       └── ImageDownload.tsx      # 图片下载组件
├── .env.example                   # 环境变量模板
└── package.json
```
