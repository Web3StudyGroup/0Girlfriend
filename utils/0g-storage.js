import { ZgFile, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

class ZGStorageService {
  constructor() {
    this.RPC_URL = 'https://evmrpc-testnet.0g.ai/';
    this.INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    this.indexer = new Indexer(this.INDEXER_RPC);
  }

  // Initialize with user's wallet
  async initWithSigner(signer) {
    this.signer = signer;
  }

  // Upload AI girlfriend image to 0G Storage
  async uploadImage(imageFile) {
    try {
      console.log("Uploading image to 0G Storage...");

      // Convert File to ZgFile
      const zgFile = await this.createZgFileFromFile(imageFile);
      const [tree, err] = await zgFile.merkleTree();

      if (err) {
        throw new Error(`Merkle tree error: ${err}`);
      }

      const rootHash = tree?.rootHash();
      console.log("Image Root Hash:", rootHash);

      // Upload to 0G Storage
      const [tx, uploadErr] = await this.indexer.upload(zgFile, this.RPC_URL, this.signer);

      if (uploadErr) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      await zgFile.close();

      return {
        rootHash,
        txHash: tx,
        size: imageFile.size,
        type: imageFile.type
      };
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  }

  // Upload encrypted AI personality data to 0G Storage
  async uploadPersonalityData(personalityData, encryptionKey) {
    try {
      console.log("Uploading personality data to 0G Storage...");

      // Encrypt personality data
      const encryptedData = await this.encryptData(personalityData, encryptionKey);

      // Convert to file-like object
      const dataBlob = new Blob([JSON.stringify(encryptedData)], { type: 'application/json' });
      const dataFile = new File([dataBlob], 'personality.json');

      const zgFile = await this.createZgFileFromFile(dataFile);
      const [tree, err] = await zgFile.merkleTree();

      if (err) {
        throw new Error(`Merkle tree error: ${err}`);
      }

      const rootHash = tree?.rootHash();
      console.log("Personality Data Root Hash:", rootHash);

      const [tx, uploadErr] = await this.indexer.upload(zgFile, this.RPC_URL, this.signer);

      if (uploadErr) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      await zgFile.close();

      return {
        rootHash,
        txHash: tx,
        encryptedURI: `0g://${rootHash}`,
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(encryptedData)))
      };
    } catch (error) {
      console.error("Personality data upload failed:", error);
      throw error;
    }
  }

  // Download data from 0G Storage
  async downloadData(rootHash) {
    try {
      console.log("Downloading from 0G Storage:", rootHash);

      // Create temporary file path
      const tempPath = `/tmp/${rootHash}`;

      const err = await this.indexer.download(rootHash, tempPath, true);
      if (err) {
        throw new Error(`Download error: ${err}`);
      }

      // Read the downloaded file
      // Note: In browser environment, this would need to be handled differently
      return tempPath;
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }

  // Simple encryption (in production, use more robust encryption)
  async encryptData(data, key) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Simple XOR encryption for demo (use AES in production)
    const dataBytes = encoder.encode(JSON.stringify(data));
    const keyBytes = encoder.encode(key);

    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      data: Array.from(encrypted),
      algorithm: 'simple-xor',
      timestamp: Date.now()
    };
  }

  // Simple decryption
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

  // Helper function to create ZgFile from File object
  async createZgFileFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);

          // Create ZgFile from buffer
          const zgFile = new ZgFile(uint8Array);
          resolve(zgFile);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Generate encryption key for user
  generateEncryptionKey(userAddress, tokenId) {
    return ethers.keccak256(
      ethers.solidityPacked(['address', 'uint256', 'string'], [userAddress, tokenId, 'ai-girlfriend'])
    );
  }

  // Create metadata for INFT
  createINFTMetadata(imageHash, personalityHash, encryptedURI, metadataHash) {
    return {
      imageHash,
      personalityHash,
      encryptedURI,
      metadataHash,
      version: '1.0',
      protocol: '0g-inft',
      createdAt: Date.now()
    };
  }
}

export default ZGStorageService;