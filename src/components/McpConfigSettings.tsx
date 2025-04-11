import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import CodeIcon from '@mui/icons-material/Code';
import TuneIcon from '@mui/icons-material/Tune';
import { McpConfig, McpTool, McpToolParameter, LLMModel } from '../types';
import { loadMcpConfig, saveMcpConfig, addTool, removeTool, toggleToolEnabled } from '../services/mcpConfigService';
import { useApiKeys } from '../hooks/useApiKeys';

// API 키 관리 컴포넌트
interface ApiKeyManagerProps {
  models: LLMModel[];
  onApiKeyChange: (modelId: string, apiKey: string) => Promise<void>;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ models, onApiKeyChange }) => {
  const { apiKeys, error, saveApiKey, removeApiKey } = useApiKeys();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenDialog = (model: LLMModel) => {
    setSelectedModel(model);
    setNewApiKey(apiKeys[model.id] || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedModel(null);
    setNewApiKey('');
  };

  const handleSaveApiKey = async () => {
    if (!selectedModel) return;
    
    try {
      setIsLoading(true);
      await onApiKeyChange(selectedModel.id, newApiKey);
      saveApiKey(selectedModel.id, newApiKey);
      handleCloseDialog();
    } catch (err) {
      console.error('API 키 저장 중 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async (modelId: string) => {
    try {
      await onApiKeyChange(modelId, '');
      removeApiKey(modelId);
    } catch (err) {
      console.error('API 키 삭제 중 오류:', err);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        API 키 관리
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <List>
        {models.map((model) => (
          <ListItem key={model.id}>
            <ListItemText
              primary={model.name}
              secondary={apiKeys[model.id] ? '설정됨' : '설정되지 않음'}
            />
            <ListItemSecondaryAction>
              <Tooltip title="API 키 설정">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenDialog(model)}
                >
                  {apiKeys[model.id] ? '수정' : '설정'}
                </Button>
              </Tooltip>
              {apiKeys[model.id] && (
                <Tooltip title="API 키 삭제">
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveApiKey(model.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedModel?.name} API 키 {apiKeys[selectedModel?.id || ''] ? '수정' : '설정'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="API 키"
            type="password"
            fullWidth
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleSaveApiKey}
            disabled={isLoading}
            variant="contained"
            color="primary"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 도구 파라미터 편집기 컴포넌트
interface ParameterEditorProps {
  parameters: McpToolParameter[];
  onParametersChange: (parameters: McpToolParameter[]) => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ parameters, onParametersChange }) => {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<'string' | 'number' | 'boolean' | 'array' | 'object'>('string');
  const [newParamDescription, setNewParamDescription] = useState('');
  const [newParamRequired, setNewParamRequired] = useState(true);

  const handleAddParameter = () => {
    if (newParamName) {
      const newParam: McpToolParameter = {
        name: newParamName,
        type: newParamType,
        description: newParamDescription,
        required: newParamRequired
      };
      onParametersChange([...parameters, newParam]);
      setNewParamName('');
      setNewParamType('string');
      setNewParamDescription('');
      setNewParamRequired(true);
    }
  };

  const handleRemoveParameter = (index: number) => {
    const updatedParams = [...parameters];
    updatedParams.splice(index, 1);
    onParametersChange(updatedParams);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        파라미터
      </Typography>
      <List>
        {parameters.map((param, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={param.name}
              secondary={`${param.type} - ${param.description} (${param.required ? '필수' : '선택'})`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleRemoveParameter(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
        <TextField
          label="파라미터 이름"
          value={newParamName}
          onChange={(e) => setNewParamName(e.target.value)}
          size="small"
          sx={{ mr: 1 }}
        />
        <FormControl size="small" sx={{ mr: 1, minWidth: 120 }}>
          <InputLabel>타입</InputLabel>
          <Select
            value={newParamType}
            onChange={(e) => setNewParamType(e.target.value as any)}
            label="타입"
          >
            <MenuItem value="string">문자열</MenuItem>
            <MenuItem value="number">숫자</MenuItem>
            <MenuItem value="boolean">불리언</MenuItem>
            <MenuItem value="array">배열</MenuItem>
            <MenuItem value="object">객체</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="설명"
          value={newParamDescription}
          onChange={(e) => setNewParamDescription(e.target.value)}
          size="small"
          sx={{ mr: 1 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={newParamRequired}
              onChange={(e) => setNewParamRequired(e.target.checked)}
              size="small"
            />
          }
          label="필수"
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAddParameter}
          disabled={!newParamName}
          startIcon={<AddIcon />}
        >
          추가
        </Button>
      </Box>
    </Box>
  );
};

// 도구 관리 컴포넌트
interface ToolManagerProps {
  tools: McpTool[];
  onToolsChange: (tools: McpTool[]) => void;
}

const ToolManager: React.FC<ToolManagerProps> = ({ tools, onToolsChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<McpTool | null>(null);
  const [toolName, setToolName] = useState('');
  const [toolId, setToolId] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolEndpoint, setToolEndpoint] = useState('');
  const [toolParameters, setToolParameters] = useState<McpToolParameter[]>([]);

  const handleOpenDialog = (tool?: McpTool) => {
    if (tool) {
      setEditingTool(tool);
      setToolId(tool.id);
      setToolName(tool.name);
      setToolDescription(tool.description);
      setToolEndpoint(tool.endpoint);
      setToolParameters(tool.parameters);
    } else {
      setEditingTool(null);
      setToolId('');
      setToolName('');
      setToolDescription('');
      setToolEndpoint('');
      setToolParameters([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTool(null);
  };

  const handleSaveTool = () => {
    const tool: McpTool = {
      id: toolId,
      name: toolName,
      description: toolDescription,
      endpoint: toolEndpoint,
      parameters: toolParameters,
      enabled: editingTool ? editingTool.enabled : true
    };

    const updatedTools = editingTool
      ? tools.map((t) => (t.id === tool.id ? tool : t))
      : [...tools, tool];

    onToolsChange(updatedTools);
    handleCloseDialog();
  };

  const handleRemoveTool = (toolId: string) => {
    const updatedTools = tools.filter((t) => t.id !== toolId);
    onToolsChange(updatedTools);
  };

  const handleToggleToolEnabled = (toolId: string) => {
    const updatedTools = tools.map((t) =>
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    );
    onToolsChange(updatedTools);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">도구 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          도구 추가
        </Button>
      </Box>
      <List>
        {tools.map((tool) => (
          <ListItem key={tool.id}>
            <ListItemText
              primary={tool.name}
              secondary={tool.description}
            />
            <ListItemSecondaryAction>
              <Switch
                edge="start"
                checked={tool.enabled}
                onChange={() => handleToggleToolEnabled(tool.id)}
              />
              <IconButton onClick={() => handleOpenDialog(tool)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" onClick={() => handleRemoveTool(tool.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTool ? '도구 수정' : '도구 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="도구 ID"
            value={toolId}
            onChange={(e) => setToolId(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="도구 이름"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="설명"
            value={toolDescription}
            onChange={(e) => setToolDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="엔드포인트"
            value={toolEndpoint}
            onChange={(e) => setToolEndpoint(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <ParameterEditor
              parameters={toolParameters}
              onParametersChange={setToolParameters}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleSaveTool}
            variant="contained"
            color="primary"
            disabled={!toolId || !toolName}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 메인 설정 컴포넌트
interface McpConfigSettingsProps {
  onConfigChange: (config: McpConfig) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

const McpConfigSettings: React.FC<McpConfigSettingsProps> = ({
  onConfigChange,
  error: externalError,
  isLoading: externalIsLoading = false
}) => {
  const [mcpConfig, setMcpConfig] = useState<McpConfig>(loadMcpConfig());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(mcpConfig.baseUrl);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const isLoading = externalIsLoading || localIsLoading;
  const error = externalError || localError;

  const handleSaveBaseUrl = () => {
    const updatedConfig = {
      ...mcpConfig,
      baseUrl
    };
    setMcpConfig(updatedConfig);
    saveMcpConfig(updatedConfig);
    if (onConfigChange) onConfigChange(updatedConfig);
  };

  const handleToolsChange = (tools: McpTool[]) => {
    const updatedConfig = {
      ...mcpConfig,
      tools
    };
    setMcpConfig(updatedConfig);
    saveMcpConfig(updatedConfig);
    if (onConfigChange) onConfigChange(updatedConfig);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            MCP 설정
          </Typography>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            {isSettingsOpen ? '설정 닫기' : '설정 열기'}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {isSettingsOpen && (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  기본 설정
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Base URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveBaseUrl}
                    disabled={isLoading}
                    startIcon={<SaveIcon />}
                  >
                    저장
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <ApiKeyManager
                  models={mcpConfig.models || []}
                  onApiKeyChange={async (modelId, apiKey) => {
                    const updatedConfig = {
                      ...mcpConfig,
                      apiKeys: { ...mcpConfig.apiKeys, [modelId]: apiKey }
                    };
                    await onConfigChange(updatedConfig);
                    setMcpConfig(updatedConfig);
                    saveMcpConfig(updatedConfig);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <ToolManager
                  tools={mcpConfig.tools || []}
                  onToolsChange={handleToolsChange}
                />
              </CardContent>
            </Card>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default McpConfigSettings;
