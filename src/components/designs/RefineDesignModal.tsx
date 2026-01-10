import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Input";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

interface RefineDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  designRequestId: string;
  currentDetailLevel?: string;
  onSuccess?: () => void;
}

type DetailLevel = "OVERVIEW" | "STANDARD" | "DETAILED";

const refinementSuggestions = [
  { label: "Add more cloud services", prompt: "Add more specific AWS/GCP cloud services to the architecture" },
  { label: "Add monitoring", prompt: "Add monitoring, logging, and observability components" },
  { label: "Add security layer", prompt: "Add a security layer with WAF, authentication, and encryption" },
  { label: "Add CI/CD", prompt: "Add CI/CD pipeline and deployment components" },
  { label: "Add caching", prompt: "Add caching layers with Redis and CDN for performance" },
  { label: "Add message queue", prompt: "Add message queue for async processing (SQS, Kafka, or RabbitMQ)" },
  { label: "Make it serverless", prompt: "Convert to serverless architecture using Lambda/Cloud Functions" },
  { label: "Add microservices", prompt: "Split into microservices with API gateway" },
];

export function RefineDesignModal({
  isOpen,
  onClose,
  designRequestId,
  currentDetailLevel = "STANDARD",
  onSuccess,
}: RefineDesignModalProps) {
  const { success, error } = useToast();
  const [prompt, setPrompt] = useState("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(currentDetailLevel as DetailLevel);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const refineDesign = trpc.designs.refineDesign.useMutation({
    onSuccess: () => {
      success("Refinement started! Your design is being updated...");
      setPrompt("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedSuggestions.size === 0) {
      error("Please enter a refinement prompt or select at least one suggestion");
      return;
    }

    // Combine custom prompt with selected suggestions
    const allPrompts = [
      prompt.trim(),
      ...Array.from(selectedSuggestions),
    ].filter(Boolean);

    refineDesign.mutate({
      designRequestId,
      refinementPrompt: allPrompts.join(". "),
      detailLevel,
      suggestions: Array.from(selectedSuggestions),
    });
  };

  const handleSuggestionClick = (suggestion: { label: string; prompt: string }) => {
    const newSet = new Set(selectedSuggestions);
    if (newSet.has(suggestion.prompt)) {
      newSet.delete(suggestion.prompt);
    } else {
      newSet.add(suggestion.prompt);
    }
    setSelectedSuggestions(newSet);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Refine Your Design" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Refinement Prompt */}
        <div>
          <Textarea
            label="What would you like to change? (Optional)"
            placeholder="Describe the changes you want to make to your architecture..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        {/* Quick Suggestions */}
        <div>
          <label className="label mb-2">Quick suggestions</label>
          <p className="text-xs text-void-500 mb-3">
            Select one or more suggestions to enhance your architecture
          </p>
          <div className="flex flex-wrap gap-2">
            {refinementSuggestions.map((suggestion) => {
              const isSelected = selectedSuggestions.has(suggestion.prompt);
              return (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
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

        {/* Detail Level */}
        <div>
          <label className="label mb-2">Detail Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(["OVERVIEW", "STANDARD", "DETAILED"] as DetailLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDetailLevel(level)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  detailLevel === level
                    ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                    : "bg-ink border-void-700 text-void-400 hover:border-void-600"
                )}
              >
                {level === "OVERVIEW" ? "🔭 Overview" : level === "STANDARD" ? "📊 Standard" : "🔬 Detailed"}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-void-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={refineDesign.isPending}
            className="flex-1"
          >
            Refine Design
          </Button>
        </div>
      </form>
    </Modal>
  );
}
