export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
}

export interface McpConfig {
  baseUrl: string;
  tools: McpTool[];
  models: LLMModel[];
  apiKeys: ApiKeyMap;
}

export interface McpTool {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  parameters: McpToolParameter[];
  enabled: boolean;
}

export interface McpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface LLMResponse {
  id: string;
  text: string;
  content: string;
  model: string;
  finishReason: string;
  createdAt: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface DatabaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiKeyMap {
  [modelId: string]: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  apiName: string;
  maxTokens?: number;
  temperature?: number;
  apiEndpoint?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiName: string;
  apiKeyRequired: boolean;
  apiKeyName: string;
  apiKeyDescription: string;
  maxTokens: number;
  temperature?: number;
  apiEndpoint?: string;
  icon?: string;
}

// ... rest of the types ... 