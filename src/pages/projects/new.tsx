import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/Toaster";

export default function NewProjectPage() {
  const router = useRouter();
  const { success, error } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      utils.projects.list.invalidate();
      success("Project created successfully!");
      router.push(`/projects/${project.id}`);
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
    <>
      <Head>
        <title>New Project — ArchitectureDeck</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-void-500 mb-8">
          <Link href="/projects" className="hover:text-void-300 transition-colors">
            Projects
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-void-300">New Project</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Create New Project</h1>
          <p className="text-void-400 mt-2">
            Projects help you organize related architecture designs together.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <Input
            label="Project Name"
            placeholder="My E-commerce Platform"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Description"
            placeholder="Brief description of what this project is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            hint="Optional but helpful for organizing your projects"
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
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
      </div>
    </>
  );
}
