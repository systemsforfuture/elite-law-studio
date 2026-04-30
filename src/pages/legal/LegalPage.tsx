import { Link } from "react-router-dom";
import { ArrowLeft, Cpu } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ReactNode, useEffect } from "react";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}

const LegalPage = ({ title, subtitle, lastUpdated, children }: LegalPageProps) => {
  useDocumentTitle(`${title} · SYSTEMS™`);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 max-w-5xl">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              <Cpu className="h-4 w-4 text-accent" />
            </div>
            <span className="font-display font-bold text-foreground truncate">
              SYSTEMS<sup className="text-accent">™</sup>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zurück zur Startseite</span>
            <span className="sm:hidden">Zurück</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-navy-dark text-primary-foreground overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/[0.08] rounded-full blur-[150px]" />
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 max-w-5xl relative">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Rechtliches
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black tracking-[-0.03em] leading-[1.05] mb-4 break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg text-primary-foreground/60 font-light max-w-3xl">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-6 text-xs text-primary-foreground/40 uppercase tracking-wider">
              Stand: {lastUpdated}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-3xl">
        <article
          className="
            prose prose-sm sm:prose-base max-w-none
            prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground
            prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:font-bold
            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
            prose-p:text-foreground/75 prose-p:leading-relaxed
            prose-li:text-foreground/75 prose-li:my-1
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-hr:border-border/50 prose-hr:my-10
          "
        >
          {children}
        </article>

        {/* Cross-links */}
        <nav
          aria-label="Weitere Rechtsseiten"
          className="mt-16 pt-8 border-t border-border/50 flex flex-wrap gap-3"
        >
          {[
            { to: "/datenschutz", label: "Datenschutz" },
            { to: "/impressum", label: "Impressum" },
            { to: "/agb", label: "AGB" },
            { to: "/avv", label: "AVV" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 rounded-xl text-sm border border-border/50 bg-card hover:border-accent/40 hover:bg-accent/[0.04] transition-colors text-foreground/70 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </main>

      {/* Slim footer */}
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} SYSTEMS LLC ·{" "}
        <a href="mailto:systems.future@pm.me" className="hover:text-foreground transition-colors">
          systems.future@pm.me
        </a>
      </footer>
    </div>
  );
};

export default LegalPage;
