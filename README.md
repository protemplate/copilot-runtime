# CopilotKit Self-Hosted TypeScript + Express Template

This Railway template provides a production-ready setup for self-hosting a CopilotKit backend with support for multiple AI model providers (OpenAI, Azure OpenAI, Anthropic, Groq, Google Gemini, xAI Grok, LangChain, and OpenAI Assistants). Built with TypeScript for better type safety and developer experience.

## Features
- Multi-provider AI model support with fallback mechanism
- TypeScript for enhanced type safety and IntelliSense
- Optimized Docker image with multi-stage build
- Environment variable management for secure configuration
- Health checks for reliable deployments
- Scalable Express.js server setup
- Comprehensive logging and error handling

## Prerequisites
- Railway account
- API keys for at least one supported AI provider:
  - OpenAI: Obtain from https://platform.openai.com
  - Azure OpenAI: Set up through Azure Portal
  - Anthropic: Obtain from https://console.anthropic.com
  - Groq: Obtain from https://console.groq.com
  - Google Gemini: Obtain from https://aistudio.google.com
  - xAI (Grok): Obtain from https://x.ai/api
  - LangChain: Uses OpenAI keys with LangChain framework
  - OpenAI Assistants: Create assistants via OpenAI platform

## Setup Instructions

### Local Development
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your API keys:
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm start
   ```

### Docker Development
1. Clone this repository
2. Create a `.env` file with your API keys:
   ```bash
   # Copy the example and edit with your keys
   cp env.example .env
   ```
3. Run with Docker Compose:
   ```bash
   # Production-like build
   docker-compose up --build
   
   # Development mode with hot reload
   docker-compose -f docker-compose.dev.yml up --build
   ```
4. Access the server:
   - **API Endpoint:** http://localhost:3000/api/copilotkit
   - **Health Check:** http://localhost:3000/health
   - **Provider Status:** http://localhost:3000/api/providers

### Railway Deployment
1. Clone this repository or use this template directly in Railway.
2. Deploy to Railway using the CLI or dashboard:
   ```bash
   railway up
   ```
3. Configure environment variables in the Railway dashboard.

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | OpenAI API key | Optional* |
| AZURE_OPENAI_API_KEY | Azure OpenAI API key | Optional* |
| AZURE_OPENAI_BASE_URL | Azure OpenAI endpoint URL | Required if using Azure |
| AZURE_OPENAI_API_VERSION | Azure OpenAI API version | Optional (default: 2024-04-01-preview) |
| ANTHROPIC_API_KEY | Anthropic API key | Optional* |
| GROQ_API_KEY | Groq API key | Optional* |
| GOOGLE_API_KEY | Google Gemini API key | Optional* |
| XAI_API_KEY | xAI Grok API key | Optional* |
| OPENAI_MODEL | OpenAI model name | Optional (default: gpt-4-turbo) |
| ANTHROPIC_MODEL | Anthropic model name | Optional (default: claude-3-5-sonnet-20241022) |
| GROQ_MODEL | Groq model name | Optional (default: llama-3.1-70b-versatile) |
| GOOGLE_MODEL | Google model name | Optional (default: gemini-1.5-pro) |
| XAI_MODEL | xAI model name | Optional (default: grok-beta) |
| LANGCHAIN_OPENAI_API_KEY | OpenAI API key for LangChain | Optional* |
| LANGCHAIN_MODEL | LangChain model name | Optional (default: gpt-4o) |
| OPENAI_ASSISTANT_API_KEY | OpenAI API key for Assistants | Optional* |
| OPENAI_ASSISTANT_ID | OpenAI Assistant ID | Required if using Assistant |
| OPENAI_ORGANIZATION_ID | OpenAI Organization ID | Optional |
| OPENAI_CODE_INTERPRETER | Enable code interpreter | Optional (default: false) |
| OPENAI_FILE_SEARCH | Enable file search | Optional (default: false) |
| ENABLE_EMPTY_ADAPTER | Enable empty/fallback adapter | Optional (default: false) |
| PORT | Server port | Optional (default: 3000) |

*At least one API key is required for operation. If no keys are provided, the server will use an Empty adapter as fallback.
