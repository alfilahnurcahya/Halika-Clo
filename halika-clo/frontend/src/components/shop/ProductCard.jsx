import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><rect width="3" height="4" fill="#efe4da"/></svg>');

export function StockBadge({ totalStock }) {
  if (totalStock === 0) return <span className="absolute left-3 top-3 bg-brown px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ivory">Stok habis</span>;
  if (totalStock <= 5) return <span className="absolute left-3 top-3 bg-ivory px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-dark">Sisa {totalStock}</span>;
  return null;
}

export function ProductCard({ product }) {
  const colors = [...new Set(product.variants.map((v) => v.color))];
  return (
    <article className="group">
      <Link to={`/produk/${product.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        <div className="relative aspect-[3/4] overflow-hidden bg-accent">
          <img
            src={product.imageUrl || FALLBACK_IMAGE}
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            className="photo h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <StockBadge totalStock={product.totalStock} />
          <span className="absolute inset-x-3 bottom-3 hidden translate-y-2 bg-ivory py-3 text-center text-xs font-semibold opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 md:block">
            Lihat detail
          </span>
        </div>
        <p className="eyebrow mt-3 mb-1.5 text-[#9b7668]">{product.category}</p>
        <h3 className="font-display text-base leading-snug sm:text-lg">{product.name}</h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{formatRupiah(product.price)}</p>
          <p className="truncate text-[11px] text-muted-foreground">{colors.length} warna</p>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <Skeleton className="mt-3 h-2.5 w-16" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-24" />
    </div>
  );
}
