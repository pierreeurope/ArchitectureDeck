import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";

interface DesignData {
  components: Array<{
    name: string;
    type: string;
    description: string;
    technologies: string[];
  }>;
  dataStores: Array<{
    name: string;
    type: string;
    description: string;
    technology: string;
  }>;
  apis: Array<{
    name: string;
    type: string;
    description: string;
    endpoints?: string[];
  }>;
  security: Array<{
    category: string;
    measures: string[];
  }>;
  scaleChanges: Array<{
    category: string;
    description: string;
  }>;
  roadmap: Array<{
    phase: string;
    items: string[];
    timeframe: string;
  }>;
}

interface DesignViewerProps {
  designData: DesignData;
  mermaidSource?: string;
  svgContent?: string;
}

type TabId = "diagram" | "components" | "datastores" | "apis" | "security" | "scale" | "roadmap";

export function DesignViewer({ designData, mermaidSource, svgContent }: DesignViewerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("diagram");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "diagram", label: "Diagram", icon: <DiagramIcon /> },
    { id: "components", label: "Components", icon: <ComponentsIcon /> },
    { id: "datastores", label: "Data Stores", icon: <DatabaseIcon /> },
    { id: "apis", label: "APIs", icon: <ApiIcon /> },
    { id: "security", label: "Security", icon: <SecurityIcon /> },
    { id: "scale", label: "Scale", icon: <ScaleIcon /> },
    { id: "roadmap", label: "Roadmap", icon: <RoadmapIcon /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-ink-light rounded-xl border border-void-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-gradient-to-r from-neon-cyan/20 to-emerald-500/20 text-neon-cyan border border-neon-cyan/30"
                : "text-void-400 hover:text-void-200 hover:bg-void-800/50"
            )}
          >
            <span className="w-4 h-4">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {activeTab === "diagram" && (
          <DiagramTab mermaidSource={mermaidSource} svgContent={svgContent} />
        )}
        {activeTab === "components" && (
          <ComponentsTab components={designData.components} />
        )}
        {activeTab === "datastores" && (
          <DataStoresTab dataStores={designData.dataStores} />
        )}
        {activeTab === "apis" && (
          <ApisTab apis={designData.apis} />
        )}
        {activeTab === "security" && (
          <SecurityTab security={designData.security} />
        )}
        {activeTab === "scale" && (
          <ScaleTab scaleChanges={designData.scaleChanges} />
        )}
        {activeTab === "roadmap" && (
          <RoadmapTab roadmap={designData.roadmap} />
        )}
      </div>
    </div>
  );
}

function DiagramTab({ mermaidSource, svgContent }: { mermaidSource?: string; svgContent?: string }) {
  if (!mermaidSource && !svgContent) {
    return (
      <div className="flex items-center justify-center py-12 text-void-400">
        <p>No diagram available</p>
      </div>
    );
  }

  return (
    <div className="diagram-container">
      <MermaidDiagram source={mermaidSource || ""} svgContent={svgContent} />
    </div>
  );
}

function ComponentsTab({ components }: { components: DesignData["components"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {components.map((component, idx) => (
        <div key={idx} className="p-4 bg-ink border border-void-800 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-void-100">{component.name}</h4>
            <span className="badge-info">{component.type}</span>
          </div>
          <p className="text-sm text-void-400 mb-3">{component.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {component.technologies.map((tech, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-void-800 text-void-300 rounded">
                {tech}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataStoresTab({ dataStores }: { dataStores: DesignData["dataStores"] }) {
  return (
    <div className="space-y-4">
      {dataStores.map((store, idx) => (
        <div key={idx} className="p-4 bg-ink border border-void-800 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-neon-magenta/20 border border-neon-magenta/30 flex items-center justify-center">
              <DatabaseIcon className="w-5 h-5 text-neon-magenta" />
            </div>
            <div>
              <h4 className="font-medium text-void-100">{store.name}</h4>
              <span className="text-xs text-void-400">{store.type} — {store.technology}</span>
            </div>
          </div>
          <p className="text-sm text-void-400 pl-13">{store.description}</p>
        </div>
      ))}
    </div>
  );
}

function ApisTab({ apis }: { apis: DesignData["apis"] }) {
  return (
    <div className="space-y-4">
      {apis.map((api, idx) => (
        <div key={idx} className="p-4 bg-ink border border-void-800 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-void-100">{api.name}</h4>
            <span className="badge-warning">{api.type}</span>
          </div>
          <p className="text-sm text-void-400 mb-3">{api.description}</p>
          {api.endpoints && api.endpoints.length > 0 && (
            <div className="space-y-1">
              {api.endpoints.map((endpoint, i) => (
                <code key={i} className="block text-xs bg-void-900 px-2 py-1 rounded text-neon-cyan font-mono">
                  {endpoint}
                </code>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SecurityTab({ security }: { security: DesignData["security"] }) {
  return (
    <div className="space-y-4">
      {security.map((item, idx) => (
        <div key={idx} className="p-4 bg-ink border border-void-800 rounded-lg">
          <h4 className="font-medium text-void-100 mb-3 flex items-center gap-2">
            <SecurityIcon className="w-4 h-4 text-emerald-400" />
            {item.category}
          </h4>
          <ul className="space-y-2">
            {item.measures.map((measure, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-void-300">
                <span className="text-emerald-400 mt-1">✓</span>
                {measure}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ScaleTab({ scaleChanges }: { scaleChanges: DesignData["scaleChanges"] }) {
  return (
    <div className="space-y-4">
      {scaleChanges.map((change, idx) => (
        <div key={idx} className="p-4 bg-ink border border-void-800 rounded-lg">
          <h4 className="font-medium text-void-100 mb-2">{change.category}</h4>
          <p className="text-sm text-void-400">{change.description}</p>
        </div>
      ))}
    </div>
  );
}

function RoadmapTab({ roadmap }: { roadmap: DesignData["roadmap"] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan via-emerald-400 to-neon-lime" />
      <div className="space-y-6">
        {roadmap.map((phase, idx) => (
          <div key={idx} className="relative pl-10">
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-neon-cyan shadow-lg shadow-neon-cyan/50" />
            <div className="p-4 bg-ink border border-void-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-void-100">{phase.phase}</h4>
                <span className="text-xs text-void-500 bg-void-800 px-2 py-1 rounded">
                  {phase.timeframe}
                </span>
              </div>
              <ul className="space-y-1.5">
                {phase.items.map((item, i) => (
                  <li key={i} className="text-sm text-void-400 flex items-start gap-2">
                    <span className="text-void-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icons
function DiagramIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function ComponentsIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
}

function ApiIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SecurityIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function RoadmapIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
