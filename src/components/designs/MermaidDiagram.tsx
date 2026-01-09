import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  source: string;
  svgContent?: string;
  className?: string;
}

export function MermaidDiagram({ source, svgContent, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgString, setSvgString] = useState<string | null>(svgContent || null);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(!svgContent && !!source);

  useEffect(() => {
    // If we have pre-rendered SVG, use that
    if (svgContent) {
      setSvgString(svgContent);
      setIsLoading(false);
      return;
    }

    // Otherwise, render client-side
    if (!source) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#21262d",
            primaryTextColor: "#d9e2ec",
            primaryBorderColor: "#486581",
            lineColor: "#00f5d4",
            secondaryColor: "#161b22",
            tertiaryColor: "#0d1117",
            background: "#0d1117",
            mainBkg: "#21262d",
            nodeBorder: "#486581",
            clusterBkg: "#0d1117",
            clusterBorder: "#334e68",
            titleColor: "#d9e2ec",
            edgeLabelBackground: "#161b22",
          },
          flowchart: {
            curve: "basis",
            padding: 20,
          },
          securityLevel: "loose",
        });

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, source);

        if (isMounted) {
          setSvgString(svg);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [source, svgContent]);

  if (error) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <div className="inline-flex items-center gap-2 text-red-400 mb-4">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Diagram Error</span>
        </div>
        <p className="text-sm text-void-400 mb-4">{error}</p>
        <details className="text-left">
          <summary className="text-xs text-void-500 cursor-pointer hover:text-void-400">
            View Mermaid Source
          </summary>
          <pre className="mt-2 p-3 bg-ink text-xs text-void-400 rounded-lg overflow-x-auto whitespace-pre-wrap">
            {source}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Zoom Toggle */}
      {svgString && (
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-2 right-2 z-10 p-2 bg-void-800/80 hover:bg-void-700 rounded-lg transition-colors"
          title={isZoomed ? "Zoom out" : "Zoom in"}
        >
          {isZoomed ? (
            <svg className="w-4 h-4 text-void-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-void-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          )}
        </button>
      )}

      {/* Diagram Container */}
      <div
        ref={containerRef}
        className={cn(
          "transition-all duration-300 overflow-auto",
          isZoomed ? "scale-125 origin-top-left" : "",
          !svgString && !isLoading && "flex items-center justify-center min-h-[200px]"
        )}
      >
        {isLoading && (
          <div className="flex items-center justify-center min-h-[200px] gap-2 text-void-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Rendering diagram...</span>
          </div>
        )}

        {svgString && (
          <div 
            className="mermaid-svg-container"
            dangerouslySetInnerHTML={{ __html: svgString }} 
          />
        )}

        {!svgString && !isLoading && !error && (
          <div className="flex items-center justify-center min-h-[200px] text-void-500">
            No diagram available
          </div>
        )}
      </div>

      {/* Source Code Toggle */}
      {svgString && source && (
        <details className="mt-4 border-t border-void-800 pt-4">
          <summary className="text-xs text-void-500 cursor-pointer hover:text-void-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            View Mermaid Source
          </summary>
          <pre className="mt-2 p-3 bg-ink text-xs text-void-400 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
            {source}
          </pre>
        </details>
      )}
    </div>
  );
}
