import express, { Application, Request, Response } from "express";
import {
  CopilotRuntime,
  OpenAIAdapter,
  AnthropicAdapter,
  GroqAdapter,
  GoogleGenerativeAIAdapter,
  LangChainAdapter,
  OpenAIAssistantAdapter,
  EmptyAdapter,
  BedrockAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app: Application = express();

// Configure CORS manually
const configureCORS = () => {
  const corsOrigins = process.env.CORS_ORIGINS;
  
  // Log CORS configuration once during startup
  if (corsOrigins) {
    const allowedOrigins = corsOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    console.log(`🔒 CORS configured for origins: ${allowedOrigins.join(', ')}`);
  } else {
    console.log('🌐 CORS configured to allow all origins (*)');
  }
  
  return (req: Request, res: Response, next: () => void) => {
    const origin = req.headers.origin;
    
    if (corsOrigins && corsOrigins.trim() !== '*') {
      // Handle specific origins
      const allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());
      if (allowedOrigins.includes(origin as string)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      // Allow all origins (either no CORS_ORIGINS set or CORS_ORIGINS=*)
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  };
};

app.use(configureCORS());
app.use(express.json());

// Define adapter types for better type safety
type SupportedAdapter =
  | OpenAIAdapter
  | AnthropicAdapter
  | GroqAdapter
  | GoogleGenerativeAIAdapter
  | LangChainAdapter
  | OpenAIAssistantAdapter
  | EmptyAdapter
  | BedrockAdapter;

// Configure multiple AI model adapters based on environment variables
const adapters: SupportedAdapter[] = [];
const adapterTypes: string[] = []; // Track the type of each adapter

// OpenAI Standard API
if (process.env.OPENAI_API_KEY) {
  adapters.push(
    new OpenAIAdapter({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
    })
  );
  adapterTypes.push("openai");
}

// Azure OpenAI
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_BASE_URL) {
  const OpenAI = require("openai");
  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: process.env.AZURE_OPENAI_BASE_URL,
    defaultQuery: {
      "api-version":
        process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview",
    },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
  });
  adapters.push(new OpenAIAdapter({ openai }));
  adapterTypes.push("azure_openai");
}

// Anthropic Claude
if (process.env.ANTHROPIC_API_KEY) {
  adapters.push(
    new AnthropicAdapter({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    })
  );
  adapterTypes.push("anthropic");
}

// Groq
if (process.env.GROQ_API_KEY) {
  adapters.push(
    new GroqAdapter({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    })
  );
  adapterTypes.push("groq");
}

// Google Gemini
if (process.env.GOOGLE_API_KEY) {
  adapters.push(
    new GoogleGenerativeAIAdapter({
      model: process.env.GOOGLE_MODEL || "gemini-1.5-pro",
    })
  );
  adapterTypes.push("gemini");
}

// Amazon Bedrock
if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SESSION_TOKEN
) {
  try {
    adapters.push(
      new BedrockAdapter({
        region: process.env.AWS_REGION || "us-east-1",
        model: process.env.AWS_BEDROCK_MODEL || "amazon.nova-lite-v1:0",
      })
    );
    adapterTypes.push("bedrock");
  } catch (error) {
    console.warn(
      "AWS Bedrock configuration error. Skipping Bedrock adapter.",
      error
    );
  }
}

// LangChain Adapter (requires additional setup)
if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
  try {
    // Dynamic import to handle optional dependency
    const { ChatOpenAI } = require("@langchain/openai");

    const model = new ChatOpenAI({
      model: process.env.LANGCHAIN_MODEL || "gpt-4o",
      apiKey:
        process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    });

    adapters.push(
      new LangChainAdapter({
        chainFn: async ({ messages, tools }) => {
          return model.bindTools(tools).stream(messages);
        },
      })
    );
    adapterTypes.push("langchain");
  } catch (error) {
    console.warn(
      "LangChain dependencies not installed. Skipping LangChain adapter."
    );
  }
}

