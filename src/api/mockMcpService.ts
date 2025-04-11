import { DatabaseRecord, LLMResponse, Message, Conversation } from '../types';
import { v4 as uuidv4 } from 'uuid';

// LLMModel 타입 직접 정의
interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  apiName: string;
  maxTokens?: number;
  temperature?: number;
}

// 샘플 모델 데이터
const mockModels: LLMModel[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    description: 'Google의 최신 AI 모델로 다양한 지식과 맥락 이해가 뛰어납니다.',
    apiName: 'gemini-pro',
    maxTokens: 30720,
    temperature: 0.7
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'OpenAI의 가장 강력한 모델로 복잡한 작업과 자연스러운 대화가 가능합니다.',
    apiName: 'gpt-4-turbo',
    maxTokens: 128000,
    temperature: 0.7
  },
  {
    id: 'claude-3',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Anthropic의 최신 모델로 자연스러운 대화와 정확한 정보 제공에 특화되어 있습니다.',
    apiName: 'claude-3-opus',
    maxTokens: 200000,
    temperature: 0.7
  }
];

// 샘플 대화 데이터
const mockConversations: Conversation[] = [
  {
    id: '1',
    title: '인공지능에 대한 질문',
    modelId: 'gpt-4',
    createdAt: new Date('2025-04-10T10:00:00Z').getTime(),
    updatedAt: new Date('2025-04-10T10:30:00Z').getTime(),
    messages: []
  },
  {
    id: '2',
    title: '데이터베이스 설계 도움말',
    modelId: 'claude-3',
    createdAt: new Date('2025-04-09T15:00:00Z').getTime(),
    updatedAt: new Date('2025-04-09T16:00:00Z').getTime(),
    messages: []
  }
];

// 샘플 메시지 데이터
const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '101',
      conversationId: '1',
      content: '인공지능이 무엇인가요?',
      role: 'user',
      timestamp: new Date('2025-04-10T10:00:00Z').getTime(),
      createdAt: new Date('2025-04-10T10:00:00Z').getTime(),
      updatedAt: new Date('2025-04-10T10:00:00Z').getTime()
    },
    {
      id: '102',
      conversationId: '1',
      content: '인공지능(AI)은 인간의 학습, 추론, 지각, 문제 해결 능력 등을 컴퓨터 시스템으로 구현한 기술입니다. 머신러닝, 딥러닝, 자연어 처리 등의 기술을 포함하며, 데이터를 기반으로 학습하고 의사결정을 내릴 수 있습니다.',
      role: 'assistant',
      timestamp: new Date('2025-04-10T10:00:30Z').getTime(),
      createdAt: new Date('2025-04-10T10:00:30Z').getTime(),
      updatedAt: new Date('2025-04-10T10:00:30Z').getTime()
    },
    {
      id: '103',
      conversationId: '1',
      content: '인공지능의 발전 역사에 대해 알려주세요.',
      role: 'user',
      timestamp: new Date('2025-04-10T10:15:00Z').getTime(),
      createdAt: new Date('2025-04-10T10:15:00Z').getTime(),
      updatedAt: new Date('2025-04-10T10:15:00Z').getTime()
    },
    {
      id: '104',
      conversationId: '1',
      content: '인공지능의 역사는 1950년대부터 시작되었습니다. 주요 이정표는 다음과 같습니다:\n\n1. 1950년대: 앨런 튜링의 "튜링 테스트" 제안, 첫 AI 프로그램 개발\n2. 1960-70년대: 초기 발전과 기대, 이후 "AI 겨울" 도래\n3. 1980년대: 전문가 시스템 등장\n4. 1990년대: 기계학습 발전 시작\n5. 2000년대: 빅데이터와 컴퓨팅 파워 증가\n6. 2010년대: 딥러닝 혁명, AlphaGo의 등장\n7. 현재: 대규모 언어 모델(LLM)과 생성형 AI의 발전',
      role: 'assistant',
      timestamp: new Date('2025-04-10T10:15:30Z').getTime(),
      createdAt: new Date('2025-04-10T10:15:30Z').getTime(),
      updatedAt: new Date('2025-04-10T10:15:30Z').getTime()
    }
  ],
  '2': [
    {
      id: '201',
      conversationId: '2',
      content: '효율적인 데이터베이스 설계 방법을 알려주세요.',
      role: 'user',
      timestamp: new Date('2025-04-09T15:00:00Z').getTime(),
      createdAt: new Date('2025-04-09T15:00:00Z').getTime(),
      updatedAt: new Date('2025-04-09T15:00:00Z').getTime()
    },
    {
      id: '202',
      conversationId: '2',
      content: '효율적인 데이터베이스 설계를 위한 주요 단계와 원칙은 다음과 같습니다:\n\n1. 요구사항 분석: 저장할 데이터와 수행할 작업 명확히 정의\n2. 개념적 설계: 엔티티-관계 다이어그램(ERD) 작성\n3. 논리적 설계: 테이블, 관계, 무결성 제약조건 정의\n4. 정규화: 중복 최소화를 위한 1NF~5NF 적용\n5. 인덱싱 전략: 쿼리 성능 최적화를 위한 인덱스 설계\n6. 물리적 설계: 저장소, 파티셔닝, 클러스터링 고려\n7. 보안 설계: 접근 제어 및 암호화 전략\n8. 백업 및 복구 전략 수립\n\n효율적인 설계의 핵심 원칙으로는 데이터 중복 최소화, 무결성 보장, 확장성 고려가 있습니다.',
      role: 'assistant',
      timestamp: new Date('2025-04-09T15:00:30Z').getTime(),
      createdAt: new Date('2025-04-09T15:00:30Z').getTime(),
      updatedAt: new Date('2025-04-09T15:00:30Z').getTime()
    }
  ]
};

