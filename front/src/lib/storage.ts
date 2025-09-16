// 简化的存储工具，主要功能已移至后端API
export function use0GStorage() {
  const downloadKeyValue = async (key: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/kv-download?key=${encodeURIComponent(key)}`);

      if (!response.ok) {
        throw new Error('KV download failed');
      }

      const result = await response.json();
      return result.success ? result.value : null;
    } catch (error) {
      console.error('KV download error:', error);
      return null;
    }
  };

  return {
    downloadKeyValue
  };
}