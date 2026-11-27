import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { PageLoader } from '@/components/feedback';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

const MENU = [
  { to: '/admin', icon: 'grid', label: 'Dashboard', end: true },
  { to: '/admin/produk', icon: 'box', label: 'Produk & Stok' },
  { to: '/admin/chat', icon: 'message', label: 'Riwayat Chat' },
  { to: '/admin/panduan', icon: 'book', label: 'Panduan' },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="font-display text-[25px] font-semibold tracking-[-0.05em] text-white" onClick={onNavigate}>
        halika<span className="text-[#d79a9c]">.clo</span>
      </Link>
      <small className="mb-3 mt-8 px-2.5 text-[9px] tracking-[0.16em] text-white/50">ADMIN PANEL</small>
      <nav className="flex flex-col gap-1" aria-label="Menu admin">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-3 text-sm text-[#d2c4bb] transition-colors hover:bg-white/5 hover:text-white',
              isActive && 'border-[#d79a9c] bg-white/10 text-white',
            )}
          >
            <Icon name={m.icon} size={19} /> {m.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-xs text-white">{initials}</span>
          <span className="min-w-0 flex-1 text-sm">
            <b className="block truncate font-semibold text-white">{user?.name}</b>
            <small className="text-white/55">{user?.role === 'co_owner' ? 'Co-owner' : 'Owner'}</small>
          </span>
          <button type="button" onClick={logout} className="rounded p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Keluar" title="Keluar">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, checking } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (checking) return <PageLoader label="Memeriksa sesi login..." />;
  // Pengguna tanpa login ditolak dan diarahkan ke halaman login
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-screen bg-[#f6f3ef] md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-brown px-5 py-7 text-[#f7efe7] md:block">
        <SidebarContent />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between bg-brown px-4 py-3 text-white md:hidden">
        <button type="button" onClick={() => setOpen(true)} className="p-1.5" aria-label="Buka menu admin"><Icon name="menu" /></button>
        <span className="font-display text-xl">halika<span className="text-[#d79a9c]">.clo</span> <small className="font-sans text-[10px] tracking-widest text-white/60">ADMIN</small></span>
        <span className="w-8" />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-brown text-white">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="min-w-0 px-4 py-6 sm:px-6 md:px-[3.5vw] md:py-9">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="eyebrow mb-2 text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
