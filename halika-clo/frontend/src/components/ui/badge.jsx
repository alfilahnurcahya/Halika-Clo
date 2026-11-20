import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-rose-dark',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-input text-foreground',
        success: 'bg-success/12 text-success',
        warning: 'bg-warning/12 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        brown: 'bg-brown text-ivory',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant, ...props }) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
