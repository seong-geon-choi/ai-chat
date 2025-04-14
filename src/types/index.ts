export interface McpConfig {
  baseUrl: string;
  apiKey?: string;
  tools: McpTool[];
  models: LLMModel[];
  apiKeys: ApiKeyMap;
  cacheTimeout: number;
}

export interface McpTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  endpoint: string;
  parameters: McpToolParameter[];
  config?: Record<string, any>;
  priority: number;
  contextKeywords: string[];
  category: McpToolCategory;
}

export type McpToolCategory = 'database' | 'filesystem' | 'system' | 'api' | 'other';

export interface McpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  extractionRules?: ParameterExtractionRule[];
}

export interface ParameterExtractionRule {
  pattern: string;
  group?: number;
  transform?: (value: string) => any;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  apiName: string;
  maxTokens?: number;
  temperature?: number;
  apiEndpoint?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  mcpResults: McpToolResult[];
}

export interface Conversation extends DatabaseRecord {
  title: string;
  messages: Message[];
  modelId: string;
}

export interface DatabaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface LLMResponse {
  id: string;
  text: string;
  content: string;
  model: string;
  finishReason?: string;
  createdAt: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ApiKeyMap {
  [key: string]: string;
}

export interface ModelConfig extends LLMModel {
  apiKeyRequired: boolean;
  apiKeyName: string;
  apiKeyDescription: string;
  maxTokens: number;
  icon?: string;
}

export interface McpToolResult {
  success: boolean;
  toolName?: string;
  parameters?: Record<string, any>;
  data?: any;
  error?: string;
  timestamp?: number;
}

export interface McpContext {
  recentTools: string[];
  conversationContext: string[];
  userPreferences: Record<string, any>;
}

export interface CacheEntry {
  result: any;
  timestamp: number;
  params: Record<string, any>;
}

export * from './mcp';
export * from './google-genai';