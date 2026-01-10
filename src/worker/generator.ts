/**
 * AI Generator for Architecture Designs
 * 
 * Uses OpenAI GPT-4 to generate architecture plans and Mermaid diagrams.
 */

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type DetailLevel = "OVERVIEW" | "STANDARD" | "DETAILED";

export interface DesignInput {
  inputType: "PROMPT" | "REPO_URL";
  promptText?: string;
  repoUrl?: string;
  constraints: {
    mustUse?: string[];
    avoid?: string[];
    preferredLanguage?: string;
  };
  scaleProfile: "PROTOTYPE" | "DAU_1K" | "DAU_1M";
  detailLevel?: DetailLevel;
  // Quick suggestions for architecture enhancements
  suggestions?: string[];
  // For refinement
  existingDesign?: DesignOutput;
  refinementPrompt?: string;
}

export interface Component {
  name: string;
  type: string;
  description: string;
  technologies: string[];
  icon?: string; // Technology icon identifier
  cloudProvider?: string;
  framework?: string;
}

export interface DataStore {
  name: string;
  type: string;
  description: string;
  technology: string;
  icon?: string;
  cloudService?: string; // e.g., "Amazon RDS", "Google Cloud SQL"
}

export interface Api {
  name: string;
  type: string;
  description: string;
  endpoints?: string[];
  protocol?: string; // REST, GraphQL, gRPC, WebSocket
  authentication?: string;
}

export interface SecurityItem {
  category: string;
  measures: string[];
  tools?: string[]; // Security tools/services used
}

export interface ScaleChange {
  category: string;
  description: string;
  services?: string[]; // Cloud services for scaling
}

export interface DesignOutput {
  components: Component[];
  dataStores: DataStore[];
  apis: Api[];
  security: SecurityItem[];
  scaleChanges: ScaleChange[];
  cloudProvider?: string; // Primary cloud provider
  architectureStyle?: string; // Monolith, Microservices, Serverless, etc.
}

export interface GeneratedDesign {
  design: DesignOutput;
  mermaidDiagram: string;
}

// Technology icon mapping for common technologies
export const TECH_ICONS: Record<string, string> = {
  // Cloud Providers
  "aws": "fa:fa-aws",
  "gcp": "fa:fa-google",
  "azure": "fa:fa-microsoft",
  "vercel": "fa:fa-v",
  "netlify": "fa:fa-n",
  
  // Databases
  "postgresql": "fa:fa-database",
  "mysql": "fa:fa-database",
  "mongodb": "fa:fa-leaf",
  "redis": "fa:fa-bolt",
  "elasticsearch": "fa:fa-search",
  "dynamodb": "fa:fa-database",
  
  // Frontend
  "react": "fa:fa-react",
  "vue": "fa:fa-vuejs",
  "angular": "fa:fa-angular",
  "nextjs": "fa:fa-n",
  "svelte": "fa:fa-s",
  
  // Backend
  "nodejs": "fa:fa-node-js",
  "python": "fa:fa-python",
  "java": "fa:fa-java",
  "go": "fa:fa-g",
  "rust": "fa:fa-r",
  
  // Infrastructure
  "docker": "fa:fa-docker",
  "kubernetes": "fa:fa-dharmachakra",
  "nginx": "fa:fa-server",
  "cloudflare": "fa:fa-cloud",
  
  // Services
  "stripe": "fa:fa-stripe",
  "auth0": "fa:fa-lock",
  "sendgrid": "fa:fa-envelope",
  "twilio": "fa:fa-phone",
  
  // Generic
  "api": "fa:fa-plug",
  "web": "fa:fa-globe",
  "mobile": "fa:fa-mobile",
  "server": "fa:fa-server",
  "queue": "fa:fa-list",
  "cache": "fa:fa-bolt",
  "storage": "fa:fa-hdd",
  "cdn": "fa:fa-cloud",
  "gateway": "fa:fa-shield",
  "monitor": "fa:fa-chart-line",
  "user": "fa:fa-user",
  "security": "fa:fa-shield-alt",
};

