import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProductCard, ProductCardSkeleton } from '@/components/shop/ProductCard';
import { EmptyState, ErrorState } from '@/components/feedback';
import { openChat } from '@/components/chat/ChatWidget';
import { Icon } from '@/lib/icons';
import { getErrorMessage, productApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const SORTS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga terendah' },
  { value: 'price_desc', label: 'Harga tertinggi' },
  { value: 'name', label: 'Nama A–Z' },
];

function OptionChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          aria-pressed={value === opt}
          className={cn(
            'min-w-11 border px-3 py-2 text-xs transition-colors',
            value === opt ? 'border-brown bg-brown text-ivory' : 'border-input bg-white hover:border-brown',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Filters({ filters, params, setParam, reset }) {
  return (
    <div className="space-y-1">
      <div className="border-b py-5">
        <p className="mb-3 text-sm font-semibold">Kategori</p>
        <div className="flex flex-col gap-2.5">
          {filters.categories.map((c) => (
            <label key={c.name} className="flex items-center gap-2.5 text-sm text-[#78665d]">
              <Checkbox
                checked={params.category === c.name}
                onCheckedChange={(checked) => setParam('category', checked ? c.name : '')}
              />
              {c.name} <span className="ml-auto text-xs">{c.count}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="border-b py-5">
        <p className="mb-3 text-sm font-semibold">Ukuran</p>
        <OptionChips options={filters.sizes} value={params.size} onChange={(v) => setParam('size', v)} />
      </div>
      <div className="border-b py-5">
        <p className="mb-3 text-sm font-semibold">Warna</p>
        <OptionChips options={filters.colors} value={params.color} onChange={(v) => setParam('color', v)} />
      </div>
      <div className="flex items-center gap-2.5 py-5">
        <Checkbox id="inStock" checked={params.inStock} onCheckedChange={(c) => setParam('inStock', c ? 'true' : '')} />
        <Label htmlFor="inStock" className="text-sm font-normal">Hanya yang ready stok</Label>
      </div>
      <Button variant="outline" className="w-full" onClick={reset}>Reset filter</Button>
    </div>
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    inStock: searchParams.get('inStock') === 'true',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  };

  const [searchInput, setSearchInput] = useState(params.search);
  const [filters, setFilters] = useState({ categories: [], sizes: [], colors: [] });
  const [result, setResult] = useState({ data: [], meta: null });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef(null);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    next.delete('focus');
    setSearchParams(next);
  };

  const reset = () => { setSearchInput(''); setSearchParams({}); setFilterOpen(false); };

  useEffect(() => {
    if (searchParams.get('focus') === 'search') searchRef.current?.focus();
  }, [searchParams]);

  useEffect(() => { setSearchInput(params.search); }, [params.search]);

  // Debounce pencarian 400 ms
  useEffect(() => {
    if (searchInput === params.search) return undefined;
    const t = setTimeout(() => setParam('search', searchInput.trim()), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    productApi.filters().then(setFilters).catch(() => {});
  }, []);

  const queryKey = searchParams.toString();
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    const query = { ...params, inStock: params.inStock || undefined, limit: 12 };
    Object.keys(query).forEach((k) => (query[k] === '' || query[k] === undefined) && delete query[k]);
    productApi
      .list(query, { signal: controller.signal })
      .then((res) => { setResult(res); setStatus('success'); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
        setStatus('error');
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, reloadKey]);

  const activeCount = [params.category, params.size, params.color, params.inStock].filter(Boolean).length;
  const meta = result.meta;

  return (
    <div className="mx-auto max-w-[1440px] px-[6vw] pb-24 pt-10 md:pt-14">
      <p className="mb-8 text-xs text-[#9c8980]">Beranda / Koleksi{params.category && ` / ${params.category}`}</p>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-3">Koleksi Halika</p>
          <h1 className="font-display text-4xl md:text-5xl">{params.category || 'Semua Produk'}</h1>
        </div>
        {meta && status === 'success' && <p className="eyebrow">{meta.total} produk</p>}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.slice(0, 100))}
            placeholder="Cari nama produk, bahan, atau kategori..."
            className="h-11 pl-10"
            aria-label="Cari produk"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 flex-1 md:hidden" onClick={() => setFilterOpen(true)}>
            <Icon name="filter" size={16} /> Filter {activeCount > 0 && `(${activeCount})`}
          </Button>
          <Select value={params.sort} onValueChange={(v) => setParam('sort', v === 'newest' ? '' : v)}>
            <SelectTrigger className="h-11 flex-1 sm:w-48" aria-label="Urutkan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block" aria-label="Filter produk">
          <h2 className="border-b pb-4 text-base font-semibold">Filter</h2>
          <Filters filters={filters} params={params} setParam={setParam} reset={reset} />
        </aside>

        <section aria-live="polite">
          {status === 'error' && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

          {status === 'loading' && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-3 lg:gap-x-5">
              {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}

          {status === 'success' && result.data.length === 0 && (
            <EmptyState
              title="Produk tidak ditemukan"
              description={params.search ? `Tidak ada produk yang cocok dengan "${params.search}". Coba kata lain atau reset filter.` : 'Tidak ada produk dengan filter ini. Coba ubah atau reset filter.'}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={reset}>Reset filter</Button>
                  <Button onClick={() => openChat(params.search ? `Ada ${params.search}?` : '')}><Icon name="sparkle" size={16} /> Tanya Halika</Button>
                </div>
              }
            />
          )}

          {status === 'success' && result.data.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 lg:grid-cols-3 lg:gap-x-5">
                {result.data.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {meta.totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Halaman">
                  <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setParam('page', String(meta.page - 1))}>
                    <Icon name="arrowLeft" size={16} /> Sebelumnya
                  </Button>
                  <span className="text-sm">Halaman {meta.page} dari {meta.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setParam('page', String(meta.page + 1))}>
                    Berikutnya <Icon name="arrow" size={16} />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Filter</SheetTitle>
            <SheetDescription>Pilih kategori, ukuran, dan warna.</SheetDescription>
          </SheetHeader>
          <Filters filters={filters} params={params} setParam={setParam} reset={reset} />
          <Button onClick={() => setFilterOpen(false)}>Lihat {meta?.total ?? ''} produk</Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
