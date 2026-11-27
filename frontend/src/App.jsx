import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageLoader } from '@/components/feedback';
import { Toaster } from '@/components/ui/sonner';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';

// Halaman admin dimuat terpisah agar halaman pelanggan lebih ringan di ponsel
const Login = lazy(() => import('@/pages/admin/Login'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Products = lazy(() => import('@/pages/admin/Products'));
const ChatLogs = lazy(() => import('@/pages/admin/ChatLogs'));
const Guide = lazy(() => import('@/pages/admin/Guide'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="koleksi" element={<Catalog />} />
              <Route path="produk/:slug" element={<ProductDetail />} />
              <Route path="tentang-kami" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<Login />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="produk" element={<Products />} />
              <Route path="chat" element={<ChatLogs />} />
              <Route path="panduan" element={<Guide />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