// OpenAI Assistant Adapter
if (
  process.env.OPENAI_ORGANIZATION_ID &&
  process.env.OPENAI_ASSISTANT_ID &&
  (process.env.OPENAI_ASSISTANT_API_KEY || process.env.OPENAI_API_KEY)
) {
  try {
    // Dynamic import to handle optional dependency
    const OpenAI = require("openai");

    const openai = new OpenAI({
      apiKey:
        process.env.OPENAI_ASSISTANT_API_KEY || process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID,
    });

    adapters.push(
      new OpenAIAssistantAdapter({
        openai,
        assistantId: process.env.OPENAI_ASSISTANT_ID,
        codeInterpreterEnabled: process.env.OPENAI_CODE_INTERPRETER === "true",
        fileSearchEnabled: process.env.OPENAI_FILE_SEARCH === "true",
      })
    );
    adapterTypes.push("openai_assistant");
  } catch (error) {
    console.warn(
      "OpenAI SDK not installed. Skipping OpenAI Assistant adapter."
    );
  }
}

// Empty Adapter (fallback/testing)
if (process.env.ENABLE_EMPTY_ADAPTER === "true") {
  adapters.push(new EmptyAdapter());
  adapterTypes.push("empty_adapter");
}

// Validate that at least one adapter is configured, or use Empty adapter as fallback
if (adapters.length === 0) {
  console.warn("No API keys provided. Using Empty adapter as fallback.");
  console.warn(
    "For production use, please set at least one of the following environment variables:"
  );
  console.warn("- OPENAI_API_KEY");
  console.warn("- AZURE_OPENAI_API_KEY (with AZURE_OPENAI_BASE_URL)");
  console.warn("- ANTHROPIC_API_KEY");
  console.warn("- GROQ_API_KEY");
  console.warn("- GOOGLE_API_KEY");
  console.warn(
    "- AWS_ACCESS_KEY_ID (with AWS_SECRET_ACCESS_KEY and AWS_REGION)"
  );
  console.warn("- LANGCHAIN_OPENAI_API_KEY (with LangChain dependencies)");
  console.warn("- OPENAI_ASSISTANT_API_KEY (with OPENAI_ASSISTANT_ID)");

  // Add Empty adapter as fallback
  adapters.push(new EmptyAdapter());
  adapterTypes.push("empty_adapter");
}

// Initialize CopilotRuntime with all configured adapters
const copilotRuntime = new CopilotRuntime();

// Create a mapping of adapter names to their instances using the tracked types
const adapterMap: Record<string, SupportedAdapter> = {};

adapterTypes.forEach((type, index) => {
  adapterMap[type] = adapters[index];
});

// Determine the default adapter based on DEFAULT_PROVIDER environment variable
let defaultAdapter: SupportedAdapter;
let defaultAdapterType: string;

if (process.env.DEFAULT_PROVIDER && adapterMap[process.env.DEFAULT_PROVIDER]) {
  // Use the specified default provider if it exists
  defaultAdapterType = process.env.DEFAULT_PROVIDER;
  defaultAdapter = adapterMap[defaultAdapterType];
  console.log(`🎯 Using specified DEFAULT_PROVIDER: ${defaultAdapterType}`);
} else {
  // Fall back to the first configured adapter
  defaultAdapterType = adapterTypes.length > 0 ? adapterTypes[0] : "none";
  defaultAdapter = adapters[0];

  if (process.env.DEFAULT_PROVIDER) {
    console.warn(
      `⚠️  DEFAULT_PROVIDER="${
        process.env.DEFAULT_PROVIDER
      }" specified but not available. Available providers: ${Object.keys(
        adapterMap
      ).join(", ")}`
    );
    console.warn(
      `   Falling back to first configured adapter: ${defaultAdapterType}`
    );
  }
}

