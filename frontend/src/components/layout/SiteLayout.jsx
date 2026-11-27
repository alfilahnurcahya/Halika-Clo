import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ChatWidget, openChat } from '@/components/chat/ChatWidget';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function Logo({ className, light = false }) {
  return (
    <Link to="/" className={cn('font-display text-[25px] font-semibold tracking-[-0.05em] whitespace-nowrap', light ? 'text-white' : 'text-brown', className)}>
      halika<span className="text-primary">.clo</span>
    </Link>
  );
}

const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/koleksi', label: 'Koleksi' },
  { to: '/koleksi?sort=newest', label: 'Terbaru' },
  { to: '/tentang-kami', label: 'Tentang Kami' },
];

function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    if (query) return location.search.includes(query);
    return !NAV.some((n) => n.to.startsWith(`${path}?`) && location.search.includes(n.to.split('?')[1]));
  };

  return (
    <>
      <div className="bg-brown px-5 py-2 text-center text-[11px] tracking-[0.06em] text-[#fffaf4]">
        Stok di website diperbarui langsung oleh toko · Tanya Halika Assistant kapan saja
      </div>
      <header className="sticky top-0 z-30 border-b border-[#ede5dc] bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-[5vw] md:h-[76px]">
          <button type="button" className="-ml-2 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Icon name="menu" />
          </button>
          <Logo />
          <nav className="mx-auto hidden gap-8 md:flex" aria-label="Navigasi utama">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn('py-1 text-sm transition-colors hover:text-primary', isActive(item.to) && 'border-b border-primary text-primary')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button type="button" className="p-2.5 hover:text-primary" onClick={() => navigate('/koleksi?focus=search')} aria-label="Cari produk">
              <Icon name="search" />
            </button>
            <button type="button" className="p-2.5 hover:text-primary md:hidden" onClick={() => openChat()} aria-label="Tanya Halika">
              <Icon name="sparkle" />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo className="mb-4" />
          <nav className="flex flex-col" aria-label="Menu ponsel">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="border-b py-4 text-base">
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-brown px-[6vw] pb-28 pt-14 text-cream md:pb-8">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1.5fr_.7fr_.7fr]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#cfbeb1]">
            Busana perempuan yang dirancang untuk menemani setiap cerita dan langkahmu.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2.5 text-sm">
          <b className="eyebrow mb-1">Belanja</b>
          <Link to="/koleksi" className="hover:text-primary">Semua Koleksi</Link>
          <Link to="/koleksi?category=Dress" className="hover:text-primary">Dress</Link>
          <Link to="/koleksi?category=Atasan" className="hover:text-primary">Atasan</Link>
          <Link to="/tentang-kami" className="hover:text-primary">Tentang Kami</Link>
        </div>
        <div className="flex flex-col items-start gap-2.5 text-sm">
          <b className="eyebrow mb-1">Bantuan</b>
          <button type="button" onClick={() => openChat('Ukuran yang tersedia apa saja?')} className="hover:text-primary">Tanya ukuran</button>
          <button type="button" onClick={() => openChat()} className="hover:text-primary">Halika Assistant</button>
          <Link to="/admin" className="hover:text-primary">Masuk Admin</Link>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1440px] text-xs text-[#cfbeb1]/70">
        © {new Date().getFullYear()} halika.clo · Prototype capstone Asah 2026 (A26-CS057)
      </div>
    </footer>
  );
}

function MobileNav() {
  const item = 'flex flex-1 flex-col items-center gap-1 py-2 text-[11px]';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Navigasi bawah">
      <NavLink to="/" end className={({ isActive }) => cn(item, isActive && 'text-primary')}>
        <Icon name="home" size={20} /> Beranda
      </NavLink>
      <NavLink to="/koleksi" className={({ isActive }) => cn(item, isActive && 'text-primary')}>
        <Icon name="grid" size={20} /> Koleksi
      </NavLink>
      <button type="button" onClick={() => openChat()} className={item}>
        <Icon name="sparkle" size={20} /> Tanya Halika
      </button>
    </nav>
  );
}

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:bg-brown focus:px-3 focus:py-2 focus:text-white">
        Lewati ke konten
      </a>
      <Header />
      <main id="konten" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <ChatWidget />
    </div>
  );
}
