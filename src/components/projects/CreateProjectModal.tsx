import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/Toaster";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { success, error } = useToast();

  const utils = trpc.useUtils();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      success("Project created successfully!");
      setName("");
      setDescription("");
      onClose();
      onSuccess?.();
    },
    onError: (err) => {
      error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="My Architecture Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        
        <Textarea
          label="Description"
          placeholder="Brief description of this project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
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
            isLoading={createProject.isPending}
            className="flex-1"
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
