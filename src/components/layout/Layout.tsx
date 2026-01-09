import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/Toaster";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const navItems = [
    { href: "/", label: "Dashboard", icon: DashboardIcon },
    { href: "/projects", label: "Projects", icon: ProjectsIcon },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-void-800 bg-ink/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-emerald-500 flex items-center justify-center shadow-lg shadow-neon-cyan/20 group-hover:shadow-neon-cyan/30 transition-shadow">
                  <svg className="w-5 h-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="font-display font-bold text-xl text-void-100 tracking-tight">
                  Architecture<span className="text-gradient">Deck</span>
                </span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = router.pathname === item.href || 
                    (item.href !== "/" && router.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        isActive
                          ? "bg-void-800 text-neon-cyan"
                          : "text-void-400 hover:text-void-100 hover:bg-void-800/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* User menu (placeholder) */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-magenta to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  D
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-void-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-void-500">
              ArchitectureDeck — AI-powered architecture design
            </p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}
