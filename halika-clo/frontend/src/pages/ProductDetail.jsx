import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback';
import { openChat } from '@/components/chat/ChatWidget';
import { Icon } from '@/lib/icons';
import { getErrorMessage, productApi } from '@/lib/api';
import { SIZE_ORDER, cn, formatRupiah, orderLinks } from '@/lib/utils';

function DetailSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_.9fr]">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-4 py-6">
        <Skeleton className="h-3 w-24" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await productApi.detail(slug);
      setProduct(data);
      const firstReady = data.variants.find((v) => v.stock > 0) || data.variants[0];
      setColor(firstReady?.color || '');
      setSize('');
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus(err.response?.status === 404 ? 'notfound' : 'error');
    }
  }, [slug]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);

  const colors = useMemo(() => [...new Set(product?.variants.map((v) => v.color) || [])], [product]);
  const sizesForColor = useMemo(
    () => (product?.variants.filter((v) => v.color === color) || []).sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    [product, color],
  );
  const selected = sizesForColor.find((v) => v.size === size);
  const colorStock = sizesForColor.reduce((s, v) => s + v.stock, 0);

  if (status === 'loading') return <div className="mx-auto max-w-[1300px] px-[6vw] py-12"><DetailSkeleton /></div>;
  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <EmptyState title="Produk tidak ditemukan" description="Produk mungkin sudah tidak dijual atau tautannya salah." action={<Button asChild><Link to="/koleksi">Kembali ke koleksi</Link></Button>} />
      </div>
    );
  }
  if (status === 'error') return <div className="mx-auto max-w-xl px-6 py-20"><ErrorState message={error} onRetry={load} /></div>;

  const links = orderLinks(product, { size: selected?.size, color });
  const stockText = selected
    ? (selected.stock > 0 ? `Stok ${selected.size} / ${color}: ${selected.stock} pcs` : `Ukuran ${selected.size} warna ${color} sedang habis`)
    : (colorStock > 0 ? `Pilih ukuran untuk melihat stok (${colorStock} pcs tersedia untuk warna ${color})` : `Warna ${color} sedang habis`);

  return (
    <div className="mx-auto max-w-[1300px] px-[6vw] pb-24 pt-8 md:pt-12">
      <p className="mb-8 text-xs text-[#9c8980]">
        <Link to="/" className="hover:text-primary">Beranda</Link> / <Link to={`/koleksi?category=${product.category}`} className="hover:text-primary">{product.category}</Link> / {product.name}
      </p>
      <section className="grid gap-8 md:grid-cols-[1.1fr_.9fr] md:gap-14">
        <div className="relative aspect-[3/4] overflow-hidden bg-accent md:sticky md:top-24 md:self-start">
          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="photo h-full w-full object-cover" />}
        </div>

        <div className="max-w-[480px]">
          <p className="eyebrow mb-3 text-[#9b7668]">{product.category} · {product.material}</p>
          <h1 className="font-display text-4xl leading-tight md:text-[46px]">{product.name}</h1>
          <p className="mt-5 text-2xl font-semibold">{formatRupiah(product.price)}</p>
          {product.description && <p className="mt-5 leading-relaxed text-[#75635a]">{product.description}</p>}

          <div className="mt-8">
            <p className="mb-3 flex justify-between text-sm font-semibold">Warna <span className="font-normal text-muted-foreground">{color}</span></p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const hasStock = product.variants.some((v) => v.color === c && v.stock > 0);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setSize(''); }}
                    aria-pressed={color === c}
                    className={cn(
                      'border px-3.5 py-2 text-xs transition-colors',
                      color === c ? 'border-brown bg-brown text-ivory' : 'border-input bg-white hover:border-brown',
                      !hasStock && 'text-muted-foreground line-through',
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">Ukuran</p>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock === 0}
                  onClick={() => setSize(v.size)}
                  aria-pressed={size === v.size}
                  className={cn(
                    'h-11 min-w-12 border px-3 text-sm transition-colors',
                    size === v.size ? 'border-brown bg-brown text-ivory' : 'border-input bg-white hover:border-brown',
                    'disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:line-through',
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
            <p className={cn('mt-3 flex items-center gap-1.5 text-sm', selected?.stock === 0 || colorStock === 0 ? 'text-destructive' : 'text-success')}>
              <Icon name={selected?.stock === 0 || colorStock === 0 ? 'alert' : 'check'} size={16} /> {stockText}
            </p>
          </div>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {links.shopee && (
              <Button asChild variant="shopee" size="lg">
                <a href={links.shopee} target="_blank" rel="noopener noreferrer"><Icon name="bag" /> Beli di Shopee <Icon name="external" size={15} /></a>
              </Button>
            )}
            {links.whatsapp && (
              <Button asChild variant="whatsapp" size="lg">
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="message" /> Pesan via WhatsApp</a>
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="lg"
            className="mt-2.5 w-full"
            onClick={() => openChat(`${product.name}${selected ? ` ukuran ${selected.size}` : ''} warna ${color} masih ada?`)}
          >
            <Icon name="sparkle" /> Tanya Halika tentang produk ini
          </Button>
          {(links.shopee || links.whatsapp) && (
            <p className="mt-3 text-center text-xs text-muted-foreground">Pemesanan & pembayaran dilakukan di platform tujuan.</p>
          )}

          <dl className="mt-8 divide-y border-y text-sm">
            <div className="flex justify-between py-3.5"><dt className="text-muted-foreground">Bahan</dt><dd>{product.material}</dd></div>
            <div className="flex justify-between py-3.5"><dt className="text-muted-foreground">Warna tersedia</dt><dd>{colors.join(', ')}</dd></div>
            <div className="flex justify-between py-3.5"><dt className="text-muted-foreground">Total stok</dt><dd>{product.totalStock} pcs</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
