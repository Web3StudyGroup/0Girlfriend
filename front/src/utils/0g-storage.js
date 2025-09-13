// import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

// CLAUDE.md要求3: 图片和性格，存储在0g storage里
class ZGStorageService {
  constructor() {
    this.RPC_URL = 'https://evmrpc-testnet.0g.ai/';
    this.INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    // this.indexer = new Indexer(this.INDEXER_RPC);
    this.signer = null;
  }

  // 初始化，传入用户的签名器
  async initWithSigner(signer) {
    this.signer = signer;
  }

  // CLAUDE.md要求2,3: 女友照片从本地拉取，存储在0g storage里
  async uploadImage(imageFile) {
    try {
      console.log("上传图片到0G Storage...");

      if (!this.signer) {
        throw new Error("请先连接钱包");
      }

      // 为浏览器环境创建简化的上传逻辑
      // 生成一个模拟的根哈希（生产环境中需要实现实际的0G存储上传）
      const fileBuffer = await imageFile.arrayBuffer();
      const fileHash = ethers.keccak256(new Uint8Array(fileBuffer));

      // 暂时使用本地存储模拟0G存储
      const rootHash = fileHash.slice(2); // 移除0x前缀

      // 创建本地URL用于预览
      const localUrl = URL.createObjectURL(imageFile);

      console.log("图片根哈希:", rootHash);

      // TODO: 实现实际的0G Storage API调用
      // 这里应该调用0G的REST API而不是SDK

      return {
        rootHash,
        txHash: `mock_tx_${Date.now()}`, // 模拟交易哈希
        size: imageFile.size,
        type: imageFile.type,
        url: localUrl, // 暂时返回本地URL
        mockData: true // 标记这是模拟数据
      };
    } catch (error) {
      console.error("图片上传失败:", error);
      throw error;
    }
  }

  // CLAUDE.md要求3: 性格数据存储在0g storage里
  async uploadPersonalityData(personalityData, encryptionKey) {
    try {
      console.log("上传性格数据到0G Storage...");

      if (!this.signer) {
        throw new Error("请先连接钱包");
      }

      // 加密性格数据
      const encryptedData = await this.encryptData(personalityData, encryptionKey);

      // 为浏览器环境创建简化逻辑
      const dataString = JSON.stringify(encryptedData);
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
      const rootHash = dataHash.slice(2); // 移除0x前缀

      console.log("性格数据根哈希:", rootHash);

      // 暂时存储在localStorage中（生产环境应使用实际的0G Storage API）
      localStorage.setItem(`0g_personality_${rootHash}`, dataString);

      // TODO: 实现实际的0G Storage API调用

      return {
        rootHash,
        txHash: `mock_tx_${Date.now()}`, // 模拟交易哈希
        encryptedURI: `0g://${rootHash}`,
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(encryptedData))),
        url: `mock://gateway.0g.ai/${rootHash}`,
        mockData: true // 标记这是模拟数据
      };
    } catch (error) {
      console.error("性格数据上传失败:", error);
      throw error;
    }
  }

  // 从0G Storage下载数据
  async downloadData(rootHash) {
    try {
      console.log("从0G Storage下载数据:", rootHash);

      // 首先尝试从localStorage获取（模拟数据）
      const localData = localStorage.getItem(`0g_personality_${rootHash}`);
      if (localData) {
        return new Blob([localData], { type: 'application/json' });
      }

      // 对于浏览器环境，我们使用网关URL
      // TODO: 在生产环境中，这里应该调用实际的0G Storage API
      try {
        const response = await fetch(`https://gateway.0g.ai/${rootHash}`);
        if (response.ok) {
          const data = await response.blob();
          return data;
        }
      } catch (fetchError) {
        console.warn("从网关下载失败，可能是模拟数据:", fetchError);
      }

      throw new Error(`数据未找到: ${rootHash}`);
    } catch (error) {
      console.error("下载失败:", error);
      throw error;
    }
  }

  // 下载并解密性格数据
  async downloadAndDecryptPersonalityData(rootHash, encryptionKey) {
    try {
      const data = await this.downloadData(rootHash);
      const text = await data.text();
      const encryptedData = JSON.parse(text);

      return await this.decryptData(encryptedData, encryptionKey);
    } catch (error) {
      console.error("下载解密性格数据失败:", error);
      throw error;
    }
  }

  // 简单加密（生产环境应使用更强的加密）
  async encryptData(data, key) {
    const encoder = new TextEncoder();

    // 简单XOR加密（演示用，生产环境使用AES）
    const dataBytes = encoder.encode(JSON.stringify(data));
    const keyBytes = encoder.encode(key);

    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      data: Array.from(encrypted),
      algorithm: 'simple-xor',
      timestamp: Date.now(),
      version: '1.0'
    };
  }

  // 简单解密
  async decryptData(encryptedData, key) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyBytes = encoder.encode(key);
    const encryptedBytes = new Uint8Array(encryptedData.data);

    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return JSON.parse(decoder.decode(decrypted));
  }

  // 浏览器环境文件处理辅助方法
  async convertFileToBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(new Uint8Array(event.target.result));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // 为用户生成加密密钥
  generateEncryptionKey(userAddress, tokenId) {
    return ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'string'],
        [userAddress, tokenId, 'ai-girlfriend-inft']
      )
    );
  }

  // 创建iNFT元数据
  createINFTMetadata(imageHash, personalityHash, encryptedURI, metadataHash) {
    return {
      imageHash,
      personalityHash,
      encryptedURI,
      metadataHash,
      version: '1.0',
      protocol: '0g-inft',
      createdAt: Date.now(),
      description: 'AI Girlfriend iNFT with encrypted personality data stored on 0G Storage'
    };
  }

  // 验证存储状态
  async verifyStorage(rootHash) {
    try {
      const response = await fetch(`https://gateway.0g.ai/${rootHash}`, {
        method: 'HEAD'
      });
      return response.ok;
    } catch (error) {
      console.error('验证存储失败:', error);
      return false;
    }
  }

  // 获取存储统计信息
  async getStorageStats() {
    try {
      // 这里可以添加获取用户存储使用情况的逻辑
      return {
        totalFiles: 0,
        totalSize: 0,
        availableSpace: 'unlimited' // 0G Storage目前没有限制
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return null;
    }
  }
}

export default ZGStorageService;