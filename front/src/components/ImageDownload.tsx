'use client';

import { useState } from 'react';

interface DownloadStatus {
  status: 'idle' | 'downloading' | 'success' | 'error';
  message?: string;
}

export default function ImageDownload() {
  const [rootHash, setRootHash] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleDownload = async () => {
    if (!rootHash.trim()) {
      alert('Please enter rootHash');
      return;
    }

    setDownloadStatus({ status: 'downloading', message: 'Downloading from 0G Storage...' });
    setImageUrl('');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootHash: rootHash.trim() }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setDownloadStatus({
          status: 'success',
          message: 'Download successful!'
        });
      } else {
        const result = await response.json();
        setDownloadStatus({
          status: 'error',
          message: result.error || 'Download failed'
        });
      }
    } catch {
      setDownloadStatus({
        status: 'error',
        message: 'Error occurred during download'
      });
    }
  };

  const handleClear = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl('');
    setRootHash('');
    setDownloadStatus({ status: 'idle' });
  };

  const containerStyle: React.CSSProperties = {
    border: '2px dashed #28a745',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '1rem'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '1rem',
    fontFamily: 'monospace'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginRight: '0.5rem'
  };

  const clearButtonStyle: React.CSSProperties = {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  };

  const successStyle: React.CSSProperties = {
    color: 'green',
    marginTop: '1rem'
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    marginTop: '1rem'
  };

  const imageContainerStyle: React.CSSProperties = {
    marginTop: '1rem',
    textAlign: 'center',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#f8f9fa'
  };

  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  return (
    <div>
      <div style={containerStyle}>
        <h3 style={{ marginTop: 0, color: '#28a745' }}>Download Images from 0G Storage</h3>
        <input
          type="text"
          placeholder="Enter rootHash (e.g.: 0x1234567890abcdef...)"
          value={rootHash}
          onChange={(e) => setRootHash(e.target.value)}
          style={inputStyle}
        />
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleDownload}
            disabled={downloadStatus.status === 'downloading'}
            style={{
              ...buttonStyle,
              backgroundColor: downloadStatus.status === 'downloading' ? '#6c757d' : '#28a745'
            }}
          >
            {downloadStatus.status === 'downloading' ? 'Downloading...' : 'Download Image'}
          </button>
          {(imageUrl || rootHash) && (
            <button
              onClick={handleClear}
              style={clearButtonStyle}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {downloadStatus.message && (
        <div style={downloadStatus.status === 'success' ? successStyle : downloadStatus.status === 'error' ? errorStyle : {}}>
          <p>{downloadStatus.message}</p>
        </div>
      )}

      {imageUrl && (
        <div style={imageContainerStyle}>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>Downloaded image:</p>
          <img src={imageUrl} alt="Downloaded from 0G Storage" style={imageStyle} />
          <div style={{ marginTop: '1rem' }}>
            <a
              href={imageUrl}
              download={`0g-storage-image-${Date.now()}.jpg`}
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              Save to Local
            </a>
          </div>
        </div>
      )}
    </div>
  );
}