// Debug logging
console.log("🔍 Debug Info:");
console.log("  Adapter types:", adapterTypes);
console.log("  Adapters count:", adapters.length);
console.log("  Adapter map keys:", Object.keys(adapterMap));
console.log("  Environment variables status:");
console.log("    OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY);
console.log("    GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
console.log("    ANTHROPIC_API_KEY:", !!process.env.ANTHROPIC_API_KEY);
console.log("    GROQ_API_KEY:", !!process.env.GROQ_API_KEY);
console.log("    AWS_ACCESS_KEY_ID:", !!process.env.AWS_ACCESS_KEY_ID);
console.log("    CORS_ORIGINS:", process.env.CORS_ORIGINS || "not set (allowing all)");
console.log("    DEFAULT_PROVIDER:", process.env.DEFAULT_PROVIDER || "not set");
console.log("  Selected default adapter:", defaultAdapterType);

// Alternative manual endpoints for specific adapters
Object.entries(adapterMap).forEach(([name, adapter]) => {
  console.log(`📍 Registering endpoint: /api/copilotkit/${name}`);
  app.use(
    `/api/copilotkit/${name}`,
    copilotRuntimeNodeHttpEndpoint({
      endpoint: `/api/copilotkit/${name}`,
      runtime: copilotRuntime,
      serviceAdapter: adapter,
    })
  );
});

// Use the official CopilotKit endpoint handler
app.use(
  "/api/copilotkit",
  copilotRuntimeNodeHttpEndpoint({
    endpoint: "/api/copilotkit",
    runtime: copilotRuntime,
    serviceAdapter: defaultAdapter,
  })
);

// Helper function to get the model name for a given adapter type
function getModelForAdapter(adapterType: string): string {
  switch (adapterType) {
    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4o";
    case "azure_openai":
      return process.env.AZURE_OPENAI_MODEL || "gpt-4o";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    case "groq":
      return process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
    case "gemini":
      return process.env.GOOGLE_MODEL || "gemini-1.5-pro";
    case "langchain":
      return process.env.LANGCHAIN_MODEL || "gpt-4o";
    case "openai_assistant":
      return `Assistant ID: ${
        (process.env.OPENAI_ASSISTANT_ID &&
          (process.env.OPENAI_API_KEY ||
            process.env.OPENAI_ASSISTANT_API_KEY) &&
          process.env.OPENAI_ORGANIZATION_ID) ||
        "unknown"
      }`;
    case "empty_adapter":
      return "Empty Adapter (No Model)";
    case "bedrock":
      return process.env.AWS_BEDROCK_MODEL || "amazon.nova-lite-v1:0";
    default:
      return "Unknown";
  }
}

// Health check endpoint
app.get("/health", (req: Request, res: Response): void => {
  const activeProviders = [];

  if (process.env.OPENAI_API_KEY) activeProviders.push("OpenAI");
  if (process.env.AZURE_OPENAI_API_KEY) activeProviders.push("Azure OpenAI");
  if (process.env.ANTHROPIC_API_KEY) activeProviders.push("Anthropic");
  if (process.env.GROQ_API_KEY) activeProviders.push("Groq");
  if (process.env.GOOGLE_API_KEY) activeProviders.push("Google Gemini");
  if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
    activeProviders.push("LangChain");
  if (
    (process.env.OPENAI_ASSISTANT_API_KEY || process.env.OPENAI_API_KEY) &&
    process.env.OPENAI_ASSISTANT_ID &&
    process.env.OPENAI_ORGANIZATION_ID
  )
    activeProviders.push("OpenAI Assistant");
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_SESSION_TOKEN
  )
    activeProviders.push("AWS Bedrock");
  if (process.env.ENABLE_EMPTY_ADAPTER === "true")
    activeProviders.push("Empty Adapter");

  // Get default adapter info
  const defaultModel = getModelForAdapter(defaultAdapterType);

  res.status(200).json({
    status: "healthy",
    adapters: adapters.length,
    providers: activeProviders,
    default_endpoint: {
      adapter_type: defaultAdapterType,
      model: defaultModel,
    },
    timestamp: new Date().toISOString(),
  });
});

// Provider status endpoint
app.get("/api/providers", (req: Request, res: Response): void => {
  const providers = {
    openai: !!process.env.OPENAI_API_KEY,
    azure_openai: !!(
      process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_BASE_URL
    ),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GOOGLE_API_KEY,
    langchain: !!(
      process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    ),
    openai_assistant: !!(
      (process.env.OPENAI_ASSISTANT_API_KEY || process.env.OPENAI_API_KEY) &&
      process.env.OPENAI_ASSISTANT_ID &&
      process.env.OPENAI_ORGANIZATION_ID
    ),
    empty_adapter: process.env.ENABLE_EMPTY_ADAPTER === "true",
    bedrock: !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_SESSION_TOKEN
    ),
  };

  // Get default adapter info
  const defaultModel = getModelForAdapter(defaultAdapterType);

  res.json({
    total_configured: adapters.length,
    providers,
    default_endpoint: {
      adapter_type: defaultAdapterType,
      model: defaultModel,
      endpoint: "/api/copilotkit",
    },
  });
});

