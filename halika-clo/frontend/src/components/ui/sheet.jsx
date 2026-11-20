import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Icon } from '@/lib/icons';

/** Panel samping (drawer) — dipakai untuk menu & filter di ponsel. */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const sides = {
  left: 'inset-y-0 left-0 h-full w-[85%] max-w-sm border-r',
  right: 'inset-y-0 right-0 h-full w-[85%] max-w-sm border-l',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl border-t',
};

function SheetContent({ side = 'right', className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brown/40" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn('fixed z-50 flex flex-col gap-4 overflow-y-auto bg-background p-5 shadow-2xl animate-chat-in', sides[side], className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 opacity-70 hover:opacity-100">
          <Icon name="close" size={18} />
          <span className="sr-only">Tutup</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 pr-8', className)} {...props} />;
}

function SheetTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('font-display text-xl font-medium', className)} {...props} />;
}

function SheetDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
