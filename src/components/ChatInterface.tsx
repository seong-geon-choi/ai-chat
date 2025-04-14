import React, { FC, useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress, Snackbar, Alert, Switch, FormControlLabel, Tooltip, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { Message } from '../types';
import { GoogleGenerativeAI, GenerateContentRequest } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

// 색상 테마 정의
const theme = {
  colors: {
    primary: '#4b6bfb',
    background: {
      main: '#f8f9fa',
      light: '#ffffff',
      dark: '#e9ecef'
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
      light: '#ffffff'
    },
    border: '#e0e0e0'
  }
};

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (messages: Message[]) => void;
  isLoading?: boolean;
  onModelChange?: (model: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

interface MySQLResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// API 엔드포인트 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_ENDPOINTS = {
  chat: `${API_BASE_URL}/gemini/chat`,
  stream: `${API_BASE_URL}/gemini/stream`,
  saveChat: `${API_BASE_URL}/gemini/saveChat`
};

// 채팅 메시지 타입 정의
interface ChatMessage {
  role: 'user' | 'assistant';
  parts: { text: string }[];
}

// Gemini API 응답 타입 정의
interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiContentPart[];
  role?: string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: string;
  index?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: any;
}

const ChatInterface: FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading: externalIsLoading = false,
  onModelChange,
  error,
  setError
}): JSX.Element => {
  const [input, setInput] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showError, setShowError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);

  const isLoading = externalIsLoading || localIsLoading;

  // API 키로 Gemini 초기화
  const initializeGemini = (apiKey: string) => {
    const ai = new GoogleGenerativeAI(apiKey);
    setGenAI(ai);
    return ai;
  };

  // API 키 확인 및 Gemini 초기화
  const checkApiKey = () => {
    const modelApiKeys = localStorage.getItem('model_api_keys');
    const llmApiKeys = localStorage.getItem('llm_api_keys');
    
    if (!modelApiKeys && !llmApiKeys) {
      throw new Error('API 키가 설정되지 않았습니다. 설정 메뉴에서 API 키를 설정해주세요.');
    }

    try {
      const keys = modelApiKeys ? JSON.parse(modelApiKeys) : JSON.parse(llmApiKeys || '{}');
      const apiKey = keys['gemini-2.0-flash'] || keys['gemini'];
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다.');
      }
      return initializeGemini(apiKey);
    } catch (e) {
      console.error('API 키 파싱 오류:', e);
      throw new Error('API 키 형식이 올바르지 않습니다.');
    }
  };

  useEffect(() => {
    if (error) {
      setShowError(true);
      
      // 오류 메시지를 클립보드에 복사
      const copyErrorToClipboard = async () => {
        try {
          await navigator.clipboard.writeText(error);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          console.error('클립보드 복사 실패:', err);
        }
      };
      copyErrorToClipboard();

      // 5초 후에 자동으로 에러 상태 초기화
      const timer = setTimeout(() => {
        setShowError(false);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 대화 저장 함수
  const handleSaveChat = async () => {
    try {
      const title = conversationTitle || `대화 ${new Date().toLocaleString()}`;
      const chatData = {
        title,
        messages: messages,
        timestamp: Date.now()
      };

      const response = await fetch(API_ENDPOINTS.saveChat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatData)
      });

      if (!response.ok) {
        throw new Error('대화 저장에 실패했습니다.');
      }

      setError('대화가 성공적으로 저장되었습니다.');
      setTimeout(() => setError(null), 3000);
    } catch (error: any) {
      setError(error.message || '대화 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSend = async (message: string): Promise<void> => {
    if (!message.trim()) return;
    
    setInput('');
    setLocalIsLoading(true);
    
    try {
      setError(null);
      const genAIInstance = checkApiKey();
      
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      };

      const model = genAIInstance.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig
      });

      // 채팅 히스토리 업데이트 함수
      const updateChatHistory = (userMessage: string, aiResponse: string, isStreaming = false) => {
        const conversationId = messages.length > 0 ? messages[0].conversationId : uuidv4();
        const newMessages: Message[] = [
          ...messages,
          {
            id: uuidv4(),
            conversationId,
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            mcpResults: []
          },
          {
            id: uuidv4(),
            conversationId,
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            mcpResults: []
          }
        ];
        onSendMessage(newMessages);
      };

      // 채팅 히스토리를 Gemini API 형식으로 변환
      const chatMessages: ChatMessage[] = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        parts: [{ text: msg.content }]
      }));

      // 현재 메시지 추가
      chatMessages.push({
        role: 'user',
        parts: [{ text: message }]
      });

      if (isStreaming) {
        try {
          const streamResult = await model.generateContentStream({
            contents: chatMessages
          });
          
          let streamedResponse = '';
          
          // Gemini API 호환성 이슈 해결을 위한 타입 단언
          // @ts-ignore - 타입 오류 무시
          const stream = streamResult.stream ? streamResult.stream() : streamResult;
          
          // @ts-ignore - 타입 오류 무시
          for await (const chunk of stream) {
            try {
              // @ts-ignore - 타입 오류 무시
              const chunkText = chunk.text ? (typeof chunk.text === 'function' ? chunk.text() : chunk.text) : '';
              
              if (chunkText) {
                streamedResponse += chunkText;
                updateChatHistory(message, streamedResponse, true);
              }
            } catch (e) {
              console.error('청크 처리 중 오류:', e);
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          throw error;
        }
      } else {
        const result = await model.generateContent({
          contents: chatMessages
        });
        
        if (result.response) {
          const responseText = result.response.text();
          updateChatHistory(message, responseText);
        }
      }
    } catch (err) {
      console.error('Error in chat:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLocalIsLoading(false);
    }
  };

  // 새 대화 시작 시 히스토리 초기화
  const startNewConversation = async () => {
    try {
      setLocalIsLoading(true);
      setChatHistory([]); // 채팅 히스토리 초기화
      onSendMessage([]); // 기존 메시지 초기화
    } catch (error: any) {
      console.error('새 대화 시작 실패:', error);
      setError(error.message || '새 대화 시작 중 오류가 발생했습니다.');
    } finally {
      setLocalIsLoading(false);
    }
  };

  // 모델 변경 시 호출되는 함수
  const handleModelChange = async (newModel: string) => {
    try {
      if (onModelChange) {
        onModelChange(newModel);
      }
      await startNewConversation(); // 모델 변경 시 새 대화 시작
    } catch (error: any) {
      console.error('모델 변경 실패:', error);
      setError(error.message || '모델 변경 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    startNewConversation();
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="대화 제목"
            value={conversationTitle}
            onChange={(e) => setConversationTitle(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="outlined"
            onClick={handleSaveChat}
            startIcon={<SaveIcon />}
            disabled={isLoading}
          >
            대화 저장
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              onSendMessage([]);
              setChatHistory([]);
              setConversationTitle('');
            }}
            startIcon={<AddIcon />}
            disabled={isLoading}
          >
            새 대화
          </Button>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isStreaming}
              onChange={(e) => setIsStreaming(e.target.checked)}
              disabled={isLoading}
            />
          }
          label="스트리밍 모드"
        />
      </Box>

      <Snackbar
        open={showError}
        autoHideDuration={5000}
        onClose={() => {
          setShowError(false);
          setError(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => {
            setShowError(false);
            setError(null);
          }}
          severity="error"
          sx={{ 
            width: '100%',
            backgroundColor: '#ffebee',
            color: '#c62828',
            display: 'flex',
            alignItems: 'center'
          }}
          action={
            <Tooltip title={copySuccess ? "복사됨!" : "클립보드에 복사"}>
              <IconButton
                size="small"
                onClick={async () => {
                  if (error) {
                    await navigator.clipboard.writeText(error);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }
                }}
                sx={{ ml: 1 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                bgcolor: message.role === 'user' ? theme.colors.primary : theme.colors.background.light,
                color: message.role === 'user' ? theme.colors.text.light : theme.colors.text.primary,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordWrap: 'break-word',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                lineHeight: 1.7
              }}>
                {message.content}
              </pre>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ 
        p: 2, 
        backgroundColor: theme.colors.background.light, 
        borderTop: 1, 
        borderColor: theme.colors.border
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            disabled={isLoading}
            multiline
            maxRows={4}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.colors.background.main,
                color: theme.colors.text.primary,
                '&:hover': {
                  backgroundColor: theme.colors.background.light
                },
                '&.Mui-focused': {
                  backgroundColor: theme.colors.background.light
                },
                '& fieldset': {
                  borderColor: theme.colors.border
                },
                '&:hover fieldset': {
                  borderColor: theme.colors.primary
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.colors.primary
                }
              },
              '& .MuiInputBase-input': {
                color: theme.colors.text.primary,
                '&::placeholder': {
                  color: theme.colors.text.secondary,
                  opacity: 1
                }
              }
            }}
          />
          <IconButton 
            color="primary" 
            onClick={() => handleSend(input)} 
            disabled={isLoading}
            sx={{
              backgroundColor: theme.colors.background.main,
              color: theme.colors.primary,
              '&:hover': {
                backgroundColor: theme.colors.background.dark
              },
              '&.Mui-disabled': {
                backgroundColor: theme.colors.background.dark,
                color: theme.colors.text.secondary
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;