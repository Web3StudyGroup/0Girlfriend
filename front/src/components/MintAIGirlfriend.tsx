'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/wallet';
import toast from 'react-hot-toast';

const PERSONALITY_OPTIONS = [
  { value: 'sweet', label: 'Sweet & Cute', description: 'Gentle and caring, speaks softly, loves to act cute' },
  { value: 'cool', label: 'Cool & Elegant', description: 'Calm personality, independent, sometimes prideful' },
  { value: 'cheerful', label: 'Cheerful & Lively', description: 'Optimistic and upbeat, full of energy, loves to talk and laugh' },
  { value: 'gentle', label: 'Gentle & Intelligent', description: 'Mature and steady, understanding, full of wisdom' },
  { value: 'mysterious', label: 'Mysterious & Alluring', description: 'Mysterious and charming, speaks with subtle hints' },
  { value: 'tsundere', label: 'Tsundere Girl', description: 'Cold outside, warm inside, often says the opposite of what she means' }
];

export default function MintAIGirlfriend() {
  const { address } = useWallet();

  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    customPersonality: '',
    imageFile: null as File | null,
    isPublic: true
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size cannot exceed 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, imageFile: file }));

      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalityChange = (personality: string) => {
    setFormData(prev => ({ ...prev, personality, customPersonality: '' }));
  };

  const getPersonalityDescription = () => {
    if (formData.personality === 'custom') {
      return formData.customPersonality;
    }
    return PERSONALITY_OPTIONS.find(p => p.value === formData.personality)?.description || '';
  };

  const mintNFT = async () => {
    if (!address) {
      toast.error('Please connect wallet first');
      return;
    }

    if (!formData.name || !formData.personality || !formData.imageFile) {
      toast.error('Please fill in complete information');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Preparing image data...');

      // 获取钱包signer
      if (!window.ethereum) {
        throw new Error('Please install MetaMask wallet');
      }

      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setUploadStatus('Uploading image to 0G storage...');

      // 创建FormData并上传图片文件
      const uploadFormData = new FormData();
      uploadFormData.append('image', formData.imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      const imageHash = uploadResult.tempImageUrl || uploadResult.hash; // 优先使用临时图片URL

      setUploadStatus('Preparing personality data...');

      // 准备人格数据（简化版本，直接使用明文）
      const personalityDescription = formData.personality === 'custom'
        ? formData.customPersonality || ''
        : getPersonalityDescription();

      setUploadStatus('Minting NFT...');

      // 使用前端合约调用铸造NFT
      const { mintGirlfriend } = await import('@/lib/contract-utils');

      const result = await mintGirlfriend(
        signer,
        formData.name,
        personalityDescription,
        imageHash,
        formData.isPublic
      );

      setUploadStatus('Minting successful!');

      // 重置表单
      setFormData({
        name: '',
        personality: '',
        customPersonality: '',
        imageFile: null,
        isPublic: true
      });
      setPreviewImage(null);

      // 使用toast显示成功信息
      toast.success('🎉 AI Girlfriend NFT minted successfully!', {
        duration: 6000,
        style: {
          fontSize: '16px',
          padding: '16px',
        },
      });

      // 显示详细信息的toast
      setTimeout(() => {
        toast.success(`Token ID: ${result.tokenId}`, {
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        });
      }, 1000);

      setTimeout(() => {
        toast.success(`Transaction Hash: ${result.txHash}`, {
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        });
      }, 2000);

    } catch (error: any) {
      console.error('Minting failed:', error);
      toast.error(`Minting failed: ${error.message}`, {
        duration: 6000,
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };


  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    padding: '1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem',
    width: '100%'
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#e91e63' }}>
        💝 Mint Your AI Girlfriend
      </h2>

      {/* 基本信息 */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Basic Information</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Girlfriend Name:
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Give your AI girlfriend a name..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            disabled={isUploading}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Upload Avatar (Max 5MB):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            disabled={isUploading}
          />
          {previewImage && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  border: '2px solid #e91e63'
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              disabled={isUploading}
              style={{ marginRight: '0.5rem' }}
            />
            Allow others to pay to chat with my AI girlfriend (you will get 90% revenue share)
          </label>
        </div>
      </div>

      {/* 性格选择 */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#28a745' }}>Personality Settings</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {PERSONALITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '0.75rem',
                border: `2px solid ${formData.personality === option.value ? '#e91e63' : '#ddd'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: formData.personality === option.value ? '#fce4ec' : 'white'
              }}
            >
              <input
                type="radio"
                name="personality"
                value={option.value}
                checked={formData.personality === option.value}
                onChange={() => handlePersonalityChange(option.value)}
                disabled={isUploading}
                style={{ marginRight: '0.5rem', marginTop: '0.2rem' }}
              />
              <div>
                <strong>{option.label}</strong>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  {option.description}
                </div>
              </div>
            </label>
          ))}

          {/* 自定义性格 */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '0.75rem',
              border: `2px solid ${formData.personality === 'custom' ? '#e91e63' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: formData.personality === 'custom' ? '#fce4ec' : 'white'
            }}
          >
            <input
              type="radio"
              name="personality"
              value="custom"
              checked={formData.personality === 'custom'}
              onChange={() => handlePersonalityChange('custom')}
              disabled={isUploading}
              style={{ marginRight: '0.5rem', marginTop: '0.2rem' }}
            />
            <div style={{ flex: 1 }}>
              <strong>Custom Personality</strong>
              {formData.personality === 'custom' && (
                <textarea
                  value={formData.customPersonality}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPersonality: e.target.value }))}
                  placeholder="Describe your AI girlfriend's personality traits..."
                  disabled={isUploading}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* 费用说明 */}
      <div style={{
        ...sectionStyle,
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        color: '#856404'
      }}>
        <h4 style={{ marginTop: 0 }}>💰 Cost Information</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>Minting cost: 0.01 $OG (approximately creation cost)</li>
          <li>Images and personality data will be permanently stored on 0G distributed network</li>
          <li>If set to public, other users pay 0.01 $OG to chat with your AI girlfriend, you get 90% revenue share</li>
        </ul>
      </div>

      {/* 铸造按钮和状态 */}
      <button
        onClick={mintNFT}
        disabled={isUploading || !address || !formData.name || !formData.personality || !formData.imageFile}
        style={isUploading || !address ? disabledButtonStyle : buttonStyle}
      >
        {isUploading ? 'Minting...' : 'Mint AI Girlfriend NFT (0.01 $OG)'}
      </button>

      {uploadStatus && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          color: '#155724',
          textAlign: 'center'
        }}>
          {uploadStatus}
        </div>
      )}

      {!address && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          textAlign: 'center'
        }}>
          Please connect wallet first to mint NFT
        </div>
      )}
    </div>
  );
}