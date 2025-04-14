import React, { useState, useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import ConversationSidebar from './components/ConversationSidebar';
import ModelSelector from './components/ModelSelector';
import ChatInterface from './components/ChatInterface';
import McpConfigSettings from './components/McpConfigSettings';
import { useChatService } from './hooks/useChatService';
import { Message } from './types';
import { modelConfigs } from './config/modelConfig';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, validateApiKey } from './config/config';

// QueryClient 생성
const queryClient = new QueryClient();

export interface AIModel {
  provider: string;
  apiName: string;
  displayName: string;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <AppContent />
    </QueryClientProvider>
  );
}

const AppContent: React.FC = () => {
  const {
    conversations,
    currentModelId,
    currentConversationId,
    selectConversation,
    selectModel,
    clearConversation
  } = useChatService();
  
  // MCP 설정 상태
  const [mcpConfig, setMcpConfig] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // MCP 설정 변경 핸들러
  const handleMcpConfigChange = async (config: any) => {
    try {
      setIsLoading(true);
      
      // API 키가 설정되었는지 확인
      const apiKeysExist = Object.keys(config.apiKeys || {}).length > 0;
      
      if (apiKeysExist) {
        console.log('API 키가 설정되었습니다.');
        
        // API 키 설정 후 초기 메시지 전송
        const initialMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: '너는 누구야?',
          conversationId: 'initial',
          timestamp: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mcpResults: []
        };
        
        await handleSendMessage([initialMessage]);
      }
      
      setMcpConfig(config);
    } catch (error: any) {
      console.error('MCP 설정 변경 실패:', error);
      setError(error.message || 'MCP 설정 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송 함수
  const handleSendMessage = async (newMessages: Message[]) => {
    setMessages(newMessages);
    
    // 마지막 메시지가 사용자 메시지인 경우에만 AI 응답 생성
    const lastMessage = newMessages[newMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      setIsLoading(true);
      try {
        // mcpConfig에서 현재 선택된 모델의 API 키 가져오기
        const currentModel = modelConfigs.find(model => model.id === currentModelId);
        if (!currentModel) {
          throw new Error('선택된 AI 모델을 찾을 수 없습니다.');
        }

        const apiKey = mcpConfig?.apiKeys?.[currentModel.apiKeyName];
        if (!validateApiKey(apiKey)) {
          throw new Error(
            `${currentModel.name} 모델의 API 키가 설정되지 않았거나 올바르지 않습니다.\n` +
            '1. MCP 설정에서 API 키를 입력해주세요.\n' +
            '2. 설정을 저장한 후 다시 시도해주세요.'
          );
        }

        let response;
        if (currentModel.provider === 'google') {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: currentModel.apiName });
          const result = await model.generateContent(lastMessage.content);
          response = await result.response;
        } else {
          throw new Error(`지원하지 않는 AI 제공자입니다: ${currentModel.provider}`);
        }
        
        // AI 응답 메시지 생성
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.text(),
          conversationId: lastMessage.conversationId || 'default',
          timestamp: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mcpResults: []
        };
        
        setMessages([...newMessages, aiMessage]);
        setError(null); // 성공 시 에러 메시지 초기화
      } catch (error: any) {
        console.error('AI 응답 생성 실패:', error);
        const errorMessage = error.message || 'AI 응답 생성 중 오류가 발생했습니다.';
        setError(errorMessage);
        
        // 에러 메시지를 채팅창에 표시
        const errorResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `오류가 발생했습니다: ${errorMessage}`,
          conversationId: lastMessage.conversationId || 'default',
          timestamp: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mcpResults: []
        };
        setMessages([...newMessages, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const testApiKey = async (currentModel: AIModel) => {
    setTestResult(null);
    setIsLoading(true);

    try {
      if (currentModel.provider === 'gemini') {
        const apiKey = getApiKey(currentModel.apiName);
        if (!apiKey) {
          throw new Error('API 키가 설정되지 않았습니다.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: currentModel.apiName });
        const result = await model.generateContent({
          contents: [{ 
            role: 'user',
            parts: [{ text: '안녕하세요!' }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.8,
            topK: 40,
          }
        });
        const response = await result.response;
        setTestResult({ success: true, message: '연결 테스트 성공: ' + response.text() });
      } else {
        throw new Error(`지원하지 않는 AI 제공자입니다: ${currentModel.provider}`);
      }
    } catch (error: any) {
      console.error('API 키 테스트 실패:', error);
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 가져오기
  const getApiKey = (modelName: string): string | null => {
    const modelApiKeys = localStorage.getItem('model_api_keys');
    if (!modelApiKeys) return null;

    try {
      const keys = JSON.parse(modelApiKeys);
      return keys[modelName] || null;
    } catch {
      return null;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      bgcolor: '#f8f9fa'
    }}>
      {/* 왼쪽 영역: 대화 목록, MCP 설정, 모델 선택기 */}
      <Box sx={{ 
        width: 300,
        display: 'flex', 
        flexDirection: 'column',
        borderRight: 1,
        borderColor: '#e0e0e0',
        bgcolor: '#ffffff',
        overflow: 'hidden'
      }}>
        {/* 대화 목록 */}
        <Box sx={{ 
          flex: '1 0 40%',
          borderBottom: 1,
          borderColor: '#e0e0e0',
          overflow: 'hidden'
        }}>
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={clearConversation}
          />
        </Box>
        
        {/* MCP 설정 영역 */}
        <Box sx={{ 
          flex: '1 0 30%',
          borderBottom: 1,
          borderColor: '#e0e0e0',
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}>
          <McpConfigSettings 
            onConfigChange={handleMcpConfigChange}
            error={error}
            isLoading={isLoading}
          />
        </Box>

        {/* AI 모델 선택 영역 */}
        <Box sx={{ 
          flex: '1 0 30%',
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}>
          <ModelSelector
            models={modelConfigs}
            currentModelId={currentModelId}
            onSelectModel={selectModel}
          />
        </Box>
      </Box>

      {/* 오른쪽 영역: 채팅 인터페이스 */}
      <Box sx={{ 
        flex: 1,
        overflow: 'hidden',
        bgcolor: '#f8f9fa'
      }}>
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          error={error}
          setError={setError}
        />
      </Box>
    </Box>
  );
}

export default App;
