import React, { useState } from 'react';
import ZGStorageService from '../utils/0g-storage';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import contractABI from '../contracts/AIGirlfriendINFT.json';

// CLAUDE.md要求2: 可以Mint AI女友，设定性格，然后花费0.01$0G，mint一个iNFT。女友照片从本地拉取
const MintGirlfriend = ({ onMinted }) => {
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    image: null,
    isPublic: true
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // CLAUDE.md要求2: 女友照片从本地拉取
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.personality || !formData.image) {
      setError('请填写所有必填字段');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 检查钱包客户端是否可用
      if (!walletClient) {
        throw new Error('请先连接钱包');
      }

      // CLAUDE.md要求3: 图片和性格，存储在0g storage里
      const zgStorage = new ZGStorageService();
      await zgStorage.initWithSigner(walletClient);

      // 上传图片到0G Storage
      const imageResult = await zgStorage.uploadImage(formData.image);

      // 上传性格数据到0G Storage
      const personalityData = {
        name: formData.name,
        personality: formData.personality,
        traits: formData.personality.split(',').map(t => t.trim()),
        createdAt: Date.now()
      };

      const encryptionKey = zgStorage.generateEncryptionKey(address, Date.now());
      const personalityResult = await zgStorage.uploadPersonalityData(personalityData, encryptionKey);

      // CLAUDE.md要求2: 花费0.01$0G，mint一个iNFT
      writeContract({
        address: import.meta.env.VITE_CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: 'mintGirlfriend',
        args: [
          formData.name,                    // string name
          personalityResult.encryptedURI,   // string encryptedURI
          personalityResult.metadataHash,   // bytes32 metadataHash
          imageResult.rootHash,             // string imageHash
          formData.isPublic                 // bool isPublic
        ],
        value: parseEther('0.01'), // 0.01 $OG
        gas: 10000000n, // 增加gas限制到500k
        gasPrice: parseEther('0.0000000000011') // 1 gwei
      });

    } catch (err) {
      setError(`上传失败: ${err.message}`);
      setUploading(false);
    }
  };

  if (isConfirmed) {
    onMinted && onMinted();
    return (
      <div className="mint-success">
        <h2>🎉 AI女友 Mint 成功！</h2>
        <p>你的AI女友已经成功创建在0G网络上</p>
        <button onClick={() => onMinted()}>查看所有AI女友</button>
      </div>
    );
  }

  return (
    <div className="mint-girlfriend">
      <h2>✨ Mint 你的专属AI女友</h2>
      <p>费用：0.01 $OG | 图片和性格数据将存储在0G Storage</p>

      <form onSubmit={handleSubmit} className="mint-form">
        <div className="form-group">
          <label>名字 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="给你的AI女友起个名字"
            required
          />
        </div>

        <div className="form-group">
          <label>性格特征 *</label>
          <textarea
            name="personality"
            value={formData.personality}
            onChange={handleInputChange}
            placeholder="描述她的性格，例如：温柔，聪明，幽默，喜欢音乐"
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label>上传照片 * (本地文件)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {formData.image && (
            <div className="image-preview">
              <img
                src={URL.createObjectURL(formData.image)}
                alt="预览"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
            />
            允许其他人付费聊天 (0.01 $OG)
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          disabled={uploading || isPending || isConfirming}
          className="mint-button"
        >
          {uploading ? '上传中...' : isPending ? '确认交易...' : isConfirming ? '处理中...' : 'Mint AI女友 (0.01 $OG)'}
        </button>
      </form>
    </div>
  );
};

export default MintGirlfriend;