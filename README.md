# AI 채팅봇 애플리케이션

TypeScript와 React를 사용하여 개발된 브라우저 기반 AI 채팅봇 애플리케이션입니다. 이 애플리케이션은 MCP(Modular Computing Platform) 서버를 통해 MySQL 데이터베이스에 액세스할 수 있으며, 다양한 LLM(Large Language Model) 제공업체(OpenAI, Anthropic, Google)의 모델을 선택하여 질의할 수 있습니다.

## 기능

- 다양한 LLM 모델 선택 가능 (GPT-4, Claude 3, Gemini Pro)
- 모든 대화 내역 저장 및 불러오기
- 분할된 UI 레이아웃: 왼쪽에 채팅 인터페이스, 오른쪽에 모델 선택 및 입력창
- MySQL 데이터베이스 연동을 통한 데이터 지속성
- 다크 모드 UI

## 설치 및 실행

### 사전 요구사항

- Node.js (v14 이상)
- npm 또는 yarn
- (선택사항) MCP 서버 및 MySQL 데이터베이스

### 설치

```bash
# 리포지토리 클론
git clone <repository-url>
cd ai-chat

# 의존성 설치
npm install
```

### 실행

```bash
# 개발 모드로 실행 (Mock 데이터 사용)
npm run start:mock

# 실제 MCP 서버와 연결하여 실행
npm run start:prod
```

## 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
REACT_APP_USE_MOCK=true/false  # Mock 데이터 사용 여부
REACT_APP_MCP_SERVER_URL=http://your-mcp-server-url  # MCP 서버 URL
```

## 프로젝트 구조

```
src/
├── api/                   # API 관련 파일
│   ├── mcpService.ts      # MCP 서버 연동 서비스
│   └── mockMcpService.ts  # Mock 서비스
├── components/            # 리액트 컴포넌트
│   ├── ChatInterface.tsx  # 채팅 인터페이스
│   ├── ConversationSidebar.tsx  # 대화 목록 사이드바
│   └── ModelSelector.tsx  # LLM 모델 선택기
├── hooks/                 # 커스텀 훅
│   └── useChatService.ts  # 채팅 서비스 훅
├── types/                 # TypeScript 타입 정의
│   └── index.ts
├── App.tsx                # 메인 애플리케이션 컴포넌트
└── index.tsx              # 애플리케이션 엔트리 포인트
```

## 기술 스택

- React 19
- TypeScript
- Material UI
- React Query
- Axios

## MySQL 데이터베이스 스키마

```sql
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  modelId VARCHAR(50) NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversationId VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id)
);
```
