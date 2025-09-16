'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePayment } from '@/lib/usePayment';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  hash?: string;
  txHash?: string;
  uploadType?: 'normal' | 'kv';
}

export default function ImageUpload() {
  const { isConnected } = useAccount();
  const {
    paymentCompleted,
    paymentPending,
    transactionHash,
    makePayment,
    paymentAmount,
    paymentAddress
  } = usePayment();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadStatus({ status: 'idle' });
    } else {
      alert('Please select an image file (JPG, PNG, GIF, WebP, etc.)');
    }
  };

  const validateImageFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return validTypes.includes(file.type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateImageFile(file)) {
        setSelectedFile(file);
        setUploadStatus({ status: 'idle' });
      } else {
        alert('Please drop an image file (JPG, PNG, GIF, WebP, etc.)');
      }
    }
  };

  const handleNormalUpload = async () => {
    if (!selectedFile) return;
    if (!paymentCompleted) {
      alert('Please complete payment before uploading files');
      return;
    }

    setUploadStatus({ status: 'uploading', message: 'Uploading to 0G Storage (Normal Mode)...', uploadType: 'normal' });

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (response.ok) {
        setUploadStatus({
          status: 'success',
          message: 'Normal upload successful!',
          hash: String(result.rootHash || result.hash || ''),
          txHash: String(result.txHash || ''),
          uploadType: 'normal'
        });
      } else {
        setUploadStatus({
          status: 'error',
          message: result.error || 'Normal upload failed',
          uploadType: 'normal'
        });
      }
    } catch {
      setUploadStatus({
        status: 'error',
        message: 'Error occurred during normal upload',
        uploadType: 'normal'
      });
    }
  };

  const handleKVUpload = async () => {
    if (!selectedFile) return;
    if (!paymentCompleted) {
      alert('Please complete payment before uploading files');
      return;
    }

    setUploadStatus({ status: 'uploading', message: 'Uploading to 0G KV Storage...', uploadType: 'kv' });

    // 将文件转换为Base64或者使用文件名作为key
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;
      const fileName = selectedFile.name;

      try {
        const response = await fetch('/api/kv-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: `file:${fileName}:${Date.now()}`,
            value: fileContent.split(',')[1], // 移除data:image/...;base64,前缀
            streamId: '0x00000000000000000000000000000000000000000000000000000000000001'
          }),
        });

        const result = await response.json();
        console.log('KV Upload result:', result);

        if (response.ok) {
          setUploadStatus({
            status: 'success',
            message: 'KV storage upload successful!',
            hash: String(result.key || result.rootHash || ''),
            txHash: String(result.txHash || ''),
            uploadType: 'kv'
          });
        } else {
          setUploadStatus({
            status: 'error',
            message: result.error || 'KV upload failed',
            uploadType: 'kv'
          });
        }
      } catch {
        setUploadStatus({
          status: 'error',
          message: 'Error occurred during KV upload',
          uploadType: 'kv'
        });
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const containerStyle: React.CSSProperties = {
    border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    marginBottom: '1rem',
    backgroundColor: isDragging ? '#f0f8ff' : 'transparent',
    transition: 'all 0.3s ease'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  };

  const successStyle: React.CSSProperties = {
    color: 'green',
    marginTop: '1rem'
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    marginTop: '1rem'
  };

  return (
    <div>
      <div
        style={containerStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          id="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          {selectedFile ? (
            <div>
              <p>✅ Selected file: {selectedFile.name}</p>
              <p>📊 File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                Click to select a different file
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                📁 {isDragging ? 'Drop your image here!' : 'Click to select image file'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                💡 Or drag and drop from your desktop/folder
              </p>
              <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                Supported formats: JPG, PNG, GIF, WebP, SVG
              </p>
            </div>
          )}
        </label>
      </div>

      {selectedFile && (
        <div>
          {/* Payment Section */}
          {!paymentCompleted && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>⚠️ Payment Required Before Upload</h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                You need to pay <strong>{paymentAmount} OG</strong> before uploading to:
              </p>
              <p style={{
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                backgroundColor: '#fff',
                padding: '0.5rem',
                borderRadius: '4px',
                margin: '0 0 1rem 0'
              }}>
                {paymentAddress}
              </p>
              {isConnected ? (
                <button
                  onClick={makePayment}
                  disabled={paymentPending}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: paymentPending ? '#6c757d' : '#ffc107',
                    color: paymentPending ? '#fff' : '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: paymentPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  {paymentPending ? 'Paying...' : `Pay ${paymentAmount} OG`}
                </button>
              ) : (
                <p style={{ color: '#856404', fontSize: '0.9rem', margin: 0 }}>
                  Please connect wallet first
                </p>
              )}
            </div>
          )}

          {paymentCompleted && (
            <div style={{
              backgroundColor: '#d1edff',
              border: '1px solid #bee5eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#0c5460' }}>
                ✅ Payment completed! You can now upload files
              </p>
              {transactionHash && (
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Transaction Hash: <a
                    href={`https://chainscan-galileo.0g.ai/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0c5460' }}
                  >
                    {transactionHash}
                  </a>
                </p>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button
              onClick={handleNormalUpload}
              disabled={uploadStatus.status === 'uploading' || !paymentCompleted}
              style={{
                ...buttonStyle,
                backgroundColor: (uploadStatus.status === 'uploading' || !paymentCompleted) ? '#6c757d' : '#007bff',
                marginRight: '1rem',
                cursor: (uploadStatus.status === 'uploading' || !paymentCompleted) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadStatus.status === 'uploading' && uploadStatus.uploadType === 'normal'
                ? 'Normal uploading...'
                : 'Normal Upload (File Storage)'}
            </button>
            <button
              onClick={handleKVUpload}
              disabled={uploadStatus.status === 'uploading' || !paymentCompleted}
              style={{
                ...buttonStyle,
                backgroundColor: (uploadStatus.status === 'uploading' || !paymentCompleted) ? '#6c757d' : '#28a745',
                cursor: (uploadStatus.status === 'uploading' || !paymentCompleted) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadStatus.status === 'uploading' && uploadStatus.uploadType === 'kv'
                ? 'KV uploading...'
                : 'KV Upload (Key-Value Storage)'}
            </button>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: '#666',
            border: '1px solid #e9ecef'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              💡 <strong>File Selection Tips:</strong>
            </p>
            <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem' }}>
              🖱️ <strong>From Desktop</strong>: Open file explorer, navigate to Desktop, then drag image directly to the upload area above
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>
              📁 <strong>Quick Access</strong>: Use keyboard shortcut (Ctrl+O / Cmd+O) after clicking the upload area for quick file browser
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              💾 <strong>Upload Methods:</strong>
            </p>
            <p style={{ margin: '0 0 0.3rem 0' }}>
              • <strong>Normal Upload</strong>: Direct storage, get rootHash, for large files and permanent storage
            </p>
            <p style={{ margin: 0 }}>
              • <strong>KV Upload</strong>: Base64 conversion, get custom key, for small files and quick access
            </p>
          </div>
        </div>
      )}

      {uploadStatus.message && (
        <div style={uploadStatus.status === 'success' ? successStyle : uploadStatus.status === 'error' ? errorStyle : {}}>
          <p>{uploadStatus.message}</p>
          {uploadStatus.hash && (
            <p>
              {uploadStatus.uploadType === 'normal' ? 'File Root Hash' : 'KV Storage Key'}:
              <code style={{ backgroundColor: 'white', padding: '2px 4px', borderRadius: '2px', marginLeft: '0.5rem' }}>
                {uploadStatus.hash}
              </code>
            </p>
          )}
          {uploadStatus.txHash && (
            <p>
              Transaction Hash:
              <code style={{ backgroundColor: 'white', padding: '2px 4px', borderRadius: '2px', marginLeft: '0.5rem' }}>
                {uploadStatus.txHash}
              </code>
            </p>
          )}
          {uploadStatus.status === 'success' && (
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              ✅ {uploadStatus.uploadType === 'normal'
                ? 'File successfully stored to 0G distributed file system'
                : 'Data successfully stored to 0G Key-Value storage system'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}