// Endpoints listing endpoint
app.get("/api/endpoints", (req: Request, res: Response): void => {
  const endpoints = [
    "/api/copilotkit", // Default endpoint
    ...Object.keys(adapterMap).map((name) => `/api/copilotkit/${name}`),
  ];

  const defaultModel = getModelForAdapter(defaultAdapterType);

  res.json({
    available_endpoints: endpoints,
    adapter_types: adapterTypes,
    total_adapters: adapters.length,
    default_endpoint: {
      path: "/api/copilotkit",
      adapter_type: defaultAdapterType,
      model: defaultModel,
    },
    specific_endpoints: Object.keys(adapterMap).map((name) => ({
      path: `/api/copilotkit/${name}`,
      adapter_type: name,
      model: getModelForAdapter(name),
    })),
  });
});

const PORT: number = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, (): void => {
  console.log(`🚀 CopilotKit Runtime Server running on port ${PORT}`);
  console.log(`📡 Configured providers: ${adapters.length}`);
  console.log(
    `🎯 Default provider: ${defaultAdapterType} (${getModelForAdapter(
      defaultAdapterType
    )})`
  );

  if (process.env.OPENAI_API_KEY) console.log("  ✅ OpenAI");
  if (process.env.AZURE_OPENAI_API_KEY) console.log("  ✅ Azure OpenAI");
  if (process.env.ANTHROPIC_API_KEY) console.log("  ✅ Anthropic Claude");
  if (process.env.GROQ_API_KEY) console.log("  ✅ Groq");
  if (process.env.GOOGLE_API_KEY) console.log("  ✅ Google Gemini");
  if (process.env.LANGCHAIN_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
    console.log("  ✅ LangChain");
  if (process.env.OPENAI_ASSISTANT_API_KEY)
    console.log("  ✅ OpenAI Assistant");
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  )
    console.log("  ✅ AWS Bedrock");
  if (process.env.ENABLE_EMPTY_ADAPTER === "true")
    console.log("  ✅ Empty Adapter (Fallback)");

  console.log(`\n🔗 Available endpoints:`);
  console.log(
    `  📍 Default: http://localhost:${PORT}/api/copilotkit (uses ${defaultAdapterType})`
  );
  Object.keys(adapterMap).forEach((name) => {
    console.log(
      `  📍 ${name}: http://localhost:${PORT}/api/copilotkit/${name}`
    );
  });

  console.log(`\n🔗 Utility endpoints:`);
  console.log(`  🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`  🔗 Providers status: http://localhost:${PORT}/api/providers`);
  console.log(`  🔗 Endpoints list: http://localhost:${PORT}/api/endpoints`);

  if (!process.env.DEFAULT_PROVIDER) {
    console.log(
      `\n💡 Tip: Set DEFAULT_PROVIDER=<provider> to specify default adapter`
    );
    console.log(`   Available options: ${Object.keys(adapterMap).join(", ")}`);
  }
});
