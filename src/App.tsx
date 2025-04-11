import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import ConversationSidebar from './components/ConversationSidebar';
import ModelSelector from './components/ModelSelector';
import ChatInterface from './components/ChatInterface';
import McpConfigSettings from './components/McpConfigSettings';
import { useChatService } from './hooks/useChatService';
import { Message } from './types';
import { modelConfigs } from './config/modelConfig';
import { generateChatResponse } from './services/geminiService';

// QueryClient 생성
const queryClient = new QueryClient();

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
  const [error, setError] = useState<string>('');

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
          updatedAt: Date.now()
        };
        
        await handleSendMessage([initialMessage]);
      }
      
      setMcpConfig(config);
    } catch (error: any) {
      console.error('MCP 설정 변경 실패:', error);
      throw error; // 에러를 상위 컴포넌트로 전파
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송 함수
  const handleSendMessage = async (newMessages: Message[]) => {
    try {
      setIsLoading(true);
      setError(''); // 이전 오류 메시지 초기화
      
      // 마지막 메시지가 있고 사용자 메시지인 경우에만 API 호출
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        const response = await generateChatResponse(lastMessage.content);
        
        // API 호출 성공 시 오류 상태 비움
        setError('');
        
        // AI 응답 메시지 생성
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.text,
          conversationId: lastMessage.conversationId || 'default',
          timestamp: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // 새 메시지 배열 생성 (사용자 메시지 + AI 응답)
        setMessages([...newMessages, aiMessage]);
      } else {
        // 사용자 메시지가 아닌 경우 (초기화 등) 그대로 설정
        setMessages(newMessages);
      }
    } catch (error: any) {
      console.error('메시지 전송 실패:', error);
      // 오류 메시지 설정
      setError(error.message || '메시지 전송 중 오류가 발생했습니다.');
      // 에러 발생 시 이전 메시지 상태 유지
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 왼쪽 영역: 대화 목록과 모델 선택기 */}
      <Box sx={{ 
        width: 300, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        {/* 대화 목록 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={clearConversation}
          />
        </Box>
        
        {/* MCP 설정 및 모델 선택 영역 */}
        <Box sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 2
        }}>
          {/* MCP 설정 컴포넌트 */}
          <Box sx={{ mb: 2 }}>
            <McpConfigSettings 
              onConfigChange={handleMcpConfigChange}
              error={error}
              isLoading={isLoading}
            />
          </Box>
          
          {/* 구분선 */}
          <Box sx={{ my: 2, borderTop: 1, borderColor: 'divider' }} />
          
          {/* 모델 선택기 */}
          <ModelSelector
            models={modelConfigs}
            currentModelId={currentModelId}
            onSelectModel={selectModel}
          />
        </Box>
      </Box>

      {/* 오른쪽 영역: 채팅 인터페이스 */}
      <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </Box>
    </Box>
  );
}

export default App;
