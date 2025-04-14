import { McpServerConfig } from '../types/mcp';

export const DEFAULT_MCP_CONFIG: McpServerConfig = {
  baseUrl: process.env.REACT_APP_MCP_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retryCount: 3
};

export const MCP_ENDPOINTS = {
  tools: '/tools',
  filesystem: {
    list: '/filesystem/list',
    read: '/filesystem/read',
    write: '/filesystem/write',
    delete: '/filesystem/delete',
    search: '/filesystem/search'
  },
  database: {
    query: '/database/query',
    execute: '/database/execute'
  },
  system: {
    info: '/system/info',
    status: '/system/status'
  }
} as const;

export const MCP_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT'
} as const;

// TypeScript가 이 파일을 모듈로 인식하도록 빈 export 추가
export {}; 