import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminPageHeader } from '@/components/layout/AdminLayout';
import { Icon } from '@/lib/icons';

const SECTIONS = [
  {
    icon: 'plus',
    title: 'Menambah produk baru',
    steps: [
      'Buka menu Produk & Stok, tekan tombol "Tambah produk".',
      'Isi nama, kategori, bahan, harga (angka saja, tanpa titik), dan URL foto.',
      'Di bagian "Varian & stok", isi ukuran, warna, dan jumlah stok. Tekan "Tambah varian" untuk kombinasi lain.',
      'Tekan "Simpan produk". Notifikasi hijau berarti berhasil; produk langsung muncul di katalog.',
    ],
  },
  {
    icon: 'box',
    title: 'Memperbarui stok setelah live / penjualan',
    steps: [
      'Di Produk & Stok, tekan tombol "Stok" pada produk.',
      'Ubah angka (atau pakai tombol − / +), lalu tekan "Simpan" pada baris tersebut.',
      'Stok baru langsung dipakai katalog dan jawaban Halika Assistant.',
    ],
  },
  {
    icon: 'grid',
    title: 'Membaca dashboard',
    steps: [
      '"Prioritas restock" = produk yang sering ditanyakan pelanggan tetapi stoknya menipis/habis. Dahulukan produk ini.',
      '"Stok menipis & habis" = daftar varian dengan stok sedikit. Tekan "Ubah" untuk memperbarui.',
      '"Produk paling sering ditanyakan" membantu melihat produk yang diminati pelanggan.',
    ],
  },
  {
    icon: 'message',
    title: 'Mengecek jawaban chatbot',
    steps: [
      'Buka Riwayat Chat untuk melihat pertanyaan pelanggan dan jawaban yang diberikan.',
      'Label "cadangan" berarti layanan AI sedang tidak aktif dan chatbot memakai mode cadangan.',
      'Jika ada jawaban yang kurang tepat, catat dan sampaikan ke tim untuk perbaikan.',
    ],
  },
];

export default function Guide() {
  return (
    <>
      <AdminPageHeader eyebrow="Bantuan" title="Panduan singkat untuk owner" description="Langkah-langkah mengelola toko di halaman admin." />
      <Alert variant="info" className="mb-5">
        <Icon name="info" size={18} className="text-primary" />
        <div>
          <AlertTitle>Arti notifikasi</AlertTitle>
          <AlertDescription>
            Notifikasi <b className="text-success">hijau</b> = berhasil disimpan. Notifikasi <b className="text-destructive">merah</b> = gagal, baca pesannya (mis. stok tidak boleh negatif). Ikon berputar = sedang diproses, tunggu sebentar.
          </AlertDescription>
        </div>
      </Alert>
      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-primary/15 text-rose-dark"><Icon name={s.icon} size={16} /></span>{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#6e5b51]">
                {s.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Ingin melihat tampilan pelanggan? <Link to="/" className="font-semibold text-primary hover:underline">Buka toko</Link>.
      </p>
    </>
  );
}
