# CopilotKit Self-Hosted TypeScript + Express Template

This Railway template provides a production-ready setup for self-hosting a CopilotKit backend with support for multiple AI model providers (OpenAI, Azure OpenAI, Anthropic, Groq, Google Gemini, AWS Bedrock, LangChain, and OpenAI Assistants). Built with TypeScript for better type safety and developer experience.

## Features
- **Multi-provider AI model support** with intelligent fallback mechanism
- **Default Provider Override** - specify which provider to use as primary with `DEFAULT_PROVIDER`
- **Multiple Endpoint Routes** - dedicated endpoints for each provider (e.g., `/api/copilotkit/openai`, `/api/copilotkit/anthropic`)
- **AWS Bedrock Integration** - full support for Amazon's Bedrock models
- **TypeScript** for enhanced type safety and IntelliSense
- **Optimized Docker** image with multi-stage build
- **Environment variable management** for secure configuration
- **Comprehensive health checks** and monitoring endpoints
- **Scalable Express.js** server setup
- **Advanced logging** and error handling
- **Real-time debugging** with detailed provider status

## Supported AI Providers
- **OpenAI** - GPT-4, GPT-3.5, and other OpenAI models
- **Azure OpenAI** - OpenAI models hosted on Azure
- **Anthropic** - Claude 3.5 Sonnet and other Claude models
- **Groq** - High-speed inference with Llama and other models
- **Google Gemini** - Gemini Pro and Flash models
- **Amazon Bedrock** - Claude, Titan, Cohere, AI21, and Meta models
- **LangChain** - OpenAI models through LangChain framework
- **OpenAI Assistants** - Custom OpenAI assistants with tools

## Prerequisites
- Railway account (for deployment)
- API keys/credentials for at least one supported AI provider
- Node.js 18+ (for local development)
- Docker (for containerized development)

## API Endpoints

### Primary Endpoints
- **Default**: `/api/copilotkit` - Uses primary configured provider or `DEFAULT_PROVIDER`
- **OpenAI**: `/api/copilotkit/openai`
- **Azure OpenAI**: `/api/copilotkit/azure_openai`
- **Anthropic**: `/api/copilotkit/anthropic`
- **Groq**: `/api/copilotkit/groq`
- **Google Gemini**: `/api/copilotkit/gemini`
- **AWS Bedrock**: `/api/copilotkit/bedrock`
- **LangChain**: `/api/copilotkit/langchain`
- **OpenAI Assistant**: `/api/copilotkit/openai_assistant`

### Utility Endpoints
- **Health Check**: `/health` - Server status and configured providers
- **Provider Status**: `/api/providers` - Detailed provider configuration
- **Endpoints List**: `/api/endpoints` - All available endpoints with models

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
   - **API Endpoint:** http://localhost:4000/api/copilotkit
   - **Health Check:** http://localhost:4000/health
   - **Provider Status:** http://localhost:4000/api/providers
   - **Endpoints List:** http://localhost:4000/api/endpoints

### Railway Deployment
1. Clone this repository or use this template directly in Railway.
2. Deploy to Railway using the CLI or dashboard:
   ```bash
   railway up
   ```
3. Configure environment variables in the Railway dashboard.

## Environment Variables

### Core Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `4000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `DEFAULT_PROVIDER` | Override default provider | *first configured* | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | *allow all* | No |

### Provider Priority
Set `DEFAULT_PROVIDER` to specify which provider should handle the default `/api/copilotkit` endpoint:
```bash
DEFAULT_PROVIDER=anthropic  # Use Anthropic as default
DEFAULT_PROVIDER=gemini     # Use Google Gemini as default
DEFAULT_PROVIDER=bedrock    # Use AWS Bedrock as default
```

Available options: `openai`, `azure_openai`, `anthropic`, `groq`, `gemini`, `bedrock`, `langchain`, `openai_assistant`, `empty_adapter`

### CORS Configuration
Configure Cross-Origin Resource Sharing (CORS) for frontend access:
```bash
# Allow specific origins (recommended for production)
# Don't add trailing slash ❌ http://localhost:3000/ ✅ http://localhost:3000
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com,https://www.yourdomain.com

# Allow all origins (default if not specified - use with caution in production)
# CORS_ORIGINS=
```

### OpenAI Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | - | For OpenAI* |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o` | No |

### Azure OpenAI Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | - | For Azure* |
| `AZURE_OPENAI_BASE_URL` | Azure OpenAI endpoint URL | - | For Azure* |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version | `2024-04-01-preview` | No |

