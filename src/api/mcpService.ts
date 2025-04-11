import axios from 'axios';
import { DatabaseRecord, LLMResponse, ApiKeyMap, LLMModel } from '../types';
import mockService from './mockMcpService';
import * as geminiService from '../services/geminiService';
import { getAvailableModels as getMockModels } from './mockMcpService';
import { v4 as uuidv4 } from 'uuid';
import { Message, Conversation } from '../types';

// 환경 설정
export const CONFIG = {
  API_URL: process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001',
  USE_MOCK: process.env.REACT_APP_USE_MOCK === 'true',
  BASE_PATH: '/api'
};

// 커스텀 에러 클래스
export class McpServiceError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'McpServiceError';
  }
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// API 키 관리
const getApiKeys = (): Record<string, string> => {
  try {
    // model_api_keys와 llm_api_keys 모두에서 API 키 로드
    const modelKeys = localStorage.getItem('model_api_keys');
    const llmKeys = localStorage.getItem('llm_api_keys');
    
    let keys: Record<string, string> = {};
    
    // 먼저 model_api_keys에서 키 로드
    if (modelKeys) {
      keys = {...keys, ...JSON.parse(modelKeys)};
    }
    
    // 그 다음 llm_api_keys에서 키 로드하여 덮어쓰기 (더 최신)
    if (llmKeys) {
      keys = {...keys, ...JSON.parse(llmKeys)};
    }
    
    console.log(`[DEBUG] 로드된 API 키:`, Object.keys(keys));
    return keys;
  } catch (error) {
    console.error('API 키 로드 중 오류:', error);
    return {};
  }
};

// MCP 서버 연결 테스트
export const testMcpConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${baseUrl}/health`);
    return response.status === 200;
  } catch (error) {
    throw new McpServiceError('MCP 서버 연결 실패', 'CONNECTION_ERROR', error);
  }
};

// SQL 쿼리 실행
export const executeSqlQuery = async (sql: string): Promise<ApiResponse<DatabaseRecord[]>> => {
  if (CONFIG.USE_MOCK) {
    return {
      data: await mockService.executeSqlQuery(sql),
      status: 200
    };
  }

  try {
    const response = await axios.post(`${CONFIG.BASE_PATH}/mysql/query`, { sql });
    return {
      data: response.data.results,
      status: response.status
    };
  } catch (error: any) {
    throw new McpServiceError(
      '쿼리 실행 중 오류가 발생했습니다.',
      'SQL_ERROR',
      error.response?.data
    );
  }
};

// 채팅 응답 생성
export const getChatResponse = async (
  message: string,
  modelId: string,
  conversationId?: string
): Promise<ApiResponse<LLMResponse>> => {
  try {
    console.log(`[DEBUG] getChatResponse 호출: modelId=${modelId}, conversationId=${conversationId}`);
    const apiKeys = getApiKeys();
    console.log(`[DEBUG] 사용 가능한 API 키:`, Object.keys(apiKeys));
    
    // 모델 ID로 API 키 가져오기 (정확한 모델 ID로 시도)
    let apiKey = apiKeys[modelId];
    
    // 정확한 ID로 키를 찾지 못한 경우 'gemini'가 포함된 모델이면 'gemini-2.0-flash'의 키를 시도
    if (!apiKey && modelId.includes('gemini')) {
      apiKey = apiKeys['gemini-2.0-flash'];
      console.log(`[DEBUG] gemini-2.0-flash의 API 키로 대체: ${apiKey ? '성공' : '실패'}`);
    }
    
    console.log(`[DEBUG] 최종 선택된 API 키:`, apiKey ? '설정됨' : '미설정');
    
    if (!apiKey) {
      console.error(`[ERROR] ${modelId} 모델의 API 키가 없습니다.`);
      throw new McpServiceError(
        `${modelId} 모델을 사용하려면 API 키를 설정해야 합니다.`,
        'API_KEY_MISSING'
      );
    }

    // Gemini 모델 처리
    if (modelId.includes('gemini')) {
      try {
        console.log(`[DEBUG] Gemini API 호출 시작 (API 키 길이: ${apiKey.length}글자)`);
        await geminiService.setGeminiApiKey(apiKey);
        // 공식 Gemini API 형식에 맞게 요청 생성
        const response = await geminiService.generateChatResponse(message);
        console.log(`[DEBUG] Gemini API 호출 성공`);
        return {
          data: response,
          status: 200
        };
      } catch (error: any) {
        console.error(`[ERROR] Gemini API 호출 실패:`, error);
        // 기존 오류 객체를 전달
        if (error.name === 'GeminiAPIError') {
          throw error;
        }
        throw new McpServiceError('Gemini API 오류', 'GEMINI_ERROR', error);
      }
    }

    // MCP 서버 요청
    const response = await axios.post(`${CONFIG.API_URL}${CONFIG.BASE_PATH}/chat`, {
      message,
      modelId,
      conversationId,
      apiKey
    });

    if (!response.data || !response.data.content) {
      throw new McpServiceError('API 응답이 올바르지 않습니다.', 'INVALID_RESPONSE');
    }

    return {
      data: {
        id: uuidv4(),
        text: response.data.content,
        content: response.data.content,
        model: modelId,
        finishReason: response.data.finishReason || 'stop',
        createdAt: new Date(),
        usage: response.data.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      },
      status: response.status
    };

  } catch (error: any) {
    if (error instanceof McpServiceError) {
      throw error;
    }
    throw new McpServiceError(
      error.message || '채팅 응답 처리 중 오류가 발생했습니다.',
      'CHAT_ERROR',
      error.response?.data
    );
  }
};

// 사용 가능한 모델 목록
export const getAvailableModels = async (): Promise<ApiResponse<LLMModel[]>> => {
  if (CONFIG.USE_MOCK) {
    const models = await getMockModels();
    return {
      data: models,
      status: 200
    };
  }

  try {
    const response = await axios.get(`${CONFIG.BASE_PATH}/models`);
    return {
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    throw new McpServiceError(
      '모델 목록을 가져오는 중 오류가 발생했습니다.',
      'MODELS_ERROR',
      error.response?.data
    );
  }
};

// 대화 목록 조회
export const getConversations = async (): Promise<ApiResponse<Conversation[]>> => {
  try {
    const response = await axios.get(`${CONFIG.API_URL}${CONFIG.BASE_PATH}/conversations`);
    return {
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    throw new McpServiceError(
      '대화 목록을 가져오는 중 오류가 발생했습니다.',
      'CONVERSATIONS_ERROR',
      error.response?.data
    );
  }
};

// 대화 메시지 조회
export const getConversationMessages = async (conversationId: string): Promise<ApiResponse<Message[]>> => {
  try {
    const response = await axios.get(
      `${CONFIG.API_URL}${CONFIG.BASE_PATH}/conversations/${conversationId}/messages`
    );
    return {
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    throw new McpServiceError(
      '메시지 목록을 가져오는 중 오류가 발생했습니다.',
      'MESSAGES_ERROR',
      error.response?.data
    );
  }
};

export default {
  testMcpConnection,
  getChatResponse,
  getConversations,
  getConversationMessages,
  CONFIG
};
