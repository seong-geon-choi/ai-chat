import type { McpServerConfig, McpResponse, McpToolConfig, McpError } from '../types/mcp';
import { DEFAULT_MCP_CONFIG, MCP_ENDPOINTS, MCP_ERROR_CODES } from '../config/mcp.config';

export class McpService {
  private config: McpServerConfig;

  constructor(config: Partial<McpServerConfig> = {}) {
    this.config = {
      ...DEFAULT_MCP_CONFIG,
      ...config
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<McpResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
      },
      signal: controller.signal
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${this.config.timeout}ms`);
        }
        throw this.handleError(error);
      }
      throw error;
    }
  }

  private handleHttpError(response: Response): McpError {
    const statusCode = response.status;
    let error: McpError = {
      code: MCP_ERROR_CODES.SERVER_ERROR,
      message: '알 수 없는 오류가 발생했습니다.'
    };

    switch (statusCode) {
      case 401:
        error = {
          code: MCP_ERROR_CODES.UNAUTHORIZED,
          message: '인증되지 않은 접근입니다.'
        };
        break;
      case 404:
        error = {
          code: MCP_ERROR_CODES.NOT_FOUND,
          message: '리소스를 찾을 수 없습니다.'
        };
        break;
      case 400:
        error = {
          code: MCP_ERROR_CODES.INVALID_REQUEST,
          message: '잘못된 요청입니다.'
        };
        break;
    }

    return error;
  }

  private handleError(error: Error): McpError {
    if (error.name === 'AbortError') {
      return {
        code: MCP_ERROR_CODES.TIMEOUT,
        message: '요청 시간이 초과되었습니다.'
      };
    }

    return {
      code: MCP_ERROR_CODES.SERVER_ERROR,
      message: error.message
    };
  }

  // MCP 도구 목록 조회
  async getTools(): Promise<McpResponse<McpToolConfig[]>> {
    return this.request<McpToolConfig[]>(MCP_ENDPOINTS.tools);
  }

  // 파일 시스템 작업
  async listFiles(path: string): Promise<McpResponse<string[]>> {
    return this.request(MCP_ENDPOINTS.filesystem.list, {
      method: 'POST',
      body: JSON.stringify({ path })
    });
  }

  async readFile(path: string): Promise<McpResponse<string>> {
    return this.request(MCP_ENDPOINTS.filesystem.read, {
      method: 'POST',
      body: JSON.stringify({ path })
    });
  }

  // 데이터베이스 쿼리
  async executeQuery(query: string): Promise<McpResponse<any>> {
    return this.request(MCP_ENDPOINTS.database.query, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  // 시스템 정보 조회
  async getSystemInfo(): Promise<McpResponse<any>> {
    return this.request(MCP_ENDPOINTS.system.info);
  }
}

// 싱글톤 인스턴스 생성
export const mcpService = new McpService(); 