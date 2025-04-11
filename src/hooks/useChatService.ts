import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Conversation } from '../types';
import mcpService, { ApiResponse } from '../api/mcpService';

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

// 임시 모델 데이터
const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Google의 최신 AI 모델',
    apiName: 'gemini-pro',
    maxTokens: 30720,
    temperature: 0.7
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'OpenAI의 가장 강력한 언어 모델',
    apiName: 'gpt-4-turbo',
    maxTokens: 128000,
    temperature: 0.7
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Anthropic의 최신 대규모 언어 모델',
    apiName: 'claude-3-opus',
    maxTokens: 200000,
    temperature: 0.7
  }
];

// 로컬 스토리지 키
const STORAGE_KEYS = {
  CONVERSATIONS: 'chat_conversations',
  CURRENT_CONVERSATION: 'chat_current_conversation',
  CURRENT_MODEL: 'chat_current_model'
};

export const useChatService = () => {
  // 상태 관리
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  });

  const [currentModelId, setCurrentModelId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_MODEL) || 'gemini-pro';
  });

  const [isLoading, setIsLoading] = useState(false);

  // 상태 변경시 로컬 스토리지 업데이트
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, currentConversationId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
    }
  }, [currentConversationId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MODEL, currentModelId);
  }, [currentModelId]);

  // 페이지 로드시 자동 질문
  useEffect(() => {
    if (!conversations.length) {
      clearConversation();
    }
  }, []);

  // 현재 대화의 메시지 목록 가져오기
  const messages = currentConversationId
    ? conversations.find(conv => conv.id === currentConversationId)?.messages || []
    : [];

  // 메시지 전송
  const sendMessage = useCallback(async (content: string) => {
    let targetConversationId = currentConversationId;

    if (!targetConversationId) {
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        title: '새 대화',
        messages: [],
        modelId: currentModelId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversationId);
      targetConversationId = newConversationId;

      // 상태 업데이트가 완료되길 기다림
      await Promise.resolve();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      conversationId: targetConversationId,
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === targetConversationId) {
        const updatedMessages = [...conv.messages, userMessage];
        return {
          ...conv,
          messages: updatedMessages,
          title: updatedMessages.length === 1 ? content : conv.title,
          updatedAt: Date.now()
        };
      }
      return conv;
    }));

    setIsLoading(true);

    try {
      const response = await mcpService.getChatResponse(content, currentModelId, targetConversationId);

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: typeof response.data === 'object' ? response.data.content || response.data.text : response.toString(),
        conversationId: targetConversationId,
        timestamp: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            updatedAt: Date.now()
          };
        }
        return conv;
      }));
    } catch (error: any) {
      console.error('메시지 전송 중 오류 발생:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `오류가 발생했습니다: ${error.message}`,
        conversationId: targetConversationId,
        timestamp: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMessage],
            updatedAt: Date.now()
          };
        }
        return conv;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, currentModelId]);

  // 새 대화 시작
  const clearConversation = useCallback(() => {
    const newConversationId = uuidv4();
    const newConversation: Conversation = {
      id: newConversationId,
      title: '새 대화',
      messages: [],
      modelId: currentModelId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversationId);

    // 상태 업데이트가 완료된 후 메시지 전송
    Promise.resolve().then(() => {
      sendMessage("너는 누구야?");
    });
  }, [currentModelId, sendMessage]);

  // 대화 선택
  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    // 상태 업데이트가 완료된 후 메시지 전송
    Promise.resolve().then(() => {
      sendMessage("너는 누구야?");
    });
  }, [sendMessage]);

  // 모델 선택
  const selectModel = useCallback((modelId: string) => {
    const newConversationId = uuidv4();
    const newConversation: Conversation = {
      id: newConversationId,
      title: '새 대화',
      messages: [],
      modelId: modelId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setCurrentModelId(modelId);
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversationId);

    // 상태 업데이트가 완료된 후 메시지 전송
    Promise.resolve().then(() => {
      sendMessage("너는 누구야?");
    });
  }, [sendMessage]);

  return {
    conversations,
    messages,
    currentConversationId,
    currentModelId,
    isLoading,
    models: AVAILABLE_MODELS,
    sendMessage,
    selectConversation,
    selectModel,
    clearConversation
  };
};

export default useChatService;