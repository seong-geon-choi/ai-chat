import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (messages: Message[]) => void;
  isLoading?: boolean;
  onModelChange?: (model: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading: externalIsLoading = false,
  onModelChange 
}) => {
  const [input, setInput] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('');
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = externalIsLoading || localIsLoading;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 새 대화 시작 함수
  const startNewConversation = async () => {
    try {
      setLocalIsLoading(true);
      onSendMessage([]); // 기존 메시지 초기화
      
      // 초기 메시지 자동 전송 제거하고 단순히 로딩만 완료
      setLocalIsLoading(false);
    } catch (error: any) {
      console.error('새 대화 시작 실패:', error);
      setError(error.message || '새 대화 시작 중 오류가 발생했습니다.');
      setLocalIsLoading(false);
    }
  };

  // 모델 변경 시 호출되는 함수
  const handleModelChange = async (newModel: string) => {
    try {
      setCurrentModel(newModel);
      if (onModelChange) {
        onModelChange(newModel);
      }
      await startNewConversation(); // 모델 변경 시 새 대화 시작
    } catch (error: any) {
      console.error('모델 변경 실패:', error);
      setError(error.message || '모델 변경 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 초기 메시지 전송
  useEffect(() => {
    startNewConversation();
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  // 에러 메시지가 변경될 때마다 5초 후에 자동으로 사라지도록 설정
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000); // 5초 후 에러 메시지 제거
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 새 메시지 보낼 때 에러 초기화
    setError('');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      conversationId: 'default',
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setInput('');
    onSendMessage([...messages, userMessage]);
  };

  // 메시지 내용 포맷팅 함수 추가
  const formatMessageContent = (content: string): string => {
    if (!content) return '';

    // 1. 코드 블록 보존 (```로 둘러싸인 부분)
    const codeBlocks: string[] = [];
    const withoutCode = content.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 2. 너무 긴 문장을 문단으로 분리 (마침표, 물음표, 느낌표 뒤에 공백이 오는 경우)
    // 문장 경계 뒤에 줄바꿈이 없는 경우에만 줄바꿈 추가
    const withSentenceBreaks = withoutCode.replace(/([.!?])\s+(?=[A-Z가-힣])/g, '$1\n\n');

    // 3. 이미 줄바꿈이 있는 경우는 그대로 유지, 단 두 개 이상의 연속된 줄바꿈은 하나로 병합
    const withLineBreaks = withSentenceBreaks.replace(/\n{3,}/g, '\n\n');

    // 4. 코드 블록 다시 삽입
    const reinsertedCode = withLineBreaks.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
      return codeBlocks[parseInt(idx)];
    });

    return reinsertedCode;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 3,
            }}
          >
            <Box
              sx={{
                maxWidth: message.role === 'user' ? '65%' : '75%',
                p: 2,
                bgcolor: message.role === 'user' ? 'primary.dark' : '#f0f7ff',
                borderRadius: 2,
                color: message.role === 'user' ? 'white' : '#2c3e50',
                boxShadow: 1,
                fontWeight: 400,
                lineHeight: 1.7,
                fontSize: '0.875rem',
                border: message.role === 'user' ? 'none' : '1px solid #cce5ff',
                whiteSpace: 'pre-line',
                overflowWrap: 'break-word',
                '& code': {
                  backgroundColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                },
                '& pre': {
                  backgroundColor: message.role === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  padding: '8px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre'
                }
              }}
            >
              {formatMessageContent(message.content)}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      {error && (
        <Box 
          sx={{ 
            p: 2, 
            m: 2,
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 2,
            whiteSpace: 'pre-line',
            maxHeight: '300px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            boxShadow: 1
          }}
        >
          {error}
        </Box>
      )}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="메시지를 입력하세요..."
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;