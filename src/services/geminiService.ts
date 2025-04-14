import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMResponse } from '../types';

// Gemini API 인스턴스 관리
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// 재시도 설정
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// SDK 버전 정보 로깅
console.log('GoogleGenerativeAI SDK 로드됨:', typeof GoogleGenerativeAI);
try {
  // SDK 버전 확인 시도
  const sdkInfo = {
    name: '@google/generative-ai',
    version: require('@google/generative-ai/package.json').version
  };
  console.log('GoogleGenerativeAI SDK 버전:', sdkInfo.version);
} catch (e) {
  console.log('GoogleGenerativeAI SDK 버전 확인 실패');
}

// API 초기화 상태 추적 변수 추가
let isApiInitialized = false;

// 초기 메시지 자동 전송 함수 제거 또는 간단한 성공 응답만 반환하도록 변경
export const sendInitialMessage = async (): Promise<LLMResponse> => {
  console.log('초기화 완료 메시지 반환...');
  // 빈 응답 반환
  return {
    id: Date.now().toString(),
    text: '채팅이 시작되었습니다.',
    content: '채팅이 시작되었습니다.',
    model: 'gemini-2.0-flash',
    finishReason: 'stop',
    createdAt: new Date(),
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
};

// Gemini API 키 설정 및 초기화
export const setGeminiApiKey = async (apiKey: string) => {
  try {
    console.log('====== Gemini API 초기화 시작 ======');
    
    // API 키 검증 및 전처리
    if (!apiKey) {
      console.error('API 키가 null 또는 undefined입니다.');
      throw new Error('API 키가 비어있습니다.');
    }
    
    // 공백 제거
    const trimmedApiKey = apiKey.trim();
    console.log(`API 키 길이: ${trimmedApiKey.length} 글자, 시작 문자: ${trimmedApiKey.substring(0, 3)}...`);
    
    // 최소 길이 검증 (Google API 키는 보통 39자 이상)
    if (trimmedApiKey.length < 30) {
      console.error(`API 키가 너무 짧습니다. (${trimmedApiKey.length} 글자)`);
      throw new Error('API 키가 유효하지 않습니다. 올바른 Google API 키를 입력해주세요.');
    }

    // 허용된 문자만 포함하는지 확인 (영문, 숫자, 특수문자 일부)
    const validKeyPattern = /^[A-Za-z0-9\-_]+$/;
    if (!validKeyPattern.test(trimmedApiKey)) {
      console.error('API 키에 유효하지 않은 문자가 포함되어 있습니다.');
      throw new Error('API 키에 유효하지 않은 문자가 포함되어 있습니다.');
    }

    console.log('API 키 검증 완료, Google AI SDK 초기화 중...');
    
    // API 인스턴스 생성
    try {
      genAI = new GoogleGenerativeAI(trimmedApiKey);
      console.log('GoogleGenerativeAI 인스턴스 생성 성공');
    } catch (error: any) {
      console.error('GoogleGenerativeAI 인스턴스 생성 실패:', error);
      genAI = null;
      model = null;
      isApiInitialized = false;
      throw new Error('Google AI SDK 초기화에 실패했습니다: ' + error.message);
    }
    
    // 모델 초기화
    try {
      // Gemini 모델 API 버전 확인 및 초기화 코드 구조화
      const modelName = "gemini-2.0-flash";
      console.log(`모델 초기화 시도: ${modelName}`);
      
      // 최신 SDK 버전에 맞게 초기화 코드 구조화
      model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        }
      });

      console.log(`${modelName} 모델 초기화 성공`);
      
      // Gemini SDK 인스턴스/모델 객체 검증
      if (!model) {
        genAI = null;
        model = null;
        isApiInitialized = false;
        throw new Error('모델 객체가 초기화되지 않았습니다.');
      }
      
      console.log('[DEBUG] 모델 객체 속성:', Object.keys(model).join(', '));
    } catch (error: any) {
      console.error('모델 초기화 실패:', error);
      genAI = null;
      model = null;
      isApiInitialized = false;
      throw new Error('Gemini 모델 초기화에 실패했습니다: ' + error.message);
    }
    
    console.log('====== Gemini API 초기화 완료 ======');
    
    // 테스트 요청으로 API 키 유효성 검증
    try {
      console.log('API 키 유효성 검증을 위한 테스트 요청 시도...');
      // 간단한 테스트 메시지로 API 호출
      console.log('[DEBUG] 테스트 요청 전송...');
      const testResult = await model.generateContent({
        contents: [
          {
            parts: [
              { text: "테스트" }
            ]
          }
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      });
      
      // 응답 구조 디버깅
      console.log('[DEBUG] 테스트 응답 구조:', Object.keys(testResult));
      
      // 응답 확인 (최신 SDK에 맞게 응답 처리)
      let testText = '';
      
      // 새로운 방식으로 텍스트 추출 시도
      if (testResult.response) {
        console.log('[DEBUG] response 속성 발견:', Object.keys(testResult.response));
        if (typeof testResult.response.text === 'function') {
          testText = testResult.response.text();
        } else {
          testText = String(testResult.response.text || 'No text found');
        }
      } else if (testResult.candidates && testResult.candidates.length > 0) {
        console.log('[DEBUG] candidates 속성 발견:', testResult.candidates.length);
        const candidate = testResult.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          testText = candidate.content.parts[0].text || '빈 응답';
        } else {
          console.log('[DEBUG] candidate 구조:', JSON.stringify(candidate, null, 2));
          testText = '응답 구조 확인 필요';
        }
      } else if (typeof testResult.text === 'function') {
        testText = testResult.text();
      } else if (testResult.text) {
        testText = testResult.text;
      } else {
        console.log('[DEBUG] 응답 전체 구조:', JSON.stringify(testResult, null, 2));
        testText = '테스트 성공 (응답 구조 확인 필요)';
      }
      
      console.log('테스트 요청 성공, API 키가 유효합니다. 응답:', testText.substring(0, 30) + '...');
      
      // API 초기화 성공 후 키를 양쪽 스토리지에 저장
      try {
        // model_api_keys와 llm_api_keys 모두에 저장
        const modelKeys = localStorage.getItem('model_api_keys');
        const llmKeys = localStorage.getItem('llm_api_keys');
        
        let modelKeysObj = modelKeys ? JSON.parse(modelKeys) : {};
        let llmKeysObj = llmKeys ? JSON.parse(llmKeys) : {};
        
        modelKeysObj['gemini-2.0-flash'] = trimmedApiKey;
        llmKeysObj['gemini-2.0-flash'] = trimmedApiKey;
        
        localStorage.setItem('model_api_keys', JSON.stringify(modelKeysObj));
        localStorage.setItem('llm_api_keys', JSON.stringify(llmKeysObj));
        
        console.log('API 키가 로컬 스토리지에 성공적으로 저장되었습니다.');
        
        // 초기화 상태 업데이트
        isApiInitialized = true;
      } catch (storageError) {
        console.error('API 키 저장 중 오류:', storageError);
        // 키 저장 실패는 초기화 성공에 영향을 주지 않음
        // 여전히 초기화는 성공한 것으로 간주
        isApiInitialized = true;
      }
    } catch (error: any) {
      console.error('API 키 유효성 검증 실패:', error);
      genAI = null;
      model = null;
      isApiInitialized = false;
      throw new Error('API 키가 유효하지 않거나 권한이 없습니다: ' + error.message);
    }
    
    // API 초기화 후 자동으로 초기 메시지 전송하는 부분 제거
    console.log('API 초기화 완료, 초기 응답 반환');
    return {
      id: Date.now().toString(),
      text: '초기화 완료',
      content: '초기화 완료',
      model: 'gemini-2.0-flash',
      finishReason: 'stop',
      createdAt: new Date(),
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  } catch (error) {
    console.error('====== Gemini API 초기화 실패 ======');
    console.error('오류 상세:', error);
    genAI = null;
    model = null;
    isApiInitialized = false;
    throw error;
  }
};

