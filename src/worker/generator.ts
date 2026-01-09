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
}

export interface Component {
  name: string;
  type: string;
  description: string;
  technologies: string[];
}

export interface DataStore {
  name: string;
  type: string;
  description: string;
  technology: string;
}

export interface Api {
  name: string;
  type: string;
  description: string;
  endpoints?: string[];
}

export interface SecurityItem {
  category: string;
  measures: string[];
}

export interface ScaleChange {
  category: string;
  description: string;
}

export interface RoadmapPhase {
  phase: string;
  items: string[];
  timeframe: string;
}

export interface DesignOutput {
  components: Component[];
  dataStores: DataStore[];
  apis: Api[];
  security: SecurityItem[];
  scaleChanges: ScaleChange[];
  roadmap: RoadmapPhase[];
}

export interface GeneratedDesign {
  design: DesignOutput;
  mermaidDiagram: string;
}

const SYSTEM_PROMPT = `You are an expert software architect. Your task is to design comprehensive system architectures based on user requirements.

You must respond with a valid JSON object containing exactly this structure:
{
  "design": {
    "components": [
      {
        "name": "string - component name",
        "type": "string - Frontend/Backend/Service/Infrastructure",
        "description": "string - what this component does",
        "technologies": ["array of technology names used"]
      }
    ],
    "dataStores": [
      {
        "name": "string - data store name",
        "type": "string - Relational/NoSQL/In-Memory/Object Storage/Search/Stream",
        "description": "string - purpose of this data store",
        "technology": "string - specific technology (PostgreSQL, Redis, etc.)"
      }
    ],
    "apis": [
      {
        "name": "string - API name",
        "type": "string - HTTP/GraphQL/WebSocket/gRPC",
        "description": "string - what this API handles",
        "endpoints": ["array of example endpoints like GET /api/users"]
      }
    ],
    "security": [
      {
        "category": "string - security category name",
        "measures": ["array of specific security measures"]
      }
    ],
    "scaleChanges": [
      {
        "category": "string - infrastructure area",
        "description": "string - what changes for this scale profile"
      }
    ],
    "roadmap": [
      {
        "phase": "string - phase name like 'Phase 1: Foundation'",
        "items": ["array of tasks for this phase"],
        "timeframe": "string - estimated time like '2-4 weeks'"
      }
    ]
  },
  "mermaidDiagram": "string - valid Mermaid flowchart diagram code"
}

Guidelines:
1. Create practical, production-ready architectures
2. Consider the scale profile when designing (PROTOTYPE = simple, DAU_1K = moderate, DAU_1M = high scale)
3. Respect technology constraints (mustUse and avoid lists)
4. Use the preferred programming language when specified
5. The Mermaid diagram should be a flowchart TB (top to bottom) showing main components and data flow
6. Include 3-6 components, 2-4 data stores, 2-3 APIs, 3-4 security categories, 3-5 scale considerations, and 3 roadmap phases
7. Make the architecture coherent - components should logically connect to data stores and APIs
8. For the Mermaid diagram, use subgraphs to group related components and use emoji icons for visual clarity`;

function formatUserPrompt(input: DesignInput): string {
  const scaleDescriptions = {
    PROTOTYPE: "a prototype/MVP with minimal infrastructure, no scaling concerns",
    DAU_1K: "a production system handling ~1,000 daily active users with basic redundancy",
    DAU_1M: "a large-scale production system handling ~1,000,000 daily active users with high availability and horizontal scaling",
  };

  let prompt = `Design a software architecture for the following:\n\n`;

  if (input.inputType === "PROMPT" && input.promptText) {
    prompt += `**Product Description:**\n${input.promptText}\n\n`;
  } else if (input.inputType === "REPO_URL" && input.repoUrl) {
    prompt += `**GitHub Repository:** ${input.repoUrl}\nAnalyze this as a codebase that needs architecture improvements.\n\n`;
  }

  prompt += `**Scale Profile:** ${input.scaleProfile} - Design for ${scaleDescriptions[input.scaleProfile]}\n\n`;

  if (input.constraints.mustUse && input.constraints.mustUse.length > 0) {
    prompt += `**Must Use Technologies:** ${input.constraints.mustUse.join(", ")}\n`;
  }

  if (input.constraints.avoid && input.constraints.avoid.length > 0) {
    prompt += `**Avoid Technologies:** ${input.constraints.avoid.join(", ")}\n`;
  }

  if (input.constraints.preferredLanguage) {
    prompt += `**Preferred Programming Language:** ${input.constraints.preferredLanguage}\n`;
  }

  prompt += `\nProvide a complete architecture design with components, data stores, APIs, security measures, scale-specific recommendations, implementation roadmap, and a Mermaid diagram.`;

  return prompt;
}

/**
 * Generate an architecture design using OpenAI GPT-4
 */
