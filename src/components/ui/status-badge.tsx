import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
};

export const StatusBadge = ({ status, variant = 'default', className }: StatusBadgeProps) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
      variantStyles[variant],
      className
    )}>
      {status}
    </span>
  );
};

// Helper function to determine variant based on status
export const getStatusVariant = (status: string): StatusVariant => {
  const statusLower = status.toLowerCase();
  
  if (['active', 'paid', 'delivered', 'accepted', 'in-stock', 'converted'].includes(statusLower)) {
    return 'success';
  }
  if (['pending', 'draft', 'low-stock', 'shipped'].includes(statusLower)) {
    return 'warning';
  }
  if (['inactive', 'cancelled', 'rejected', 'returned', 'out-of-stock'].includes(statusLower)) {
    return 'danger';
  }
  if (['sent'].includes(statusLower)) {
    return 'info';
  }
  return 'default';
};
