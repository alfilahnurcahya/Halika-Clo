import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <EmptyState
        icon="alert"
        title="Halaman tidak ditemukan"
        description="Tautan yang kamu buka tidak tersedia."
        action={<Button asChild><Link to="/">Kembali ke beranda</Link></Button>}
      />
    </div>
  );
}
