import { useState, useEffect } from 'react';
import { ApiKeyMap } from '../types';

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyMap>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = () => {
    try {
      const savedKeys = localStorage.getItem('llm_api_keys');
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    } catch (err) {
      setError('API 키를 불러오는 중 오류가 발생했습니다.');
      console.error('Error loading API keys:', err);
    }
  };

  const saveApiKey = (modelId: string, apiKey: string) => {
    try {
      const updatedKeys = { ...apiKeys, [modelId]: apiKey };
      localStorage.setItem('llm_api_keys', JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      setError('');
    } catch (err) {
      setError('API 키를 저장하는 중 오류가 발생했습니다.');
      console.error('Error saving API key:', err);
    }
  };

  const removeApiKey = (modelId: string) => {
    try {
      const updatedKeys = { ...apiKeys };
      delete updatedKeys[modelId];
      localStorage.setItem('llm_api_keys', JSON.stringify(updatedKeys));
      setApiKeys(updatedKeys);
      setError('');
    } catch (err) {
      setError('API 키를 삭제하는 중 오류가 발생했습니다.');
      console.error('Error removing API key:', err);
    }
  };

  return {
    apiKeys,
    error,
    saveApiKey,
    removeApiKey,
  };
}; 