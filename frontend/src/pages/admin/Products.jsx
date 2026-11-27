import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, ErrorState, Spinner } from '@/components/feedback';
import { AdminPageHeader } from '@/components/layout/AdminLayout';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { StockDialog } from '@/components/admin/StockDialog';
import { getErrorMessage, productApi } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { formatRupiah } from '@/lib/utils';

const LOW = 3;

function StockSummary({ product }) {
  const out = product.variants.filter((v) => v.stock === 0).length;
  const low = product.variants.filter((v) => v.stock > 0 && v.stock <= LOW).length;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-semibold tabular-nums">{product.totalStock} pcs</span>
      {out > 0 && <Badge variant="destructive">{out} varian habis</Badge>}
      {low > 0 && <Badge variant="warning">{low} varian menipis</Badge>}
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await productApi.adminList({ limit: 50, sort: 'name' });
      setProducts(res.data);
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Buka dialog dari tautan dashboard: ?new=1 atau ?edit=<id>
  useEffect(() => {
    if (status !== 'success') return;
    if (searchParams.get('new')) { setEditing(null); setFormOpen(true); }
    const editId = Number(searchParams.get('edit'));
    if (editId) {
      const p = products.find((x) => x.id === editId);
      if (p) setStockProduct(p);
    }
    if (searchParams.get('new') || searchParams.get('edit')) setSearchParams({}, { replace: true });
  }, [status, searchParams, products, setSearchParams]);

  const upsert = (saved) => {
    setProducts((list) => {
      const exists = list.some((p) => p.id === saved.id);
      return exists ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list];
    });
    setStockProduct((p) => (p && p.id === saved.id ? saved : p));
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await productApi.remove(deleting.id);
      setProducts((list) => list.filter((p) => p.id !== deleting.id));
      toast.success(`${deleting.name} berhasil dihapus`);
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Produk gagal dihapus.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) => !q || `${p.name} ${p.category} ${p.material}`.toLowerCase().includes(q));

  return (
    <>
      <AdminPageHeader
        eyebrow="Stok terpusat"
        title="Produk & Stok"
        description="Tambah, ubah, atau hapus produk. Satu sumber data untuk katalog dan chatbot."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Icon name="plus" size={17} /> Tambah produk</Button>}
      />

      <Card className="p-3 sm:p-5">
        <div className="relative mb-4 max-w-sm">
          <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="pl-9" aria-label="Cari produk" />
        </div>

        {status === 'loading' && <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
        {status === 'error' && <ErrorState message={error} onRetry={load} />}
        {status === 'success' && filtered.length === 0 && (
          <EmptyState
            icon="box"
            title={products.length ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            description={products.length ? 'Coba kata kunci lain.' : 'Mulai dengan menambahkan produk pertama.'}
            action={!products.length && <Button onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> Tambah produk</Button>}
          />
        )}

        {status === 'success' && filtered.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="hidden sm:table-cell">Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="photo hidden h-14 w-11 object-cover sm:block" /> : <span className="hidden h-14 w-11 bg-accent sm:block" />}
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · {p.material}</p>
                        <p className="text-xs sm:hidden">{formatRupiah(p.price)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatRupiah(p.price)}</TableCell>
                  <TableCell><StockSummary product={p} /></TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.isActive ? <Badge variant="success">Tampil</Badge> : <Badge variant="secondary">Disembunyikan</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setStockProduct(p)}>Stok</Button>
                      <Button size="iconSm" variant="ghost" onClick={() => { setEditing(p); setFormOpen(true); }} aria-label={`Ubah ${p.name}`}><Icon name="edit" size={16} /></Button>
                      <Button size="iconSm" variant="ghost" className="text-destructive" onClick={() => setDeleting(p)} aria-label={`Hapus ${p.name}`}><Icon name="trash" size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} onSaved={upsert} />
      <StockDialog open={Boolean(stockProduct)} onOpenChange={(o) => !o && setStockProduct(null)} product={stockProduct} onSaved={upsert} />

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && !deleteLoading && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus produk?</DialogTitle>
            <DialogDescription>
              <b>{deleting?.name}</b> beserta seluruh data stoknya akan dihapus permanen. Jika hanya ingin menyembunyikan dari katalog, gunakan "Ubah" lalu hilangkan centang "Tampilkan di katalog".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>{deleteLoading ? <><Spinner /> Menghapus...</> : 'Ya, hapus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
