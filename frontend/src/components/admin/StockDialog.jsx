import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/feedback';
import { getErrorMessage, productApi } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

/** Ubah stok per varian dengan cepat (cocok dipakai setelah live TikTok). */
export function StockDialog({ open, onOpenChange, product, onSaved }) {
  const [values, setValues] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (open && product) setValues(Object.fromEntries(product.variants.map((v) => [v.id, String(v.stock)])));
  }, [open, product]);

  if (!product) return null;

  const save = async (variant) => {
    const raw = values[variant.id];
    const stock = Number(raw);
    if (raw === '' || !Number.isInteger(stock) || stock < 0 || stock > 9999) {
      toast.error('Stok harus angka bulat 0–9999 (tidak boleh negatif).');
      return;
    }
    setSavingId(variant.id);
    try {
      const res = await productApi.updateStock(product.id, variant.id, stock);
      toast.success(`Stok ${variant.size} / ${variant.color} menjadi ${stock} pcs`);
      onSaved(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Stok gagal diperbarui.'));
    } finally {
      setSavingId(null);
    }
  };

  const adjust = (id, delta) =>
    setValues((v) => ({ ...v, [id]: String(Math.max(0, (Number(v[id]) || 0) + delta)) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah stok</DialogTitle>
          <DialogDescription>{product.name} — ubah angka lalu tekan Simpan pada baris tersebut.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {product.variants.map((v) => {
            const changed = values[v.id] !== String(v.stock);
            return (
              <li key={v.id} className="flex items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{v.size} · {v.color}</p>
                  <p className="text-xs text-muted-foreground">Tersimpan: {v.stock} pcs</p>
                </div>
                <Button type="button" variant="outline" size="iconSm" onClick={() => adjust(v.id, -1)} aria-label="Kurangi"><Icon name="minus" size={14} /></Button>
                <Input
                  inputMode="numeric"
                  value={values[v.id] ?? ''}
                  onChange={(e) => setValues({ ...values, [v.id]: e.target.value.replace(/\D/g, '') })}
                  className="h-8 w-16 text-center"
                  aria-label={`Stok ${v.size} ${v.color}`}
                />
                <Button type="button" variant="outline" size="iconSm" onClick={() => adjust(v.id, 1)} aria-label="Tambah"><Icon name="plus" size={14} /></Button>
                <Button size="sm" className={cn('w-20', !changed && 'invisible')} disabled={savingId === v.id} onClick={() => save(v)}>
                  {savingId === v.id ? <Spinner size={14} /> : 'Simpan'}
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
