export interface McpConfig {
  baseUrl: string;
  apiKey?: string;
  tools: McpTool[];
}

export interface McpTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  endpoint: string;
  parameters: McpToolParameter[];
  config?: Record<string, any>;
}

export interface McpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  apiName: string;
}

export interface Message extends DatabaseRecord {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  conversationId?: string;
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
  apiEndpoint: string;
  maxTokens: number;
}