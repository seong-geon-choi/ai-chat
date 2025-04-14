declare module '@google/generative-ai' {
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

  export interface StreamResponse {
    stream: AsyncIterable<{
      text: string;
    }>;
  }

  export class GenerativeModel {
    constructor(params: ModelParams);
    generateContent(request: GenerateContentRequest | string): Promise<GenerateContentResponse>;
    generateContentStream(request: GenerateContentRequest): AsyncGenerator<GenerateContentResponse>;
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(params: ModelParams): GenerativeModel;
  }
} 