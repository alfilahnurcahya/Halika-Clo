import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from '@/components/shop/ProductCard';
import { ErrorState } from '@/components/feedback';
import { openChat } from '@/components/chat/ChatWidget';
import { Icon } from '@/lib/icons';
import { getErrorMessage, productApi } from '@/lib/api';

// Foto placeholder dari mockup — ganti dengan foto Halika.Clo yang sudah diizinkan owner
const HERO_IMAGE = 'https://images.unsplash.com/photo-1630420897726-e29b969ad5b2?auto=format&fit=crop&w=1600&q=80';
const STORY_IMAGE = 'https://images.unsplash.com/photo-1672393798884-868d22a4151d?auto=format&fit=crop&w=1200&q=80';

function SectionHead({ eyebrow, title, to }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="font-display text-3xl sm:text-[38px]">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="flex shrink-0 items-center gap-1.5 border-b border-primary pb-1.5 text-sm font-semibold">
          Lihat semua <Icon name="arrow" size={16} />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [list, filters] = await Promise.all([productApi.list({ limit: 8, sort: 'newest' }), productApi.filters()]);
      setProducts(list.data);
      setCategories(filters.categories);
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categoryImage = (name) => products.find((p) => p.category === name && p.imageUrl)?.imageUrl || HERO_IMAGE;

  return (
    <>
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[520px] max-h-[830px] overflow-hidden bg-[#e9ded2]">
        <img src={HERO_IMAGE} alt="Koleksi busana perempuan Halika.Clo" className="photo absolute inset-0 h-full w-full object-cover object-[center_31%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(49,31,22,.62),rgba(49,31,22,.08)_70%)]" />
        <div className="relative z-10 flex h-full max-w-[1440px] flex-col justify-center px-[7vw] text-white">
          <p className="eyebrow mb-4">Koleksi Halika.Clo</p>
          <h1 className="font-display text-[42px] leading-[1.05] sm:text-6xl lg:text-[74px]">
            Elegansi yang<br />
            <em className="font-normal text-blush">terasa seperti dirimu.</em>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/90">
            Lihat stok, ukuran, warna, dan bahan secara langsung — atau tanyakan pada Halika Assistant tanpa perlu menunggu balasan admin.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/koleksi">Jelajahi koleksi <Icon name="arrow" size={18} /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Kategori */}
      <section className="mx-auto max-w-[1440px] px-[6vw] py-16 md:py-24">
        <SectionHead eyebrow="Temukan gayamu" title="Belanja berdasarkan kategori" to="/koleksi" />
        {status === 'error' ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {(status === 'loading' ? [1, 2, 3] : categories.slice(0, 6)).map((cat, i) =>
              status === 'loading' ? (
                <div key={i} className="aspect-[4/5] animate-pulse bg-accent" />
              ) : (
                <Link
                  key={cat.name}
                  to={`/koleksi?category=${encodeURIComponent(cat.name)}`}
                  className="group relative aspect-[4/5] overflow-hidden bg-accent"
                >
                  <img src={categoryImage(cat.name)} alt={cat.name} loading="lazy" className="photo h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2b1d16aa] to-transparent" />
                  <span className="absolute bottom-5 left-5 font-display text-2xl text-white">
                    {cat.name}
                    <small className="eyebrow mt-1.5 block font-sans">{cat.count} produk</small>
                  </span>
                </Link>
              ),
            )}
          </div>
        )}
      </section>

      {/* Produk terbaru */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1440px] px-[6vw] py-16 md:py-24">
          <SectionHead eyebrow="Koleksi terbaru" title="Pilihan untuk kamu" to="/koleksi" />
          {status === 'error' ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
              {status === 'loading'
                ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
                : products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Cara kerja chatbot */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-[6vw] py-16 md:grid-cols-[1fr_1.1fr] md:gap-[8vw] md:py-24">
        <div>
          <p className="eyebrow mb-3">Tanpa menunggu admin</p>
          <h2 className="font-display text-3xl sm:text-[38px]">Tanya stok kapan saja, dijawab dari data toko.</h2>
          <ol className="mt-6 space-y-4 text-sm leading-relaxed text-[#79665c]">
            {[
              'Ketik pertanyaan, misalnya "Kirana Floral Dress ukuran M warna sage ada?"',
              'Halika Assistant mengenali produk, ukuran, dan warna yang kamu maksud.',
              'Jawaban diambil dari stok terbaru yang dicatat owner, lengkap dengan tautan produknya.',
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <Button className="mt-7" onClick={() => openChat()}>
            <Icon name="sparkle" size={18} /> Coba Halika Assistant
          </Button>
        </div>
        <img src={STORY_IMAGE} alt="Pelanggan Halika.Clo" loading="lazy" className="photo h-[420px] w-full object-cover md:h-[500px]" />
      </section>
    </>
  );
}
