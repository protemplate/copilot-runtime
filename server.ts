import express, { Application, Request, Response } from "express";
import {
  CopilotRuntime,
  OpenAIAdapter,
  AnthropicAdapter,
  GrokAdapter,
  GroqAdapter,
  GoogleGenerativeAIAdapter,
  LangChainAdapter,
  OpenAIAssistantAdapter,
  EmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app: Application = express();
app.use(express.json());

// Define adapter types for better type safety
type SupportedAdapter = 
  | OpenAIAdapter 
  | AnthropicAdapter 
  | GrokAdapter 
  | GroqAdapter 
  | GoogleGenerativeAIAdapter
  | LangChainAdapter
  | OpenAIAssistantAdapter
  | EmptyAdapter;

// Configure multiple AI model adapters based on environment variables
const adapters: SupportedAdapter[] = [];

// OpenAI Standard API
if (process.env.OPENAI_API_KEY) {
  adapters.push(new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  }));
}

// Azure OpenAI
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_BASE_URL) {
  adapters.push(new OpenAIAdapter({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: process.env.AZURE_OPENAI_BASE_URL,
    defaultQuery: {
      'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview'
    },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY
    }
  }));
}

// Anthropic Claude
if (process.env.ANTHROPIC_API_KEY) {
  adapters.push(new AnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  }));
}

// Groq
if (process.env.GROQ_API_KEY) {
  adapters.push(new GroqAdapter({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  }));
}

// Google Gemini
if (process.env.GOOGLE_API_KEY) {
  adapters.push(new GoogleGenerativeAIAdapter({
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.GOOGLE_MODEL || 'gemini-1.5-pro',
  }));
}

// xAI Grok
if (process.env.XAI_API_KEY) {
  adapters.push(new GrokAdapter({
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL || 'grok-beta',
  }));
}

// LangChain Adapter (requires additional setup)
if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
  try {
    // Dynamic import to handle optional dependency
    const { ChatOpenAI } = require('@langchain/openai');
    
    const model = new ChatOpenAI({ 
      model: process.env.LANGCHAIN_MODEL || 'gpt-4o', 
      apiKey: process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY 
    });
    
    adapters.push(new LangChainAdapter({
      chainFn: async ({ messages, tools }) => {
        return model.bindTools(tools).stream(messages);
      }
    }));
  } catch (error) {
    console.warn('LangChain dependencies not installed. Skipping LangChain adapter.');
  }
}

// OpenAI Assistant Adapter
if (process.env.OPENAI_ASSISTANT_API_KEY && process.env.OPENAI_ASSISTANT_ID) {
  try {
    // Dynamic import to handle optional dependency
    const OpenAI = require('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_ASSISTANT_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID
    });
    
    adapters.push(new OpenAIAssistantAdapter({
      openai,
      assistantId: process.env.OPENAI_ASSISTANT_ID,
      codeInterpreterEnabled: process.env.OPENAI_CODE_INTERPRETER === 'true',
      fileSearchEnabled: process.env.OPENAI_FILE_SEARCH === 'true',
    }));
  } catch (error) {
    console.warn('OpenAI SDK not installed. Skipping OpenAI Assistant adapter.');
  }
}

// Empty Adapter (fallback/testing)
if (process.env.ENABLE_EMPTY_ADAPTER === 'true') {
  adapters.push(new EmptyAdapter());
}

// Validate that at least one adapter is configured, or use Empty adapter as fallback
if (adapters.length === 0) {
  console.warn('No API keys provided. Using Empty adapter as fallback.');
  console.warn('For production use, please set at least one of the following environment variables:');
  console.warn('- OPENAI_API_KEY');
  console.warn('- AZURE_OPENAI_API_KEY (with AZURE_OPENAI_BASE_URL)');
  console.warn('- ANTHROPIC_API_KEY');
  console.warn('- GROQ_API_KEY');
  console.warn('- GOOGLE_API_KEY');
  console.warn('- XAI_API_KEY');
  console.warn('- LANGCHAIN_OPENAI_API_KEY (with LangChain dependencies)');
  console.warn('- OPENAI_ASSISTANT_API_KEY (with OPENAI_ASSISTANT_ID)');
  
  // Add Empty adapter as fallback
  adapters.push(new EmptyAdapter());
}

// Initialize CopilotRuntime with all configured adapters
const copilotRuntime = new CopilotRuntime();

// Use the official CopilotKit endpoint handler
app.use('/api/copilotkit', copilotRuntimeNodeHttpEndpoint({
  endpoint: '/api/copilotkit',
  runtime: copilotRuntime,
  serviceAdapter: adapters[0], // Primary adapter
}));

// Alternative manual endpoint (keeping for backward compatibility)
app.post('/api/copilotkit/manual', async (req: Request, res: Response): Promise<void> => {
  try {
    const runtime = new CopilotRuntime({
      serviceAdapter: adapters[0],
    });
    const response = await runtime.process(req.body);
    res.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  const activeProviders = [];
  
  if (process.env.OPENAI_API_KEY) activeProviders.push('OpenAI');
  if (process.env.AZURE_OPENAI_API_KEY) activeProviders.push('Azure OpenAI');
  if (process.env.ANTHROPIC_API_KEY) activeProviders.push('Anthropic');
  if (process.env.GROQ_API_KEY) activeProviders.push('Groq');
  if (process.env.GOOGLE_API_KEY) activeProviders.push('Google Gemini');
  if (process.env.XAI_API_KEY) activeProviders.push('xAI Grok');
  if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY) activeProviders.push('LangChain');
  if (process.env.OPENAI_ASSISTANT_API_KEY) activeProviders.push('OpenAI Assistant');
  if (process.env.ENABLE_EMPTY_ADAPTER === 'true') activeProviders.push('Empty Adapter');

  res.status(200).json({ 
    status: 'healthy',
    adapters: adapters.length,
    providers: activeProviders,
    timestamp: new Date().toISOString()
  });
});

// Provider status endpoint
app.get('/api/providers', (req: Request, res: Response): void => {
  const providers = {
    openai: !!process.env.OPENAI_API_KEY,
    azure_openai: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_BASE_URL),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
    xai: !!process.env.XAI_API_KEY,
    langchain: !!(process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
    openai_assistant: !!(process.env.OPENAI_ASSISTANT_API_KEY && process.env.OPENAI_ASSISTANT_ID),
    empty_adapter: process.env.ENABLE_EMPTY_ADAPTER === 'true',
  };

  res.json({
    total_configured: adapters.length,
    providers
  });
});

const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, (): void => {
  console.log(`🚀 CopilotKit Runtime Server running on port ${PORT}`);
  console.log(`📡 Configured providers: ${adapters.length}`);
  
  if (process.env.OPENAI_API_KEY) console.log('  ✅ OpenAI');
  if (process.env.AZURE_OPENAI_API_KEY) console.log('  ✅ Azure OpenAI');
  if (process.env.ANTHROPIC_API_KEY) console.log('  ✅ Anthropic Claude');
  if (process.env.GROQ_API_KEY) console.log('  ✅ Groq');
  if (process.env.GOOGLE_API_KEY) console.log('  ✅ Google Gemini');
  if (process.env.XAI_API_KEY) console.log('  ✅ xAI Grok');
  if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY) console.log('  ✅ LangChain');
  if (process.env.OPENAI_ASSISTANT_API_KEY) console.log('  ✅ OpenAI Assistant');
  if (process.env.ENABLE_EMPTY_ADAPTER === 'true') console.log('  ✅ Empty Adapter (Fallback)');
  
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Providers status: http://localhost:${PORT}/api/providers`);
});