function getDetailLevelInstructions(level: DetailLevel): string {
  switch (level) {
    case "OVERVIEW":
      return `
Generate a HIGH-LEVEL OVERVIEW diagram:
- Show only 4-6 main component groups (e.g., "Frontend", "Backend", "Database", "External Services")
- Use simple labels without specific technology names
- Focus on data flow direction only
- No specific frameworks, protocols, or cloud services in the diagram
- Keep it clean and easy to understand at a glance`;
    
    case "STANDARD":
      return `
Generate a STANDARD detail diagram:
- Show 6-10 components with their main technologies
- Include primary databases and caches
- Show main API connections
- Include cloud provider if relevant
- Add technology names to node labels`;
    
    case "DETAILED":
      return `
Generate a HIGHLY DETAILED diagram:
- Show all components with specific technologies and versions where relevant
- Include protocol types (HTTP, gRPC, WebSocket, etc.)
- Show specific cloud services (AWS Lambda, S3, CloudFront, etc.)
- Include authentication flows
- Show monitoring and logging services
- Add specific framework names (Next.js, Express, FastAPI, etc.)
- Include CI/CD pipeline if relevant
- Show data replication and failover paths
- Use detailed labels with technology stacks`;
    
    default:
      return "";
  }
}

const SYSTEM_PROMPT = `You are an expert software architect. Your task is to design comprehensive system architectures based on user requirements.

You must respond with a valid JSON object containing exactly this structure:
{
  "design": {
    "components": [
      {
        "name": "string - component name",
        "type": "string - Frontend/Backend/Service/Infrastructure/Gateway/Worker",
        "description": "string - what this component does",
        "technologies": ["array of technology names used"],
        "icon": "string - icon identifier from: react, vue, angular, nextjs, nodejs, python, java, go, docker, kubernetes, aws, gcp, azure, postgresql, mongodb, redis, nginx, cloudflare",
        "cloudProvider": "string - AWS/GCP/Azure/Vercel/Netlify if applicable",
        "framework": "string - specific framework used"
      }
    ],
    "dataStores": [
      {
        "name": "string - data store name",
        "type": "string - Relational/NoSQL/In-Memory/Object Storage/Search/Stream",
        "description": "string - purpose of this data store",
        "technology": "string - specific technology (PostgreSQL, Redis, etc.)",
        "icon": "string - icon identifier",
        "cloudService": "string - managed service name (Amazon RDS, Cloud SQL, etc.)"
      }
    ],
    "apis": [
      {
        "name": "string - API name",
        "type": "string - REST/GraphQL/WebSocket/gRPC",
        "description": "string - what this API handles",
        "endpoints": ["array of example endpoints"],
        "protocol": "string - HTTP/HTTPS/WSS/HTTP/2",
        "authentication": "string - JWT/OAuth2/API Key/Session"
      }
    ],
    "security": [
      {
        "category": "string - security category name",
        "measures": ["array of specific security measures"],
        "tools": ["array of security tools/services used"]
      }
    ],
    "scaleChanges": [
      {
        "category": "string - infrastructure area",
        "description": "string - what changes for this scale profile",
        "services": ["array of cloud services that help with scaling"]
      }
    ],
    "cloudProvider": "string - primary cloud provider (AWS/GCP/Azure/Multi-cloud)",
    "architectureStyle": "string - Monolith/Microservices/Serverless/Hybrid/Event-Driven"
  },
  "mermaidDiagram": "string - valid Mermaid flowchart diagram"
}

CRITICAL MERMAID DIAGRAM RULES:
1. Use flowchart TB (top to bottom) or flowchart LR (left to right)
2. Use subgraphs to group related components
3. Use THESE EXACT STYLES for visual clarity:
   - Clients: style NodeName fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
   - APIs/Gateways: style NodeName fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
   - Services: style NodeName fill:#FFF3E0,stroke:#EF6C00,color:#E65100
   - Databases: style NodeName fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
   - Caches: style NodeName fill:#FFEBEE,stroke:#C62828,color:#B71C1C
   - External: style NodeName fill:#ECEFF1,stroke:#546E7A,color:#37474F
   - Queues: style NodeName fill:#FFF8E1,stroke:#F9A825,color:#F57F17
4. Use descriptive node IDs without spaces
5. Use arrows with labels: A -->|"label"| B
6. Include technology names in node labels for STANDARD and DETAILED views

Example diagram format:
\`\`\`
flowchart TB
    subgraph Clients["Client Layer"]
        Web["🌐 Web App<br/>Next.js"]
        Mobile["📱 Mobile App<br/>React Native"]
    end
    
    subgraph Gateway["API Gateway"]
        ALB["⚖️ Load Balancer<br/>AWS ALB"]
        API["🔌 API Gateway<br/>Express"]
    end
    
    Web --> ALB
    Mobile --> ALB
    ALB --> API
    
    style Web fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style ALB fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style API fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
\`\`\`

Guidelines:
1. Create practical, production-ready architectures
2. Consider the scale profile when designing
3. Respect technology constraints (mustUse and avoid lists)
4. Use emojis in node labels for visual clarity
5. Always include explicit style definitions for each node
6. Make architecture coherent - components should logically connect`;

