import { Toaster as Sonner } from 'sonner';

/** Notifikasi berhasil / gagal untuk setiap aksi pengguna. */
function Toaster(props) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
      {...props}
    />
  );
}

export { Toaster };
