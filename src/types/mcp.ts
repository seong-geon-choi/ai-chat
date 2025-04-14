export interface McpServerConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryCount?: number;
}

export interface McpToolConfig {
  name: string;
  description: string;
  endpoint: string;
  parameters: McpToolParameter[];
  category: 'database' | 'filesystem' | 'api' | 'system' | 'other';
  enabled: boolean;
}

export interface McpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface McpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

export interface McpError {
  code: string;
  message: string;
  details?: any;
} 