// Gemini API를 사용하여 채팅 응답 생성
export const generateChatResponse = async (message: string): Promise<LLMResponse> => {
  console.log('============= Gemini 채팅 응답 생성 시도 =============');
  
  // API 및 모델 상태 확인 - isApiInitialized 변수를 사용하여 초기화 상태 확인
  if ((!genAI || !model) && !isApiInitialized) {
    console.error('Gemini API 또는 모델이 초기화되지 않음. genAI:', !!genAI, ', model:', !!model, ', isApiInitialized:', isApiInitialized);
    
    // API 키를 로컬 스토리지에서 직접 재시도
    try {
      // 두 가지 키 저장소에서 모두 확인
      const modelKeys = localStorage.getItem('model_api_keys');
      const llmKeys = localStorage.getItem('llm_api_keys');
      
      let apiKey: string | null = null;
      
      // 먼저 llm_api_keys에서 키 시도 (더 우선순위 높음)
      if (llmKeys) {
        const keys = JSON.parse(llmKeys);
        apiKey = keys['gemini-2.0-flash'];
      }
      
      // 없으면 model_api_keys에서 시도
      if (!apiKey && modelKeys) {
        const keys = JSON.parse(modelKeys);
        apiKey = keys['gemini-2.0-flash'];
      }
      
      // API 키가 있으면 자동 초기화 시도
      if (apiKey) {
        console.log('로컬 스토리지에서 Gemini API 키를 찾았습니다. 자동 초기화 시도...');
        await setGeminiApiKey(apiKey);
      } else {
        const detailedError = new Error(
          'Gemini API가 초기화되지 않았습니다. API 키를 설정해주세요.\n\n' +
          '원인: API 키가 설정되어 있지 않거나 유효하지 않습니다.\n' +
          '해결 방법:\n' +
          '1. 왼쪽 모델 설정 패널에서 Gemini 모델을 선택하세요.\n' +
          '2. 유효한 Google API 키를 입력하세요. (AI Studio에서 발급 가능)\n' +
          '3. 입력 후 다시 대화를 시도하세요.'
        );
        throw detailedError;
      }
    } catch (error: any) {
      // 기존 오류에 상세 정보 추가
      const detailedError = new Error(
        `Gemini API가 초기화되지 않았습니다. API 키를 다시 설정해주세요.\n\n` +
        `원인: ${error.message || '알 수 없는 오류'}\n` +
        `해결 방법:\n` +
        `1. 왼쪽 모델 설정 패널에서 Gemini 모델을 선택하세요.\n` +
        `2. 유효한 Google API 키를 입력하세요. (AI Studio에서 발급 가능)\n` +
        `3. API 키 형식이 올바른지 확인하세요. (공백 없이 39자 이상)\n` +
        `4. 인터넷 연결 상태를 확인하세요.\n` +
        `5. 입력 후 다시 대화를 시도하세요.`
      );
      throw detailedError;
    }
  } else {
    // API가 이미 초기화된 상태이지만 model이 null인 경우 (비정상적인 상태)
    if (!model) {
      console.log('isApiInitialized가 true이지만 model이 null입니다. 세션 복구 시도...');
      try {
        // API 키 재설정 시도
        const modelKeys = localStorage.getItem('model_api_keys');
        const llmKeys = localStorage.getItem('llm_api_keys');
        
        let apiKey: string | null = null;
        if (llmKeys) {
          const keys = JSON.parse(llmKeys);
          apiKey = keys['gemini-2.0-flash'];
        }
        if (!apiKey && modelKeys) {
          const keys = JSON.parse(modelKeys);
          apiKey = keys['gemini-2.0-flash'];
        }
        
        if (apiKey) {
          await setGeminiApiKey(apiKey);
        }
      } catch (error) {
        console.error('세션 복구 실패:', error);
        // 복구 실패 시 초기화 상태 업데이트
        isApiInitialized = false;
        throw new Error('세션이 만료되었습니다. 페이지를 새로고침하고 다시 시도해주세요.');
      }
    }
  }

  console.log('Gemini API 모델 상태 확인 완료. 모델:', model.model);
  
  let lastError: any = null;
  
  // 재시도 로직
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 메시지 전송 및 응답 대기
      console.log(`[DEBUG] 시도 ${attempt}/${MAX_RETRIES}: API 요청 시작, 메시지 길이: ${message.length}자`);
      
      // Promise.race를 사용하여 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('[DEBUG] 요청 타임아웃 발생 (30초)');
          reject(new Error('REQUEST_TIMEOUT'));
        }, 30000);
      });
      
      console.log('[DEBUG] Gemini API 요청 전송 준비 완료');
      
      try {
        // 공식 문서 방식으로 generateContent 호출
        console.log('[DEBUG] model.generateContent 호출 준비 - 메시지:', message);
        
        // 요청 형식을 공식 문서의 Python 예제처럼 구조화
        const resultPromise = model.generateContent({
          contents: [
            {
              parts: [
                { text: message }
              ]
            }
          ],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        });
        
        console.log('[DEBUG] model.generateContent 호출 성공, 응답 대기 중...');
        
        const result = await Promise.race([resultPromise, timeoutPromise]);
        console.log('[DEBUG] 응답 수신 성공');
        console.log('[DEBUG] 응답 구조:', Object.keys(result));
        
        // 텍스트 추출 (최신 SDK 형식 지원)
        let text = '';
        
        // 다양한 응답 형식 처리
        if (result.response) {
          console.log('[DEBUG] response 속성 발견:', Object.keys(result.response));
          if (typeof result.response.text === 'function') {
            text = result.response.text();
          } else {
            text = String(result.response.text || '');
          }
        } else if (result.candidates && result.candidates.length > 0) {
          console.log('[DEBUG] candidates 속성 발견:', result.candidates.length);
          const candidate = result.candidates[0];
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts[0].text || '';
          } else {
            console.log('[DEBUG] candidate 구조:', JSON.stringify(candidate, null, 2));
            throw new Error('응답에서 텍스트를 추출할 수 없습니다.');
          }
        } else if (typeof result.text === 'function') {
          text = result.text();
        } else if (result.text) {
          text = result.text;
        } else {
          console.log('[DEBUG] 응답 전체 구조:', JSON.stringify(result, null, 2));
          throw new Error('응답에서 텍스트를 추출할 수 없습니다.');
        }
        
        console.log('[DEBUG] 텍스트 추출 성공, 길이:', text.length);
        
        // 응답 검증
        if (!text || text.trim() === '') {
          console.log('[DEBUG] 빈 응답 수신됨');
          throw new Error('EMPTY_RESPONSE');
        }
        
        console.log('[DEBUG] 유효한 응답 수신 완료, 응답 반환 준비');
        
        // 응답 포맷팅
        return {
          id: Date.now().toString(),
          text: text,
          content: text,
          model: 'gemini-2.0-flash',
          finishReason: 'stop',
          createdAt: new Date(),
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
      } catch (innerError) {
        console.error('[DEBUG] API 호출 내부 오류:', innerError);
        throw innerError;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[DEBUG] 에러 발생 시점:`, new Date().toISOString());
      console.error('[DEBUG] 에러 상세 정보:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response,
        config: error.config
      });
      
      // 네트워크 관련 에러 상세 분류
      const networkErrors = {
        'Network Error': 'NETWORK_CONNECTION_ERROR',
        'REQUEST_TIMEOUT': 'REQUEST_TIMEOUT_ERROR',
        'ECONNREFUSED': 'CONNECTION_REFUSED_ERROR',
        'ECONNRESET': 'CONNECTION_RESET_ERROR',
        'ETIMEDOUT': 'CONNECTION_TIMEOUT_ERROR'
      };

      const errorType = Object.entries(networkErrors).find(([key]) => 
        error.message.includes(key)
      );

      if (errorType) {
        console.log(`[DEBUG] 감지된 네트워크 에러 유형: ${errorType[1]}`);
        if (attempt < MAX_RETRIES) {
          const delayTime = RETRY_DELAY * Math.pow(2, attempt - 1); // 지수 백오프
          console.log(`[DEBUG] ${delayTime}ms 후 재시도 예정`);
          await delay(delayTime);
          continue;
        }
      }
      
      break;
    }
  }
  
  // 모든 재시도 실패 후 에러 처리
  console.error('[DEBUG] 최종 에러 발생. 모든 재시도 실패');
  console.error('[DEBUG] 마지막 에러 상세 정보:', {
    originalError: lastError,
    stack: lastError.stack,
    config: lastError.config
  });

  let errorCode = 'UNKNOWN_ERROR';
  let errorMessage = lastError.message || '알 수 없는 오류';

  // 에러 타입 세분화
  if (lastError.message.includes('Network Error')) {
    errorCode = 'NETWORK_CONNECTION_ERROR';
    errorMessage = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
  } else if (lastError.message.includes('timeout')) {
    errorCode = 'REQUEST_TIMEOUT_ERROR';
    errorMessage = '요청 시간이 초과되었습니다. (30초)';
  } else if (lastError.response?.status === 400) {
    errorCode = 'INVALID_ARGUMENT';
    errorMessage = '요청 형식이 올바르지 않습니다. API 형식을 확인해주세요.';
  } else if (lastError.response?.status === 401) {
    errorCode = 'AUTHENTICATION_ERROR';
    errorMessage = 'API 키가 유효하지 않습니다. API 키를 확인해주세요.';
  } else if (lastError.response?.status === 403) {
    errorCode = 'PERMISSION_ERROR';
    errorMessage = 'API 접근 권한이 없습니다. 프로젝트 설정을 확인해주세요.';
  } else if (lastError.response?.status === 404) {
    errorCode = 'NOT_FOUND';
    errorMessage = '요청한 리소스를 찾을 수 없습니다. 모델 이름을 확인해주세요.';
  } else if (lastError.response?.status === 429) {
    errorCode = 'RATE_LIMIT_ERROR';
    errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  } else if (lastError.response?.status === 500) {
    errorCode = 'INTERNAL_ERROR';
    errorMessage = 'Gemini API 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  } else if (lastError.response?.status === 503) {
    errorCode = 'SERVICE_UNAVAILABLE';
    errorMessage = 'Gemini API 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  // 상세한 에러 메시지 및 해결 방법 제공
  const detailedMessages = {
    'NETWORK_CONNECTION_ERROR': 
      '네트워크 연결에 실패했습니다.\n\n' +
      '원인: 인터넷 연결이 불안정하거나 차단되었습니다.\n' +
      '해결 방법:\n' +
      '1. 인터넷 연결 상태를 확인해주세요.\n' +
      '2. 방화벽이나 프록시 설정을 확인해주세요.\n' +
      '3. 다른 네트워크 환경에서 시도해보세요.',
    
    'REQUEST_TIMEOUT_ERROR': 
      '요청 시간이 초과되었습니다.\n\n' +
      '원인: Google 서버 응답이 지연되고 있습니다.\n' +
      '해결 방법:\n' +
      '1. 잠시 후 다시 시도해주세요.\n' +
      '2. 더 짧은 메시지로 시도해보세요.\n' +
      '3. 인터넷 연결 상태를 확인해주세요.',
    
    'AUTHENTICATION_ERROR': 
      'API 키 인증에 실패했습니다.\n\n' +
      '원인: API 키가 유효하지 않거나 만료되었습니다.\n' +
      '해결 방법:\n' +
      '1. API 키가 올바르게 입력되었는지 확인하세요.\n' +
      '2. Google AI Studio에서 새로운 API 키를 발급받으세요.\n' +
      '3. API 키에 Gemini 모델 사용 권한이 있는지 확인하세요.',
    
    'PERMISSION_ERROR': 
      'API 접근 권한이 없습니다.\n\n' +
      '원인: API 키에 필요한 권한이 없거나 프로젝트 설정에 문제가 있습니다.\n' +
      '해결 방법:\n' +
      '1. Google Cloud 콘솔에서 API 키 권한을 확인하세요.\n' +
      '2. Gemini API가 프로젝트에서 활성화되어 있는지 확인하세요.\n' +
      '3. 결제 정보가 필요한 경우 결제 설정을 확인하세요.',
    
    'RATE_LIMIT_ERROR': 
      'API 요청 한도를 초과했습니다.\n\n' +
      '원인: 짧은 시간 내에 너무 많은 요청을 보냈습니다.\n' +
      '해결 방법:\n' +
      '1. 잠시 기다린 후 다시 시도해주세요.\n' +
      '2. 요청 빈도를 줄여주세요.\n' +
      '3. Google Cloud 콘솔에서 할당량 설정을 확인하세요.',
    
    'UNKNOWN_ERROR': 
      '알 수 없는 오류가 발생했습니다.\n\n' +
      '원인: ' + lastError.message + '\n' +
      '해결 방법:\n' +
      '1. API 키를 다시 설정해보세요.\n' +
      '2. 브라우저를 새로고침하거나 캐시를 삭제해보세요.\n' +
      '3. 잠시 후 다시 시도해주세요.'
  };

  // 세부 오류 메시지 선택 (없으면 기본 메시지 사용)
  const detailedMessage = detailedMessages[errorCode as keyof typeof detailedMessages] || 
    `${errorMessage}\n\n원인: ${lastError.message}\n해결 방법: API 키를 다시 설정하고 다시 시도해주세요.`;

  const errorInfo = {
    code: errorCode,
    message: detailedMessage,
    details: {
      name: lastError.name,
      originalMessage: lastError.message,
      status: lastError.response?.status,
      statusText: lastError.response?.statusText,
      data: lastError.response?.data,
      config: {
        url: lastError.config?.url,
        method: lastError.config?.method,
        timeout: lastError.config?.timeout
      }
    },
    retryAttempts: MAX_RETRIES,
    timestamp: new Date().toISOString(),
    suggestions: [
      errorCode === 'NETWORK_CONNECTION_ERROR' && '인터넷 연결 상태를 확인해주세요.',
      errorCode === 'REQUEST_TIMEOUT_ERROR' && '서버 부하가 높을 수 있으니 잠시 후 다시 시도해주세요.',
      errorCode === 'AUTHENTICATION_ERROR' && 'API 키가 올바르게 설정되었는지 확인해주세요.',
      errorCode === 'RATE_LIMIT_ERROR' && '요청 빈도를 줄이고 잠시 후 다시 시도해주세요.'
    ].filter(Boolean)
  };
  
  console.error('Gemini API 오류:', JSON.stringify(errorInfo, null, 2));
  
  // 구조화된 에러 객체 전달
  const enhancedError = new Error(detailedMessage);
  enhancedError.name = 'GeminiAPIError';
  Object.assign(enhancedError, errorInfo);
  
  throw enhancedError;
};

export const initializeGeminiModel = async (apiKey: string, modelName: string = 'gemini-pro') => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: modelName });

    console.log(`${modelName} 모델 초기화 성공`);
    return true;
  } catch (error) {
    console.error('Gemini 모델 초기화 실패:', error);
    return false;
  }
};

export const generateGeminiResponse = async (
  prompt: string,
  isStreaming: boolean = false,
  temperature: number = 0.7
) => {
  if (!model) {
    throw new Error('Gemini 모델이 초기화되지 않았습니다.');
  }

  try {
    const request = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
      }
    };

    if (isStreaming) {
      return await model.generateContentStream(request);
    } else {
      const result = await model.generateContent(request);
      return result.response.text();
    }
  } catch (error) {
    console.error('Gemini 응답 생성 실패:', error);
    throw error;
  }
}; 