export const config = {
  geminiApiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
  mcpBaseUrl: process.env.REACT_APP_MCP_BASE_URL || 'http://localhost:8081/sse',
  defaultModel: 'gemini-pro'
};

// API 키 유효성 검사
export const validateApiKey = (apiKey: string | undefined): boolean => {
  if (!apiKey) return false;
  if (apiKey.length === 0) return false;
  if (apiKey === 'your_api_key_here') return false;
  return true;
}; 