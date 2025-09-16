'use client';

import { useState } from 'react';

interface KVOperationStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  txHash?: string;
  value?: string;
}

export default function KeyValueStorage() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [streamId, setStreamId] = useState('');
  const [uploadStatus, setUploadStatus] = useState<KVOperationStatus>({ status: 'idle' });
  const [downloadKey, setDownloadKey] = useState('');
  const [downloadStreamId, setDownloadStreamId] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<KVOperationStatus>({ status: 'idle' });

  const handleUpload = async () => {
    if (!key || !value) {
      alert('Please fill in Key and Value');
      return;
    }

    setUploadStatus({ status: 'processing', message: 'Storing to 0G Key-Value Storage...' });

    try {
      const response = await fetch('/api/kv-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          streamId: streamId || undefined
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus({
          status: 'success',
          message: 'Data storage successful!',
          txHash: result.txHash
        });
      } else {
        setUploadStatus({
          status: 'error',
          message: result.error || 'Storage failed'
        });
      }
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Error occurred during storage'
      });
    }
  };

  const handleDownload = async () => {
    if (!downloadKey) {
      alert('Please fill in the Key to query');
      return;
    }

    setDownloadStatus({ status: 'processing', message: 'Retrieving data from 0G Key-Value Storage...' });

    try {
      const params = new URLSearchParams({
        key: downloadKey,
        ...(downloadStreamId && { streamId: downloadStreamId })
      });

      const response = await fetch(`/api/kv-download?${params}`);
      const result = await response.json();

      if (response.ok) {
        setDownloadStatus({
          status: 'success',
          message: 'Data retrieval successful!',
          value: result.value
        });
      } else {
        setDownloadStatus({
          status: 'error',
          message: result.error || 'Retrieval failed'
        });
      }
    } catch (error) {
      setDownloadStatus({
        status: 'error',
        message: 'Error occurred during retrieval'
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginRight: '1rem'
  };

  const sectionStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    backgroundColor: '#f9f9f9'
  };

  const successStyle: React.CSSProperties = {
    color: 'green',
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px'
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>0G Key-Value Storage</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Key-Value Storage supports data updates, suitable for configuration data, user settings and other scenarios.
        Based on 0G Batcher implementation, data will be permanently stored in the 0G distributed network.
      </p>

      {/* 数据存储部分 */}
      <div style={sectionStyle}>
        <h3>Store Data</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Key:
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter data key name"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Value:
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter data value to store"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Stream ID (Optional):
          </label>
          <input
            type="text"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            placeholder="Leave blank to use default Stream ID"
            style={inputStyle}
          />
          <small style={{ color: '#666' }}>
            Stream ID is used for data grouping, leave blank to use default value
          </small>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploadStatus.status === 'processing'}
          style={{
            ...buttonStyle,
            backgroundColor: uploadStatus.status === 'processing' ? '#6c757d' : '#007bff'
          }}
        >
          {uploadStatus.status === 'processing' ? 'Storing...' : 'Store to 0G KV Storage'}
        </button>

        {uploadStatus.message && (
          <div style={uploadStatus.status === 'success' ? successStyle : uploadStatus.status === 'error' ? errorStyle : {}}>
            <p><strong>{uploadStatus.message}</strong></p>
            {uploadStatus.txHash && (
              <div>
                <p>Transaction Hash: <code style={{ backgroundColor: 'white', padding: '2px 4px', borderRadius: '2px' }}>{uploadStatus.txHash}</code></p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  ✅ Data successfully stored to 0G distributed network
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 数据获取部分 */}
      <div style={sectionStyle}>
        <h3>Retrieve Data</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Key:
          </label>
          <input
            type="text"
            value={downloadKey}
            onChange={(e) => setDownloadKey(e.target.value)}
            placeholder="Enter key name to query"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Stream ID (Optional):
          </label>
          <input
            type="text"
            value={downloadStreamId}
            onChange={(e) => setDownloadStreamId(e.target.value)}
            placeholder="Leave blank to use default Stream ID"
            style={inputStyle}
          />
          <small style={{ color: '#666' }}>
            Should match the Stream ID used during storage
          </small>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloadStatus.status === 'processing'}
          style={{
            ...buttonStyle,
            backgroundColor: downloadStatus.status === 'processing' ? '#6c757d' : '#28a745'
          }}
        >
          {downloadStatus.status === 'processing' ? 'Retrieving...' : 'Retrieve from 0G KV Storage'}
        </button>

        {downloadStatus.message && (
          <div style={downloadStatus.status === 'success' ? successStyle : downloadStatus.status === 'error' ? errorStyle : {}}>
            <p><strong>{downloadStatus.message}</strong></p>
            {downloadStatus.value && (
              <div>
                <p><strong>Retrieved value:</strong></p>
                <pre style={{
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {downloadStatus.value}
                </pre>
              </div>
            )}
            {downloadStatus.status === 'error' && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                💡 Tip: KV reading function is currently being improved, please try again later
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}