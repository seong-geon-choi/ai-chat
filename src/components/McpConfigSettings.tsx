import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface McpConfig {
  server: {
    host: string;
    port: number;
    protocol: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  database: {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  logging: {
    level: string;
    file: string;
  };
}

interface McpConfigSettingsProps {
  onConfigChange: (config: McpConfig) => void;
  error: string | null;
  isLoading: boolean;
}

const defaultConfig: McpConfig = {
  server: {
    host: "localhost",
    port: 3001,
    protocol: "http"
  },
  api: {
    baseUrl: "/api",
    timeout: 30000
  },
  database: {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "mcp_db"
  },
  logging: {
    level: "info",
    file: "mcp.log"
  }
};

const McpConfigSettings: React.FC<McpConfigSettingsProps> = ({
  onConfigChange,
  error,
  isLoading = false
}) => {
  const [config, setConfig] = useState<McpConfig>(defaultConfig);
  const [configText, setConfigText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // 초기 설정값 로드
    const savedConfig = localStorage.getItem('mcpConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as Partial<McpConfig>;
        setConfig(parsed as McpConfig);
        setConfigText(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.error('설정 파싱 오류:', e);
        setConfig(defaultConfig);
        setConfigText(JSON.stringify(defaultConfig, null, 2));
      }
    } else {
      setConfig(defaultConfig);
      setConfigText(JSON.stringify(defaultConfig, null, 2));
    }
  }, []);

  useEffect(() => {
    if (error || jsonError) {
      setErrorMessage(error || jsonError);
      setShowError(true);
    }
  }, [error, jsonError]);

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(configText) as Partial<McpConfig>;
      const finalConfig = { ...defaultConfig, ...parsedConfig } as McpConfig;
      localStorage.setItem('mcpConfig', JSON.stringify(finalConfig));
      setConfig(finalConfig);
      onConfigChange(finalConfig);
      setJsonError('');
      setIsDialogOpen(false);
    } catch (e) {
      console.error('설정 저장 오류:', e);
      setJsonError('유효하지 않은 JSON 형식입니다.');
    }
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setConfigText(JSON.stringify(defaultConfig, null, 2));
    setJsonError('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(configText);
  };

  const handleEdit = () => {
    setConfigText(JSON.stringify(config, null, 2));
    setIsDialogOpen(true);
  };

  return (
    <Box sx={{ 
      backgroundColor: '#ffffff', 
      borderRadius: 2, 
      p: 2, 
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h6" sx={{ 
          color: '#2c3e50', 
          fontSize: '1rem', 
          fontWeight: 500
        }}>
          MCP 서버 설정
        </Typography>
        <Box>
          <Tooltip title="설정 초기화">
            <IconButton 
              onClick={handleReset}
              size="small"
              sx={{ mr: 1 }}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="설정 수정">
            <IconButton 
              onClick={handleEdit}
              size="small"
              color="primary"
              sx={{
                color: '#4b6bfb',
                '&:hover': {
                  color: '#3955cc',
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Snackbar
        open={showError}
        autoHideDuration={5000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error"
          sx={{ 
            width: '100%',
            backgroundColor: '#ffebee',
            color: '#c62828'
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        p: 2,
        backgroundColor: '#f8f9fa',
        borderRadius: 1,
        border: '1px solid #e2e8f0'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: '#2c3e50',
          mb: 2
        }}>
          <Typography sx={{ width: '120px', fontWeight: 500 }}>서버 상태:</Typography>
          <Typography sx={{ 
            color: config.server.port ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}>
            {config.server.port ? '설정됨' : '설정되지 않음'}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#2c3e50',
          mb: 2
        }}>
          <Typography sx={{ width: '120px', fontWeight: 500 }}>데이터베이스:</Typography>
          <Typography sx={{ 
            color: config.database.database ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}>
            {config.database.database ? '연결됨' : '연결되지 않음'}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#2c3e50'
        }}>
          <Typography sx={{ width: '120px', fontWeight: 500 }}>로깅:</Typography>
          <Typography sx={{ 
            color: config.logging.level ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}>
            {config.logging.level ? '활성화됨' : '비활성화됨'}
          </Typography>
        </Box>
      </Box>

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f8f9fa',
          color: '#2c3e50',
          fontWeight: 500,
          borderBottom: '1px solid #e2e8f0'
        }}>
          MCP 설정 수정
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={configText}
            onChange={(e) => {
              setConfigText(e.target.value);
              setJsonError('');
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: '#2c3e50',
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: '#e2e8f0'
                },
                '&:hover fieldset': {
                  borderColor: '#4b6bfb'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4b6bfb'
                }
              }
            }}
          />
          {jsonError && (
            <Typography 
              color="error" 
              sx={{ 
                mt: 1, 
                fontSize: '0.875rem'
              }}
            >
              {jsonError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          bgcolor: '#f8f9fa',
          borderTop: '1px solid #e2e8f0'
        }}>
          <Button 
            onClick={() => setIsDialogOpen(false)}
            sx={{ 
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            sx={{
              bgcolor: '#4b6bfb',
              '&:hover': {
                bgcolor: '#3955cc',
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default McpConfigSettings;
