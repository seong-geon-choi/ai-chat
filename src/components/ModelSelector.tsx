import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  Alert,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/Key';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface ModelConfigExtended {
  id: string;
  name: string;
  description: string;
  provider: string;
  apiName: string;
  apiKeyRequired: boolean;
  apiKeyName: string;
  apiKeyDescription: string;
  apiEndpoint?: string;
  maxTokens: number;
  temperature?: number;
  icon?: string;
}

interface ModelSelectorProps {
  models: ModelConfigExtended[];
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  currentModelId,
  onSelectModel
}) => {
  const [expandedModelId, setExpandedModelId] = useState<string | false>(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const savedApiKeys = localStorage.getItem('model_api_keys');
    if (savedApiKeys) {
      setApiKeys(JSON.parse(savedApiKeys));
    }
  }, []);

  // API 키 변경 처리
  const handleApiKeyChange = (modelId: string, value: string) => {
    // 공백 제거
    const trimmedValue = value.trim();
    
    // 기본 검증 수행 (공백이 아니고 최소 길이가 있는지)
    const isValid = trimmedValue.length > 0;
    
    // 유효하지 않은 경우 경고 메시지 표시
    if (trimmedValue.length > 0 && trimmedValue.length < 30 && modelId.includes('gemini')) {
      console.warn(`경고: API 키가 너무 짧습니다 (${trimmedValue.length}자). Google API 키는 일반적으로 39자 이상입니다.`);
    }
    
    const updatedApiKeys = { ...apiKeys, [modelId]: trimmedValue };
    setApiKeys(updatedApiKeys);
    
    // API 키 저장: model_api_keys와 llm_api_keys 모두에 저장
    try {
      localStorage.setItem('model_api_keys', JSON.stringify(updatedApiKeys));
      localStorage.setItem('llm_api_keys', JSON.stringify(updatedApiKeys));
      
      console.log(`[DEBUG] API 키 저장 완료: modelId=${modelId}, 키 길이=${trimmedValue.length}, 키 시작=${trimmedValue.substring(0, 3)}...`);
    } catch (error) {
      console.error('API 키 저장 중 오류 발생:', error);
    }
  };

  // API 키 가시성 토글
  const toggleApiKeyVisibility = (modelId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  // 모델 선택 처리
  const handleModelSelect = (modelId: string) => {
    onSelectModel(modelId);
  };

  return (
    <Box sx={{ bgcolor: '#ffffff', borderRadius: 2, p: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#2c3e50', fontSize: '1rem', fontWeight: 500, mb: 2 }}>
        AI 모델 설정
      </Typography>

      {models.map((model) => (
        <Accordion
          key={model.id}
          expanded={model.id === currentModelId}
          onChange={() => handleModelSelect(model.id)}
          sx={{
            mb: 1,
            border: model.id === currentModelId ? '1px solid #4b6bfb' : '1px solid #e0e0e0',
            borderRadius: '4px !important',
            boxShadow: 'none',
            '&:before': { display: 'none' },
            overflow: 'hidden'
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: '#4b6bfb' }} />}
            sx={{ 
              bgcolor: model.id === currentModelId ? '#f0f7ff' : '#ffffff',
              '&:hover': { bgcolor: '#f8f9fa' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#2c3e50', fontWeight: 500 }}>{model.name}</Typography>
                <Typography variant="caption" sx={{ color: '#657786' }}>
                  {model.provider}
                </Typography>
              </Box>
              {model.apiKeyRequired && (
                <Chip
                  size="small"
                  icon={apiKeys[model.id] ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={apiKeys[model.id] ? "API 키 설정됨" : "API 키 필요"}
                  color={apiKeys[model.id] ? "success" : "warning"}
                  sx={{ ml: 1, height: '24px', '& .MuiChip-label': { fontSize: '0.7rem' } }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#ffffff', p: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#2c3e50', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {model.description}
              </Typography>

              {model.apiKeyRequired && (
                <Paper variant="outlined" sx={{ p: 2, border: '1px solid #e0e0e0', mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#2c3e50', fontSize: '0.875rem' }}>
                    API 키 설정
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom sx={{ color: '#657786', mb: 1 }}>
                    {model.apiKeyDescription}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`${model.apiKeyName} 입력`}
                    value={apiKeys[model.id] || ''}
                    onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                    type={showApiKey[model.id] ? 'text' : 'password'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4b6bfb',
                        },
                        '& input': {
                          color: '#2c3e50',
                          '&::placeholder': {
                            color: '#9e9e9e',
                            opacity: 1
                          }
                        },
                        backgroundColor: '#ffffff'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon fontSize="small" color={apiKeys[model.id] ? 'success' : 'disabled'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => toggleApiKeyVisibility(model.id)}
                            edge="end"
                            sx={{ color: '#657786' }}
                          >
                            {showApiKey[model.id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Paper>
              )}

              {model.maxTokens && (
                <Typography variant="caption" sx={{ color: '#657786', mt: 1, display: 'block', fontSize: '0.75rem' }}>
                  최대 토큰 수: {model.maxTokens.toLocaleString()}
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ModelSelector;
