import { type ComponentType, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  hint?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  hint,
}: Props) => (
  <div className="glass-card border-border/50 p-12 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
        <Icon className="h-7 w-7 text-accent" />
      </div>
    )}
    <h3 className="text-lg font-display font-bold text-foreground mb-2">
      {title}
    </h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
      {description}
    </p>
    {action && <div className="flex justify-center">{action}</div>}
    {hint && (
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-5">
        {hint}
      </p>
    )}
  </div>
);

export default EmptyState;
