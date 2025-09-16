'use client';

import React, { useState } from 'react';
import { useWallet } from '@/lib/wallet';

const PERSONALITY_OPTIONS = [
  { value: 'sweet', label: '甜美可爱', description: '温柔体贴，说话软萌，喜欢撒娇' },
  { value: 'cool', label: '高冷御姐', description: '性格冷静，独立自主，有时会傲娇' },
  { value: 'cheerful', label: '活泼开朗', description: '乐观向上，充满活力，爱说话爱笑' },
  { value: 'gentle', label: '温柔知性', description: '成熟稳重，善解人意，充满智慧' },
  { value: 'mysterious', label: '神秘诱惑', description: '神秘莫测，魅力十足，话语间充满暗示' },
  { value: 'tsundere', label: '傲娇少女', description: '外冷内热，嘴硬心软，经常说反话' }
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
        alert('图片大小不能超过5MB');
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
      alert('请先连接钱包');
      return;
    }

    if (!formData.name || !formData.personality || !formData.imageFile) {
      alert('请填写完整信息');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('准备图片数据...');

      // 将图片转换为Base64
      const imageBase64 = await fileToBase64(formData.imageFile);

      setUploadStatus('正在铸造NFT和上传数据...');

      // 调用后端API进行铸造
      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          personality: formData.personality,
          customPersonality: formData.customPersonality,
          isPublic: formData.isPublic,
          imageBase64: imageBase64,
          imageFileName: formData.imageFile.name
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setUploadStatus('铸造成功！');

      // 重置表单
      setFormData({
        name: '',
        personality: '',
        customPersonality: '',
        imageFile: null,
        isPublic: true
      });
      setPreviewImage(null);

      alert(`AI女友NFT铸造成功！\nToken ID: ${result.data.tokenId}\n交易哈希: ${result.data.txHash}`);

    } catch (error: any) {
      console.error('铸造失败:', error);
      alert(`铸造失败: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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
        💝 铸造专属AI女友
      </h2>

      {/* 基本信息 */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>基本信息</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            女友名称:
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="给你的AI女友起个名字..."
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
            上传头像 (最大5MB):
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
                alt="预览"
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
            允许其他人付费与我的AI女友聊天 (你将获得90%的收益分成)
          </label>
        </div>
      </div>

      {/* 性格选择 */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#28a745' }}>性格设定</h3>
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
              <strong>自定义性格</strong>
              {formData.personality === 'custom' && (
                <textarea
                  value={formData.customPersonality}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPersonality: e.target.value }))}
                  placeholder="详细描述你的AI女友性格特点..."
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
        <h4 style={{ marginTop: 0 }}>💰 费用说明</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>铸造费用: 0.01 $OG (约等于创建成本)</li>
          <li>图片和性格数据将永久存储在0G分布式网络中</li>
          <li>如果设为公开，其他用户与你的AI女友聊天需支付0.01 $OG，你获得90%分成</li>
        </ul>
      </div>

      {/* 铸造按钮和状态 */}
      <button
        onClick={mintNFT}
        disabled={isUploading || !address || !formData.name || !formData.personality || !formData.imageFile}
        style={isUploading || !address ? disabledButtonStyle : buttonStyle}
      >
        {isUploading ? '正在铸造...' : '铸造AI女友NFT (0.01 $OG)'}
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
          请先连接钱包才能铸造NFT
        </div>
      )}
    </div>
  );
}