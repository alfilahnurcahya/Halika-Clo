import { Button } from '@/components/ui/button';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

/** Tampilan saat data kosong / pencarian tidak ditemukan. */
export function EmptyState({ icon = 'search', title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed bg-secondary/40 px-6 py-14 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-white text-primary shadow-sm">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="font-display text-xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Tampilan saat data gagal dimuat (server mati, koneksi putus, dll.). */
export function ErrorState({ message, onRetry, className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-12 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-white text-destructive shadow-sm">
        <Icon name="wifiOff" size={22} />
      </span>
      <h3 className="font-display text-xl">Data gagal dimuat</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Coba lagi
        </Button>
      )}
    </div>
  );
}

export function Spinner({ className, size = 18 }) {
  return (
    <svg className={cn('animate-spin', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Memuat...' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
      <Spinner /> {label}
    </div>
  );
}