### Anthropic Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | - | For Anthropic* |
| `ANTHROPIC_MODEL` | Anthropic model name | `claude-3-5-sonnet-20241022` | No |

### Groq Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROQ_API_KEY` | Groq API key | - | For Groq* |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` | No |

### Google Gemini Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key | - | For Gemini* |
| `GOOGLE_MODEL` | Google model name | `gemini-1.5-pro` | No |

### AWS Bedrock Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | - | For Bedrock* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | - | For Bedrock* |
| `AWS_SESSION_TOKEN` | AWS session token | - | For Bedrock* |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `AWS_BEDROCK_MODEL` | Bedrock model name | `amazon.nova-lite-v1:0` | No |

#### Available Bedrock Models:
- `amazon.nova-lite-v1:0` (default)
- `amazon.nova-micro-v1:0`
- `amazon.nova-pro-v1:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`
- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-v2:1`
- `amazon.titan-text-express-v1`
- `cohere.command-text-v14`
- `ai21.j2-ultra-v1`
- `meta.llama2-70b-chat-v1`

### LangChain Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LANGCHAIN_OPENAI_API_KEY` | OpenAI API key for LangChain | `OPENAI_API_KEY` | For LangChain* |
| `LANGCHAIN_MODEL` | LangChain model name | `gpt-4o` | No |

### OpenAI Assistant Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_ASSISTANT_API_KEY` | OpenAI API key for Assistants | `OPENAI_API_KEY` | For Assistant* |
| `OPENAI_ASSISTANT_ID` | OpenAI Assistant ID | - | For Assistant* |
| `OPENAI_ORGANIZATION_ID` | OpenAI Organization ID | - | For Assistant* |
| `OPENAI_CODE_INTERPRETER` | Enable code interpreter | `false` | No |
| `OPENAI_FILE_SEARCH` | Enable file search | `false` | No |

### Development Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_EMPTY_ADAPTER` | Enable empty/fallback adapter | `false` | No |

**At least one provider configuration is required for operation. If no providers are configured, the server will use an Empty adapter as fallback.*

## Usage Examples

### Multiple Providers Setup
```bash
# Use multiple providers with Anthropic as default
DEFAULT_PROVIDER=anthropic
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=AIza-xxxxx
```

### AWS Bedrock Only
```bash
# Use AWS Bedrock as the only provider
DEFAULT_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=AKIA-xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_SESSION_TOKEN=xxxxx
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=amazon.nova-pro-v1:0
```

### CORS Configuration Examples
```bash
# Development setup - allow local frontend
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Production setup - specific domains only
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# Allow all origins (default - use with caution in production)
# CORS_ORIGINS=
```

### Debugging and Monitoring
The server provides comprehensive logging on startup:
```
🔒 CORS configured for origins: http://localhost:3000, https://yourdomain.com
🚀 CopilotKit Runtime Server running on port 4000
📡 Configured providers: 3
🎯 Default provider: anthropic (claude-3-5-sonnet-20241022)
  ✅ OpenAI
  ✅ Anthropic Claude
  ✅ Google Gemini

🔗 Available endpoints:
  📍 Default: http://localhost:4000/api/copilotkit (uses anthropic)
  📍 openai: http://localhost:4000/api/copilotkit/openai
  📍 anthropic: http://localhost:4000/api/copilotkit/anthropic
  📍 gemini: http://localhost:4000/api/copilotkit/gemini
```

## Error Handling
- **Graceful Fallbacks**: If a specified `DEFAULT_PROVIDER` isn't available, falls back to the first configured provider
- **Provider Validation**: Each provider is validated during startup with clear error messages
- **Dependency Checks**: Missing dependencies (like LangChain packages) are handled gracefully
- **Configuration Warnings**: Clear warnings for misconfigured providers
- **CORS Protection**: Configurable CORS origins for secure frontend access

## Security Best Practices
- **API Keys**: Store API keys in environment variables or secure secret management
- **AWS Credentials**: Use IAM roles for AWS Bedrock when possible
- **CORS**: Configure specific origins instead of allowing all in production
- **HTTPS**: Use HTTPS in production environments
- **Rate Limiting**: Consider implementing rate limiting for production deployments
- **Network Security**: Use proper network security groups and firewalls

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with multiple providers
5. Submit a pull request

## License
MIT License - see LICENSE file for details