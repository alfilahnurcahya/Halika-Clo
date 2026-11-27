import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-rose-dark hover:-translate-y-px',
        brown: 'bg-brown text-ivory hover:bg-brown-soft',
        outline: 'border border-input bg-transparent hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'hover:bg-accent',
        link: 'text-foreground underline-offset-4 decoration-primary underline hover:text-primary',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        shopee: 'bg-[#ee4d2d] text-white hover:brightness-95',
        whatsapp: 'bg-[#2d8c57] text-white hover:brightness-95',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'size-10',
        iconSm: 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
