/**
 * Mermaid Diagram Renderer
 * 
 * Server-side rendering of Mermaid diagrams to SVG.
 * Falls back to storing source for client-side rendering if needed.
 */

import { JSDOM } from "jsdom";

// Note: For true server-side rendering, you'd need puppeteer or playwright
// This implementation stores the source and relies on client-side rendering
// for the MVP, but is structured to easily add server-side rendering later.

export interface RenderResult {
  mermaidSource: string;
  svgContent: string | null;
  error?: string;
}

/**
 * Attempt to render Mermaid diagram to SVG
 * 
 * For production, consider using:
 * - mermaid-cli (mmdc) via child_process
 * - Puppeteer/Playwright for headless browser rendering
 * - A dedicated mermaid rendering microservice
 */
export async function renderMermaidToSvg(source: string): Promise<RenderResult> {
  try {
    // For MVP, we'll store the source and let the client render
    // Server-side rendering would require a headless browser

    // Validate the mermaid source has basic structure
    if (!source.trim()) {
      return {
        mermaidSource: source,
        svgContent: null,
        error: "Empty diagram source",
      };
    }

    // Check for common diagram types
    const validTypes = [
      "flowchart",
      "graph",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram",
      "erDiagram",
      "journey",
      "gantt",
      "pie",
      "mindmap",
    ];

    const firstLine = source.trim().split("\n")[0].toLowerCase();
    const hasValidType = validTypes.some(
      (type) => firstLine.includes(type.toLowerCase())
    );

    if (!hasValidType) {
      return {
        mermaidSource: source,
        svgContent: null,
        error: "Invalid diagram type. Must start with a valid Mermaid diagram declaration.",
      };
    }

    // In a production setup, you would render here using one of:
    // Option 1: mermaid-cli
    // const { execSync } = require('child_process');
    // const svg = execSync(`echo '${source}' | mmdc -i -`);

    // Option 2: Puppeteer
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(`<div class="mermaid">${source}</div>`);
    // const svg = await page.$eval('.mermaid svg', el => el.outerHTML);

    // For MVP, return source only (client will render)
    return {
      mermaidSource: source,
      svgContent: null, // Client-side rendering fallback
    };
  } catch (error) {
    console.error("Mermaid rendering error:", error);
    return {
      mermaidSource: source,
      svgContent: null,
      error: error instanceof Error ? error.message : "Unknown rendering error",
    };
  }
}

/**
 * Generate a simple placeholder SVG for when rendering fails
 */
export function generatePlaceholderSvg(message: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
    <rect width="100%" height="100%" fill="#161b22"/>
    <text x="50%" y="50%" text-anchor="middle" fill="#627d98" font-family="system-ui" font-size="14">
      ${message}
    </text>
  </svg>`;
}
