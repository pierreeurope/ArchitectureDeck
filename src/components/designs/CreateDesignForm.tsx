import { useState } from "react";
import { useRouter } from "next/router";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

interface CreateDesignFormProps {
  projectId: string;
  onSuccess?: (designId: string, jobId: string) => void;
}

type InputType = "PROMPT" | "REPO_URL";
type ScaleProfile = "PROTOTYPE" | "DAU_1K" | "DAU_1M";
type DetailLevel = "OVERVIEW" | "STANDARD" | "DETAILED";

export function CreateDesignForm({ projectId, onSuccess }: CreateDesignFormProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState("");
  const [inputType, setInputType] = useState<InputType>("PROMPT");
  const [promptText, setPromptText] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [scaleProfile, setScaleProfile] = useState<ScaleProfile>("PROTOTYPE");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("STANDARD");
  const [mustUse, setMustUse] = useState("");
  const [avoid, setAvoid] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const createDesign = trpc.designs.createRequest.useMutation({
    onSuccess: (data) => {
      success("Design request created! Generation starting...");
      if (onSuccess) {
        onSuccess(data.designRequest.id, data.jobId);
      } else {
        router.push(`/projects/${projectId}/designs/${data.designRequest.id}`);
      }
    },
    onError: (err) => {
      error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const constraints = {
      mustUse: mustUse.split(",").map(s => s.trim()).filter(Boolean),
      avoid: avoid.split(",").map(s => s.trim()).filter(Boolean),
      preferredLanguage: preferredLanguage.trim() || undefined,
    };

    createDesign.mutate({
      projectId,
      title,
      inputType,
      promptText: inputType === "PROMPT" ? promptText : undefined,
      repoUrl: inputType === "REPO_URL" ? repoUrl : undefined,
      scaleProfile,
      detailLevel,
      constraints,
      suggestions: Array.from(selectedSuggestions),
    });
  };

  const scaleOptions = [
    { value: "PROTOTYPE", label: "Prototype — Quick PoC, no scale considerations" },
    { value: "DAU_1K", label: "1K DAU — Small production workload" },
    { value: "DAU_1M", label: "1M DAU — Large scale production" },
  ];

  const detailLevelInfo = {
    OVERVIEW: {
      title: "Overview",
      description: "High-level view with main component groups",
      icon: "🔭",
    },
    STANDARD: {
      title: "Standard",
      description: "Components with technologies and connections",
      icon: "📊",
    },
    DETAILED: {
      title: "Detailed",
      description: "Full detail with frameworks, protocols, cloud services",
      icon: "🔬",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Design Title"
        placeholder="E-commerce platform architecture"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      {/* Input Type Toggle */}
      <div>
        <label className="label">Input Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputType("PROMPT")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
              inputType === "PROMPT"
                ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                : "bg-ink border-void-700 text-void-400 hover:border-void-600"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Describe Your Product
            </div>
          </button>
          <button
            type="button"
            onClick={() => setInputType("REPO_URL")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
              inputType === "REPO_URL"
                ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                : "bg-ink border-void-700 text-void-400 hover:border-void-600"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              GitHub Repository
            </div>
          </button>
        </div>
      </div>

      {/* Input Field Based on Type */}
      {inputType === "PROMPT" ? (
        <Textarea
          label="Product Description"
          placeholder="Describe your product, its features, expected user behavior, and any specific requirements..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={5}
          required
          hint="Be as detailed as possible for better architecture suggestions"
        />
      ) : (
        <Input
          label="GitHub Repository URL"
          placeholder="https://github.com/username/repository"
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
          hint="We'll analyze the repository to suggest architecture improvements"
        />
      )}

      {/* Scale Profile */}
      <Select
        label="Scale Profile"
        value={scaleProfile}
        onChange={(e) => setScaleProfile(e.target.value as ScaleProfile)}
        options={scaleOptions}
      />

      {/* Detail Level Selector */}
      <div>
        <label className="label">Diagram Detail Level</label>
        <div className="grid grid-cols-3 gap-3">
          {(["OVERVIEW", "STANDARD", "DETAILED"] as DetailLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDetailLevel(level)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                detailLevel === level
                  ? "bg-neon-cyan/10 border-neon-cyan"
                  : "bg-ink border-void-700 hover:border-void-600"
              )}
            >
              <div className="text-2xl mb-2">{detailLevelInfo[level].icon}</div>
              <div className={cn(
                "font-medium text-sm",
                detailLevel === level ? "text-neon-cyan" : "text-void-200"
              )}>
                {detailLevelInfo[level].title}
              </div>
              <div className="text-xs text-void-500 mt-1">
                {detailLevelInfo[level].description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div>
        <label className="label mb-2">Quick Suggestions (Optional)</label>
        <p className="text-xs text-void-500 mb-3">
          Select one or more suggestions to enhance your architecture design
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Add more cloud services", prompt: "Add more specific AWS/GCP cloud services to the architecture" },
            { label: "Add monitoring", prompt: "Add monitoring, logging, and observability components" },
            { label: "Add security layer", prompt: "Add a security layer with WAF, authentication, and encryption" },
            { label: "Add CI/CD", prompt: "Add CI/CD pipeline and deployment components" },
            { label: "Add caching", prompt: "Add caching layers with Redis and CDN for performance" },
            { label: "Add message queue", prompt: "Add message queue for async processing (SQS, Kafka, or RabbitMQ)" },
            { label: "Make it serverless", prompt: "Convert to serverless architecture using Lambda/Cloud Functions" },
            { label: "Add microservices", prompt: "Split into microservices with API gateway" },
          ].map((suggestion) => {
            const isSelected = selectedSuggestions.has(suggestion.prompt);
            return (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => {
                  const newSet = new Set(selectedSuggestions);
                  if (isSelected) {
                    newSet.delete(suggestion.prompt);
                  } else {
                    newSet.add(suggestion.prompt);
                  }
                  setSelectedSuggestions(newSet);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isSelected
                    ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan"
                    : "bg-void-800 text-void-400 border border-void-700 hover:border-void-600 hover:text-void-300"
                )}
              >
                {suggestion.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Constraints Section */}
      <div className="border border-void-800 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-void-200">Constraints (Optional)</h3>
        
        <Input
          label="Must Use"
          placeholder="PostgreSQL, Redis, AWS Lambda"
          value={mustUse}
          onChange={(e) => setMustUse(e.target.value)}
          hint="Comma-separated list of technologies to include"
        />

        <Input
          label="Avoid"
          placeholder="MongoDB, Firebase"
          value={avoid}
          onChange={(e) => setAvoid(e.target.value)}
          hint="Comma-separated list of technologies to avoid"
        />

        <Input
          label="Preferred Language"
          placeholder="TypeScript"
          value={preferredLanguage}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          hint="Primary programming language for the architecture"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={createDesign.isPending}
        className="w-full"
      >
        Generate Architecture Design
      </Button>
    </form>
  );
}
