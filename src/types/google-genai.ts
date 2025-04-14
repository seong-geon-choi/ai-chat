export interface Content {
  role?: string;
  parts: Array<{ text: string }>;
}

export interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface ModelParams {
  model: string;
  generationConfig?: GenerationConfig;
}

export interface GenerateContentRequest {
  contents: Content[];
  generationConfig?: GenerationConfig;
}

export interface GenerateContentResponse {
  response: {
    text: () => string;
  };
}

export interface GenerateContentStreamResult {
  response: {
    text: () => string;
  };
}

export interface GenerativeModel {
  generateContent(request: GenerateContentRequest | string): Promise<GenerateContentResponse>;
  generateContentStream(request: GenerateContentRequest): Promise<AsyncGenerator<GenerateContentStreamResult>>;
}

export interface GoogleGenerativeAI {
  constructor(apiKey: string): void;
  getGenerativeModel(params: ModelParams): GenerativeModel;
} 