// Mock API 함수들

// SQL 쿼리 실행 함수
export const executeSqlQuery = async (sql: string): Promise<DatabaseRecord[]> => {
  console.log('Mock SQL 쿼리 실행:', sql);
  
  // SELECT * FROM conversations ORDER BY updatedAt DESC
  if (sql.includes('SELECT * FROM conversations')) {
    return [...mockConversations];
  }
  
  // SELECT * FROM messages WHERE conversationId = 'X'
  if (sql.includes('SELECT * FROM messages WHERE conversationId')) {
    const match = sql.match(/conversationId = '(\d+)'/);
    const conversationId = match ? match[1] : '';
    return mockMessages[conversationId] || [];
  }
  
  return [];
};

// 채팅 응답 함수
export const getChatResponse = async (
  message: string,
  modelId: string,
  conversationId?: string,
  apiKey?: string
): Promise<LLMResponse> => {
  console.log(`Mock 채팅 응답: 메시지=${message}, 모델=${modelId}, 대화ID=${conversationId}, API키=${apiKey ? '설정됨' : '미설정'}`);
  
  // API 키가 설정되었는지 확인
  const hasApiKey = !!apiKey;
  
  // 1-2초 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // API 키가 없는 경우
  if (!hasApiKey) {
    return {
      id: uuidv4(),
      text: `이 모델을 사용하려면 ${getProviderName(modelId)} API 키를 설정해야 합니다. 모델 선택 패널에서 API 키를 설정해주세요.`,
      content: `이 모델을 사용하려면 ${getProviderName(modelId)} API 키를 설정해야 합니다. 모델 선택 패널에서 API 키를 설정해주세요.`,
      model: modelId,
      finishReason: 'api_key_required',
      createdAt: new Date()
    };
  }
  
  const mockResponses: { [key: string]: string } = {
    'gpt-4': `이것은 GPT-4의 응답입니다: "${message}"에 대한 답변입니다. OpenAI의 대형 언어 모델이 생성한 내용입니다.`,
    'claude-3': `Claude의 응답입니다: "${message}"에 대해 신중하게 생각해봤습니다. Anthropic에서 개발된 Claude 모델이 도움을 드립니다.`,
    'gemini-pro': `Gemini Pro의 응답입니다: "${message}"에 대한 분석 결과입니다. Google의 Gemini 모델이 제공하는 정보입니다.`
  };
  
  return {
    id: uuidv4(),
    text: mockResponses[modelId] || `"${message}"에 대한 AI 응답입니다.`,
    content: mockResponses[modelId] || `"${message}"에 대한 AI 응답입니다.`,
    model: modelId,
    finishReason: 'stop',
    createdAt: new Date()
  };
};

// 모델 ID로부터 제공자 이름 가져오기
const getProviderName = (modelId: string): string => {
  const model = mockModels.find(m => m.id === modelId);
  if (!model) return '';
  
  const providerNames: { [key: string]: string } = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google'
  };
  
  return providerNames[model.provider] || model.provider;
};

// 사용 가능한 모델 가져오기
export const getAvailableModels = async (): Promise<LLMModel[]> => {
  console.log('Mock 모델 목록 요청');
  return [...mockModels];
};

// 대화 목록 가져오기
export const getConversations = async (): Promise<DatabaseRecord[]> => {
  console.log('Mock 대화 목록 요청');
  return [...mockConversations];
};

// 대화 메시지 가져오기
export const getConversationMessages = async (conversationId: string): Promise<DatabaseRecord[]> => {
  console.log(`Mock 메시지 목록 요청: 대화ID=${conversationId}`);
  return mockMessages[conversationId] || [];
};

// Export everything as a single object
const mockService = {
  executeSqlQuery,
  getChatResponse,
  getAvailableModels,
  getConversations,
  getConversationMessages
};

export default mockService;