function formatUserPrompt(input: DesignInput): string {
  const scaleDescriptions = {
    PROTOTYPE: "a prototype/MVP with minimal infrastructure, no scaling concerns",
    DAU_1K: "a production system handling ~1,000 daily active users with basic redundancy",
    DAU_1M: "a large-scale production system handling ~1,000,000 daily active users with high availability",
  };

  const detailLevel = input.detailLevel || "STANDARD";
  const detailInstructions = getDetailLevelInstructions(detailLevel);

  let prompt = "";
  
  // Handle refinement case
  if (input.refinementPrompt && input.existingDesign) {
    prompt = `You are refining an existing architecture design based on user feedback.

EXISTING DESIGN:
${JSON.stringify(input.existingDesign, null, 2)}

USER REFINEMENT REQUEST:
${input.refinementPrompt}

Please update the design and diagram based on the user's feedback. Keep what works, modify what they asked to change.

${detailInstructions}

Provide the complete updated design with all fields.`;
    return prompt;
  }

  prompt = `Design a software architecture for the following:\n\n`;

  if (input.inputType === "PROMPT" && input.promptText) {
    prompt += `**Product Description:**\n${input.promptText}\n\n`;
  } else if (input.inputType === "REPO_URL" && input.repoUrl) {
    prompt += `**GitHub Repository:** ${input.repoUrl}\nAnalyze this as a codebase that needs architecture improvements.\n\n`;
  }

  prompt += `**Scale Profile:** ${input.scaleProfile} - Design for ${scaleDescriptions[input.scaleProfile]}\n\n`;
  prompt += `**Detail Level:** ${detailLevel}\n`;
  prompt += detailInstructions + "\n\n";

  if (input.constraints.mustUse && input.constraints.mustUse.length > 0) {
    prompt += `**Must Use Technologies:** ${input.constraints.mustUse.join(", ")}\n`;
  }

  if (input.constraints.avoid && input.constraints.avoid.length > 0) {
    prompt += `**Avoid Technologies:** ${input.constraints.avoid.join(", ")}\n`;
  }

  if (input.constraints.preferredLanguage) {
    prompt += `**Preferred Programming Language:** ${input.constraints.preferredLanguage}\n`;
  }

  // Add quick suggestions if provided
  if (input.suggestions && input.suggestions.length > 0) {
    prompt += `\n**Quick Suggestions to Include:**\n${input.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`;
    prompt += `Please incorporate these suggestions into the architecture design.\n`;
  }

  prompt += `\nProvide a complete architecture design with all specified fields, and a Mermaid diagram with proper styling.`;

  return prompt;
}

/**
 * Generate an architecture design using OpenAI GPT-4
 */
