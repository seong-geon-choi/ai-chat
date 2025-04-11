import { ModelConfig } from '../types';

// 직접 ModelConfig 인터페이스 정의
interface ModelConfigExtended {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiName: string;
  apiKeyRequired: boolean;
  apiKeyName: string;
  apiKeyDescription: string;
  apiEndpoint: string;
  maxTokens: number;
  temperature?: number;
  icon?: string;
}

export const modelConfigs: ModelConfigExtended[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Google의 최신 대규모 언어 모델로, 고품질 응답과 복잡한 추론 능력을 제공합니다. 다양한 작업과 긴 컨텍스트 이해에 적합합니다.',
    apiName: 'gemini-1.5-pro',
    apiKeyRequired: true,
    apiKeyName: 'GOOGLE_API_KEY',
    apiKeyDescription: 'Google AI Studio에서 발급받은 API 키를 입력하세요 (https://aistudio.google.com/app/apikey)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    maxTokens: 1000000,
    temperature: 0.7
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Google의 최신 대규모 언어 모델로, 효율적이고 빠른 응답 속도를 제공합니다. 일상 대화 및 텍스트 생성에 최적화되어 있습니다.',
    apiName: 'gemini-2.0-flash',
    apiKeyRequired: true,
    apiKeyName: 'GOOGLE_API_KEY',
    apiKeyDescription: 'Google AI Studio에서 발급받은 API 키를 입력하세요 (https://aistudio.google.com/app/apikey)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
    maxTokens: 32000,
    temperature: 0.7
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    provider: 'google',
    description: 'Google의 Gemini 1.0 시리즈 대표 모델로, 다양한 자연어 처리와 생성 작업에 활용할 수 있습니다.',
    apiName: 'gemini-1.0-pro',
    apiKeyRequired: true,
    apiKeyName: 'GOOGLE_API_KEY',
    apiKeyDescription: 'Google AI Studio에서 발급받은 API 키를 입력하세요 (https://aistudio.google.com/app/apikey)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
    maxTokens: 32768,
    temperature: 0.7
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'OpenAI의 가장 강력한 모델로 복잡한 작업과 자연스러운 대화가 가능합니다.',
    apiName: 'gpt-4-turbo',
    apiKeyRequired: true,
    apiKeyName: 'OPENAI_API_KEY',
    apiKeyDescription: 'OpenAI 플랫폼에서 발급받은 API 키를 입력하세요',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 128000,
    temperature: 0.7
  },
  {
    id: 'claude-3',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Anthropic의 최신 모델로 자연스러운 대화와 정확한 정보 제공에 특화되어 있습니다.',
    apiName: 'claude-3-opus',
    apiKeyRequired: true,
    apiKeyName: 'ANTHROPIC_API_KEY',
    apiKeyDescription: 'Anthropic Console에서 발급받은 API 키를 입력하세요',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 200000,
    temperature: 0.7
  }
];

export const getModelConfig = (modelId: string): ModelConfigExtended | undefined => {
  return modelConfigs.find(model => model.id === modelId);
}; 