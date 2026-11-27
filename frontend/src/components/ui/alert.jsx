import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative flex w-full gap-3 rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      default: 'bg-card',
      info: 'border-primary/30 bg-primary/5',
      warning: 'border-warning/30 bg-warning/5 text-foreground',
      destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Alert({ className, variant, ...props }) {
  return <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }) {
  return <p data-slot="alert-title" className={cn('font-semibold leading-tight', className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
  return <div data-slot="alert-description" className={cn('mt-1 text-[13px] leading-relaxed opacity-90', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
