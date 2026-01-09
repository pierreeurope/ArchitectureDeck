import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: Date;
    _count: {
      designRequests: number;
    };
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <article className="card-hover p-6 group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-emerald-500/20 border border-neon-cyan/30 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-neon-cyan/10 transition-shadow">
            <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="badge-neutral">
            {project._count.designRequests} design{project._count.designRequests !== 1 ? 's' : ''}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-void-100 mb-2 group-hover:text-neon-cyan transition-colors">
          {project.name}
        </h3>

        {project.description && (
          <p className="text-sm text-void-400 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-void-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatRelativeTime(project.createdAt)}</span>
        </div>
      </article>
    </Link>
  );
}
