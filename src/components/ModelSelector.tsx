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
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        AI 모델 설정
      </Typography>

      {models.map((model) => (
        <Accordion
          key={model.id}
          expanded={model.id === currentModelId}
          onChange={() => handleModelSelect(model.id)}
          sx={{
            mb: 1,
            border: model.id === currentModelId ? 1 : 0,
            borderColor: 'primary.main',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{model.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {model.provider}
                </Typography>
              </Box>
              {model.apiKeyRequired && (
                <Chip
                  size="small"
                  icon={apiKeys[model.id] ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={apiKeys[model.id] ? "API 키 설정됨" : "API 키 필요"}
                  color={apiKeys[model.id] ? "success" : "warning"}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {model.description}
              </Typography>

              {model.apiKeyRequired && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    API 키 설정
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    {model.apiKeyDescription}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`${model.apiKeyName} 입력`}
                    value={apiKeys[model.id] || ''}
                    onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                    type={showApiKey[model.id] ? 'text' : 'password'}
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
