import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/feedback';
import { getErrorMessage, getFieldErrors, productApi } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { CATEGORIES, SIZE_ORDER } from '@/lib/utils';

const emptyVariant = () => ({ key: crypto.randomUUID?.() || String(Math.random()), size: 'M', color: '', stock: '0' });

const emptyForm = {
  name: '', category: '', material: '', price: '', description: '', imageUrl: '', isActive: true,
  variants: [emptyVariant()],
};

const toForm = (p) => ({
  name: p.name,
  category: p.category,
  material: p.material,
  price: String(p.price),
  description: p.description || '',
  imageUrl: p.imageUrl || '',
  isActive: p.isActive,
  variants: p.variants.map((v) => ({ key: String(v.id), size: v.size, color: v.color, stock: String(v.stock) })),
});

/** Validasi di sisi klien (sama dengan aturan Joi di backend) agar pesan muncul lebih cepat. */
function validateForm(form) {
  const e = {};
  if (form.name.trim().length < 3) e.name = 'Nama produk minimal 3 karakter.';
  if (!form.category) e.category = 'Pilih kategori.';
  if (form.material.trim().length < 2) e.material = 'Bahan wajib diisi.';
  const price = Number(form.price);
  if (form.price === '' || !Number.isInteger(price) || price < 1000) e.price = 'Harga harus angka bulat minimal 1.000.';
  if (form.imageUrl && !/^https?:\/\//.test(form.imageUrl)) e.imageUrl = 'URL foto harus diawali http:// atau https://';
  if (form.variants.length === 0) e.variants = 'Tambahkan minimal 1 varian stok.';
  const seen = new Set();
  form.variants.forEach((v, i) => {
    if (v.color.trim().length < 2) e[`variants.${i}.color`] = 'Warna wajib diisi.';
    const stock = Number(v.stock);
    if (v.stock === '' || !Number.isInteger(stock) || stock < 0) e[`variants.${i}.stock`] = 'Stok harus angka ≥ 0.';
    const k = `${v.size}|${v.color.trim().toLowerCase()}`;
    if (seen.has(k)) e[`variants.${i}.color`] = 'Kombinasi ukuran & warna ganda.';
    seen.add(k);
  });
  return e;
}

function FieldError({ message }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function ProductFormDialog({ open, onOpenChange, product, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(product ? toForm(product) : { ...emptyForm, variants: [emptyVariant()] });
      setErrors({});
      setServerError('');
    }
  }, [open, product]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setVariant = (index, field, value) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)) }));

  const submit = async (event) => {
    event.preventDefault();
    setServerError('');
    const clientErrors = validateForm(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      toast.error('Periksa kembali isian yang ditandai merah.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      material: form.material.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
      variants: form.variants.map((v) => ({ size: v.size, color: v.color.trim(), stock: Number(v.stock) })),
    };

    setSaving(true);
    try {
      const res = isEdit ? await productApi.update(product.id, payload) : await productApi.create(payload);
      toast.success(res.message);
      onSaved(res.data);
      onOpenChange(false);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err, 'Produk gagal disimpan.'));
      toast.error('Produk gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah produk' : 'Tambah produk'}</DialogTitle>
          <DialogDescription>Perubahan langsung tampil di katalog dan jawaban Halika Assistant.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="destructive"><Icon name="alert" size={18} /><AlertDescription className="mt-0">{serverError}</AlertDescription></Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nama produk *</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} placeholder="mis. Aruna Linen Dress" />
              <FieldError message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger aria-invalid={Boolean(errors.category)}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError message={errors.category} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="material">Bahan *</Label>
              <Input id="material" value={form.material} onChange={(e) => set('material', e.target.value)} aria-invalid={Boolean(errors.material)} placeholder="mis. Linen" />
              <FieldError message={errors.material} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input id="price" inputMode="numeric" value={form.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(errors.price)} placeholder="489000" />
              <FieldError message={errors.price} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">URL foto</Label>
              <Input id="imageUrl" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} aria-invalid={Boolean(errors.imageUrl)} placeholder="https://..." />
              <FieldError message={errors.imageUrl} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" value={form.description} maxLength={2000} onChange={(e) => set('description', e.target.value)} placeholder="Potongan, kegunaan, detail produk..." />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Varian & stok *</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => set('variants', [...form.variants, emptyVariant()])}>
                <Icon name="plus" size={15} /> Tambah varian
              </Button>
            </div>
            <div className="space-y-2 rounded-md border bg-secondary/40 p-3">
              <div className="hidden grid-cols-[110px_1fr_100px_36px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
                <span>Ukuran</span><span>Warna</span><span>Stok</span><span />
              </div>
              {form.variants.map((v, i) => (
                <div key={v.key} className="grid grid-cols-[1fr_1fr] gap-2 border-b pb-2 last:border-0 last:pb-0 sm:grid-cols-[110px_1fr_100px_36px] sm:border-0 sm:pb-0">
                  <Select value={v.size} onValueChange={(val) => setVariant(i, 'size', val)}>
                    <SelectTrigger aria-label="Ukuran"><SelectValue /></SelectTrigger>
                    <SelectContent>{SIZE_ORDER.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <div>
                    <Input value={v.color} onChange={(e) => setVariant(i, 'color', e.target.value)} placeholder="Warna" aria-label="Warna" aria-invalid={Boolean(errors[`variants.${i}.color`])} />
                    <FieldError message={errors[`variants.${i}.color`]} />
                  </div>
                  <div>
                    <Input inputMode="numeric" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value.replace(/\D/g, ''))} aria-label="Stok" aria-invalid={Boolean(errors[`variants.${i}.stock`])} />
                    <FieldError message={errors[`variants.${i}.stock`]} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" disabled={form.variants.length === 1}
                    onClick={() => set('variants', form.variants.filter((_, idx) => idx !== i))} aria-label="Hapus varian">
                    <Icon name="trash" size={17} />
                  </Button>
                </div>
              ))}
            </div>
            <FieldError message={errors.variants} />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox checked={form.isActive} onCheckedChange={(c) => set('isActive', Boolean(c))} />
            Tampilkan di katalog
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? <><Spinner /> Menyimpan...</> : 'Simpan produk'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