export async function generateDesign(input: DesignInput): Promise<GeneratedDesign> {
  console.log("[Generator] Starting OpenAI design generation...");

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
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    console.log("[Generator] Received response, parsing JSON...");
    const parsed = JSON.parse(content);

    // Validate the response structure
    if (!parsed.design || !parsed.mermaidDiagram) {
      throw new Error("Invalid response structure from OpenAI");
    }

    // Validate design has required fields
    const design = parsed.design as DesignOutput;
    if (
      !Array.isArray(design.components) ||
      !Array.isArray(design.dataStores) ||
      !Array.isArray(design.apis) ||
      !Array.isArray(design.security) ||
      !Array.isArray(design.scaleChanges) ||
      !Array.isArray(design.roadmap)
    ) {
      throw new Error("Design missing required arrays");
    }

    console.log("[Generator] Successfully generated design with", {
      components: design.components.length,
      dataStores: design.dataStores.length,
      apis: design.apis.length,
      securityCategories: design.security.length,
      roadmapPhases: design.roadmap.length,
    });

    return {
      design,
      mermaidDiagram: parsed.mermaidDiagram,
    };
  } catch (error) {
    console.error("[Generator] OpenAI generation failed:", error);

    // Fall back to mock generation if OpenAI fails
    console.log("[Generator] Falling back to mock generation...");
    return generateMockDesign(input);
  }
}

/**
 * Fallback mock generator in case OpenAI fails
 */
async function generateMockDesign(input: DesignInput): Promise<GeneratedDesign> {
  const language = input.constraints.preferredLanguage || "TypeScript";
  const mustUse = input.constraints.mustUse || [];
  const isLargeScale = input.scaleProfile === "DAU_1M";
  const isMediumScale = input.scaleProfile === "DAU_1K";

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
      },
      {
        name: "API Gateway",
        type: "Backend",
        description: "RESTful API layer handling authentication and routing",
        technologies: [
          mustUse.includes("Express") ? "Express.js" : "Fastify",
          language,
          "JWT Authentication",
        ],
      },
      {
        name: "Core Service",
        type: "Backend",
        description: "Business logic implementation with domain patterns",
        technologies: [language, "Domain Events"],
      },
    ],
    dataStores: [
      {
        name: "Primary Database",
        type: "Relational",
        description: "Main data store for structured business data",
        technology: mustUse.find((t) => ["PostgreSQL", "MySQL"].includes(t)) || "PostgreSQL",
      },
      {
        name: "Cache Layer",
        type: "In-Memory",
        description: "High-performance caching for sessions and hot data",
        technology: "Redis",
      },
    ],
    apis: [
      {
        name: "REST API",
        type: "HTTP",
        description: "Primary API for client-server communication",
        endpoints: ["POST /api/auth/login", "GET /api/resources", "POST /api/resources"],
      },
    ],
    security: [
      {
        category: "Authentication",
        measures: ["JWT-based auth with refresh tokens", "OAuth 2.0 support", "Rate limiting"],
      },
      {
        category: "Data Protection",
        measures: ["TLS 1.3 encryption", "Password hashing with bcrypt", "Input validation"],
      },
    ],
    scaleChanges: [
      {
        category: "Infrastructure",
        description: isLargeScale
          ? "Multi-region deployment with Kubernetes orchestration"
          : isMediumScale
          ? "Multi-instance with load balancing"
          : "Single server deployment",
      },
      {
        category: "Database",
        description: isLargeScale
          ? "Horizontal sharding with read replicas"
          : isMediumScale
          ? "Primary-replica setup"
          : "Single instance",
      },
    ],
    roadmap: [
      {
        phase: "Phase 1: Foundation",
        items: ["Setup development environment", "Implement core database schema", "Build authentication"],
        timeframe: input.scaleProfile === "PROTOTYPE" ? "1-2 weeks" : "2-4 weeks",
      },
      {
        phase: "Phase 2: Features",
        items: ["Implement business logic", "Build frontend", "Add real-time features"],
        timeframe: input.scaleProfile === "PROTOTYPE" ? "2-3 weeks" : "4-6 weeks",
      },
      {
        phase: "Phase 3: Launch",
        items: ["Performance optimization", "Security hardening", "Monitoring setup"],
        timeframe: "1-2 weeks",
      },
    ],
  };

  const mermaidDiagram = `flowchart TB
    subgraph Client["Client Layer"]
        Browser["🌐 Web Browser"]
    end

    subgraph Gateway["API Gateway"]
        LB["⚖️ Load Balancer"]
        API["🔌 API Server"]
    end

    subgraph Services["Services"]
        Auth["🔐 Auth"]
        Core["⚙️ Core"]
    end

    subgraph Data["Data Layer"]
        DB[("🗃️ PostgreSQL")]
        Cache[("⚡ Redis")]
    end

    Browser --> LB
    LB --> API
    API --> Auth
    API --> Core
    Auth --> DB
    Auth --> Cache
    Core --> DB
    Core --> Cache`;

  return { design, mermaidDiagram };
}
