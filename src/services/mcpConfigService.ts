import type { McpConfig, McpTool, LLMModel, ApiKeyMap } from '../types';

// 기본 설정
const DEFAULT_CONFIG: any = {
  baseUrl: 'http://localhost:3001',
  tools: [],
  models: [],
  apiKeys: {}
};

// 설정 로드
export const loadMcpConfig = (): any => {
  try {
    const savedConfig = localStorage.getItem('mcp_config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('설정을 불러오는 중 오류가 발생했습니다:', error);
    return DEFAULT_CONFIG;
  }
};

// 설정 저장
export const saveMcpConfig = (config: any): void => {
  try {
    localStorage.setItem('mcp_config', JSON.stringify(config));
  } catch (error) {
    console.error('설정을 저장하는 중 오류가 발생했습니다:', error);
  }
};

// 도구 추가/수정
export const addTool = (config: any, tool: McpTool): any => {
  const updatedConfig = {
    ...config,
    tools: config.tools.map((t: any) => t.id === tool.id ? tool : t)
  };
  if (!config.tools.find((t: any) => t.id === tool.id)) {
    updatedConfig.tools.push(tool);
  }
  return updatedConfig;
};

// 도구 제거
export const removeTool = (config: any, toolId: string): any => {
  return {
    ...config,
    tools: config.tools.filter((t: any) => t.id !== toolId)
  };
};

// 도구 활성화/비활성화
export const toggleToolEnabled = (config: any, toolId: string): any => {
  return {
    ...config,
    tools: config.tools.map((t: any) =>
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    )
  };
};