export async function generateDesign(input: DesignInput): Promise<GeneratedDesign> {
  console.log("[Generator] Starting OpenAI design generation...");
  console.log("[Generator] Detail level:", input.detailLevel || "STANDARD");

  try {
    const userPrompt = formatUserPrompt(input);
    console.log("[Generator] Sending request to OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 6000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    console.log("[Generator] Received response, parsing JSON...");
    const parsed = JSON.parse(content);

    if (!parsed.design || !parsed.mermaidDiagram) {
      throw new Error("Invalid response structure from OpenAI");
    }

    const design = parsed.design as DesignOutput;
    
    // Ensure the diagram has proper styling
    let diagram = parsed.mermaidDiagram;
    if (!diagram.includes("style ")) {
      diagram = addDefaultStyles(diagram);
    }

    console.log("[Generator] Successfully generated design with", {
      components: design.components.length,
      dataStores: design.dataStores.length,
      apis: design.apis.length,
      cloudProvider: design.cloudProvider,
      architectureStyle: design.architectureStyle,
    });

    return {
      design,
      mermaidDiagram: diagram,
    };
  } catch (error) {
    console.error("[Generator] OpenAI generation failed:", error);
    console.log("[Generator] Falling back to mock generation...");
    return generateMockDesign(input);
  }
}

/**
 * Refine an existing design with a prompt
 */
export async function refineDesign(
  existingDesign: DesignOutput,
  refinementPrompt: string,
  detailLevel: DetailLevel = "STANDARD"
): Promise<GeneratedDesign> {
  return generateDesign({
    inputType: "PROMPT",
    promptText: "",
    constraints: {},
    scaleProfile: "DAU_1K",
    detailLevel,
    existingDesign,
    refinementPrompt,
  });
}

/**
 * Add default styles to a Mermaid diagram if missing
 */
function addDefaultStyles(diagram: string): string {
  // Extract node IDs from the diagram
  const nodePattern = /(\w+)\[/g;
  const nodes: string[] = [];
  let match;
  while ((match = nodePattern.exec(diagram)) !== null) {
    nodes.push(match[1]);
  }

  // Add styles based on common naming patterns
  const styles: string[] = [];
  nodes.forEach((node) => {
    const lowerNode = node.toLowerCase();
    if (lowerNode.includes("client") || lowerNode.includes("web") || lowerNode.includes("mobile") || lowerNode.includes("user")) {
      styles.push(`style ${node} fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20`);
    } else if (lowerNode.includes("api") || lowerNode.includes("gateway") || lowerNode.includes("lb") || lowerNode.includes("load")) {
      styles.push(`style ${node} fill:#E3F2FD,stroke:#1565C0,color:#0D47A1`);
    } else if (lowerNode.includes("db") || lowerNode.includes("database") || lowerNode.includes("postgres") || lowerNode.includes("mongo")) {
      styles.push(`style ${node} fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C`);
    } else if (lowerNode.includes("cache") || lowerNode.includes("redis")) {
      styles.push(`style ${node} fill:#FFEBEE,stroke:#C62828,color:#B71C1C`);
    } else if (lowerNode.includes("queue") || lowerNode.includes("kafka") || lowerNode.includes("rabbit")) {
      styles.push(`style ${node} fill:#FFF8E1,stroke:#F9A825,color:#F57F17`);
    } else if (lowerNode.includes("service") || lowerNode.includes("worker")) {
      styles.push(`style ${node} fill:#FFF3E0,stroke:#EF6C00,color:#E65100`);
    } else {
      styles.push(`style ${node} fill:#ECEFF1,stroke:#546E7A,color:#37474F`);
    }
  });

  if (styles.length > 0) {
    return diagram + "\n\n    " + styles.join("\n    ");
  }
  return diagram;
}

/**
 * Fallback mock generator
 */
async function generateMockDesign(input: DesignInput): Promise<GeneratedDesign> {
  const language = input.constraints.preferredLanguage || "TypeScript";
  const mustUse = input.constraints.mustUse || [];
  const isLargeScale = input.scaleProfile === "DAU_1M";
  const isMediumScale = input.scaleProfile === "DAU_1K";
  const detailLevel = input.detailLevel || "STANDARD";

  const design: DesignOutput = {
    components: [
      {
        name: "Web Application",
        type: "Frontend",
        description: "Modern single-page application with responsive design",
        technologies: [
          language === "TypeScript" ? "React + TypeScript" : `React + ${language}`,
          "Tailwind CSS",
          mustUse.includes("Next.js") ? "Next.js" : "Vite",
        ],
        icon: "react",
        cloudProvider: "Vercel",
        framework: "Next.js",
      },
      {
        name: "API Gateway",
        type: "Gateway",
        description: "Central API layer handling authentication and routing",
        technologies: [
          mustUse.includes("Express") ? "Express.js" : "Fastify",
          language,
          "JWT Authentication",
        ],
        icon: "nodejs",
        cloudProvider: "AWS",
        framework: "Express.js",
      },
      {
        name: "Core Service",
        type: "Backend",
        description: "Business logic implementation with domain patterns",
        technologies: [language, "Domain Events", "CQRS"],
        icon: "nodejs",
        framework: "NestJS",
      },
    ],
    dataStores: [
      {
        name: "Primary Database",
        type: "Relational",
        description: "Main data store for structured business data",
        technology: mustUse.find((t) => ["PostgreSQL", "MySQL"].includes(t)) || "PostgreSQL",
        icon: "postgresql",
        cloudService: isLargeScale ? "Amazon Aurora" : "Amazon RDS",
      },
      {
        name: "Cache Layer",
        type: "In-Memory",
        description: "High-performance caching for sessions and hot data",
        technology: "Redis",
        icon: "redis",
        cloudService: "Amazon ElastiCache",
      },
    ],
    apis: [
      {
        name: "REST API",
        type: "REST",
        description: "Primary API for client-server communication",
        endpoints: ["POST /api/auth/login", "GET /api/resources", "POST /api/resources"],
        protocol: "HTTPS",
        authentication: "JWT",
      },
      {
        name: "WebSocket API",
        type: "WebSocket",
        description: "Real-time communication for live updates",
        endpoints: ["wss://api.example.com/ws"],
        protocol: "WSS",
        authentication: "JWT",
      },
    ],
    security: [
      {
        category: "Authentication",
        measures: ["JWT-based auth with refresh tokens", "OAuth 2.0 support", "Rate limiting"],
        tools: ["Auth0", "AWS Cognito"],
      },
      {
        category: "Data Protection",
        measures: ["TLS 1.3 encryption", "Password hashing with bcrypt", "Input validation"],
        tools: ["AWS KMS", "HashiCorp Vault"],
      },
    ],
    scaleChanges: [
      {
        category: "Compute",
        description: isLargeScale
          ? "Auto-scaling Kubernetes clusters across regions"
          : isMediumScale
          ? "Horizontal pod autoscaling"
          : "Single instance deployment",
        services: isLargeScale ? ["EKS", "Fargate", "CloudFront"] : ["EC2", "ALB"],
      },
      {
        category: "Database",
        description: isLargeScale
          ? "Multi-region Aurora with read replicas"
          : isMediumScale
          ? "RDS with read replica"
          : "Single RDS instance",
        services: isLargeScale ? ["Aurora Global", "DynamoDB Global Tables"] : ["RDS"],
      },
    ],
    cloudProvider: "AWS",
    architectureStyle: isLargeScale ? "Microservices" : "Modular Monolith",
  };

  // Generate diagram based on detail level
  let mermaidDiagram: string;
  
  if (detailLevel === "OVERVIEW") {
    mermaidDiagram = `flowchart TB
    subgraph Clients["👥 Clients"]
        Client["🌐 Users"]
    end

    subgraph Backend["⚙️ Backend"]
        API["🔌 API"]
        Services["📦 Services"]
    end

    subgraph Data["💾 Data"]
        DB["🗃️ Database"]
        Cache["⚡ Cache"]
    end

    Client --> API
    API --> Services
    Services --> DB
    Services --> Cache

    style Client fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style API fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Services fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C`;
  } else if (detailLevel === "DETAILED") {
    mermaidDiagram = `flowchart TB
    subgraph Clients["👥 Client Layer"]
        Web["🌐 Web App<br/>Next.js 14 + React 18<br/>Tailwind CSS"]
        Mobile["📱 Mobile App<br/>React Native<br/>Expo"]
    end

    subgraph Edge["🌍 Edge Layer"]
        CDN["☁️ CloudFront CDN<br/>Edge Caching<br/>WAF Protection"]
        DNS["🔗 Route 53<br/>DNS + Health Checks"]
    end

    subgraph Gateway["🚪 API Gateway Layer"]
        ALB["⚖️ Application LB<br/>AWS ALB<br/>SSL Termination"]
        APIGW["🔌 API Gateway<br/>Express.js + TypeScript<br/>Rate Limiting + Auth"]
    end

    subgraph Services["⚙️ Service Layer"]
        Auth["🔐 Auth Service<br/>JWT + OAuth2<br/>Cognito Integration"]
        Core["📦 Core Service<br/>NestJS<br/>Domain Logic"]
        Worker["👷 Background Worker<br/>BullMQ<br/>Job Processing"]
    end

    subgraph Data["💾 Data Layer"]
        Primary["🗃️ PostgreSQL<br/>Amazon Aurora<br/>Multi-AZ"]
        Cache["⚡ Redis Cluster<br/>ElastiCache<br/>Session + Cache"]
        Queue["📨 Message Queue<br/>Amazon SQS<br/>Async Processing"]
        S3["📁 Object Storage<br/>Amazon S3<br/>Files + Backups"]
    end

    subgraph Monitoring["📊 Observability"]
        Logs["📝 CloudWatch Logs"]
        Metrics["📈 Prometheus + Grafana"]
        Traces["🔍 X-Ray Tracing"]
    end

    DNS --> CDN
    CDN --> ALB
    Web --> CDN
    Mobile --> ALB
    ALB --> APIGW
    APIGW -->|"JWT Auth"| Auth
    APIGW -->|"REST/GraphQL"| Core
    Core --> Primary
    Core --> Cache
    Core -->|"Enqueue"| Queue
    Queue -->|"Process"| Worker
    Worker --> Primary
    Worker --> S3
    Auth --> Cache
    Core --> Logs
    Core --> Metrics
    APIGW --> Traces

    style Web fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style CDN fill:#ECEFF1,stroke:#546E7A,color:#37474F
    style DNS fill:#ECEFF1,stroke:#546E7A,color:#37474F
    style ALB fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style APIGW fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Auth fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Core fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Worker fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Primary fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C
    style Queue fill:#FFF8E1,stroke:#F9A825,color:#F57F17
    style S3 fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Logs fill:#E0F7FA,stroke:#00838F,color:#006064
    style Metrics fill:#E0F7FA,stroke:#00838F,color:#006064
    style Traces fill:#E0F7FA,stroke:#00838F,color:#006064`;
  } else {
    // STANDARD detail level
    mermaidDiagram = `flowchart TB
    subgraph Clients["👥 Client Layer"]
        Web["🌐 Web App<br/>Next.js"]
        Mobile["📱 Mobile<br/>React Native"]
    end

    subgraph Gateway["🚪 API Gateway"]
        LB["⚖️ Load Balancer"]
        API["🔌 API Server<br/>Express"]
    end

    subgraph Services["⚙️ Services"]
        Auth["🔐 Auth<br/>JWT + OAuth"]
        Core["📦 Core<br/>Business Logic"]
    end

    subgraph Data["💾 Data Layer"]
        DB["🗃️ PostgreSQL<br/>Primary DB"]
        Cache["⚡ Redis<br/>Cache"]
    end

    Web --> LB
    Mobile --> LB
    LB --> API
    API --> Auth
    API --> Core
    Auth --> Cache
    Core --> DB
    Core --> Cache

    style Web fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style Mobile fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style LB fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style API fill:#E3F2FD,stroke:#1565C0,color:#0D47A1
    style Auth fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style Core fill:#FFF3E0,stroke:#EF6C00,color:#E65100
    style DB fill:#F3E5F5,stroke:#7B1FA2,color:#4A148C
    style Cache fill:#FFEBEE,stroke:#C62828,color:#B71C1C`;
  }

  return { design, mermaidDiagram };
}
