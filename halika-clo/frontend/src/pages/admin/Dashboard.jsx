import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AdminPageHeader } from '@/components/layout/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { INTENT_LABELS } from '@/lib/utils';

function Stat({ label, value, hint, tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-[26px]">{value}</p>
      {hint && (
        <p className={`mt-1 flex items-center gap-1 text-[11px] ${tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {tone && <Icon name="alert" size={13} />} {hint}
        </p>
      )}
    </Card>
  );
}

/** Bar horizontal satu warna: label & angka dalam warna teks, batang = besaran. */
function BarList({ items, valueKey, labelKey, unit = '' }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item[labelKey]} title={`${item[labelKey]}: ${item[valueKey]}${unit}`}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]">
            <span className="truncate">{item[labelKey]}</span>
            <b className="tabular-nums">{item[valueKey]}{unit}</b>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChatsPerDay({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-40 items-end gap-2" role="img" aria-label={`Jumlah chat 7 hari terakhir: ${data.map((d) => d.count).join(', ')}`}>
      {data.map((d) => {
        const day = new Date(`${d.day}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' });
        return (
          <div key={d.day} className="group flex flex-1 flex-col items-center gap-1.5" title={`${d.day}: ${d.count} chat`}>
            <span className="text-[11px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
            <div className="w-full max-w-9 rounded-t-[4px] bg-brown transition-colors group-hover:bg-primary" style={{ height: `${Math.max(3, (d.count / max) * 110)}px` }} />
            <span className="text-[10px] text-muted-foreground">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [days, setDays] = useState('30');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setData(await analyticsApi.summary({ days }));
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <AdminPageHeader
        eyebrow={today}
        title={`Halo, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="Ringkasan stok dan pertanyaan pelanggan untuk membantu keputusan restock."
        actions={
          <>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-40" aria-label="Periode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari terakhir</SelectItem>
                <SelectItem value="30">30 hari terakhir</SelectItem>
                <SelectItem value="90">90 hari terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} aria-label="Muat ulang"><Icon name="refresh" size={17} /></Button>
            <Button asChild><Link to="/admin/produk?new=1"><Icon name="plus" size={17} /> Tambah produk</Link></Button>
          </>
        }
      />

      {status === 'loading' && <DashboardSkeleton />}
      {status === 'error' && <ErrorState message={error} onRetry={load} />}

      {status === 'success' && data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Produk aktif" value={data.stock.activeProducts} hint={`Total stok ${data.stock.totalStock} pcs`} />
            <Stat label="Varian stok menipis" value={data.stock.lowStockVariants} hint={`Stok ≤ ${data.lowStockThreshold} pcs`} tone={data.stock.lowStockVariants ? 'warning' : undefined} />
            <Stat label="Varian stok habis" value={data.stock.outOfStockVariants} hint="Perlu restock / nonaktifkan" tone={data.stock.outOfStockVariants ? 'danger' : undefined} />
            <Stat label={`Chat ${data.periodDays} hari`} value={data.chat.totalChats} hint={`Rata-rata respons ${(data.chat.avgResponseMs / 1000).toFixed(1)} detik`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Icon name="alert" size={18} className="text-warning" /> Prioritas restock</CardTitle>
              <CardDescription>Produk yang sering ditanyakan pelanggan tetapi memiliki varian stok menipis atau habis.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.restockPriority.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada produk yang perlu diprioritaskan pada periode ini.</p>
              ) : (
                <ul className="divide-y">
                  {data.restockPriority.map((p) => (
                    <li key={p.productId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.reason}</p>
                      </div>
                      <Button asChild size="sm" variant="outline"><Link to={`/admin/produk?edit=${p.productId}`}>Ubah stok</Link></Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produk paling sering ditanyakan</CardTitle>
                <CardDescription>Jumlah pertanyaan ke Halika Assistant per produk, {data.periodDays} hari terakhir.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topAsked.length ? <BarList items={data.topAsked} labelKey="name" valueKey="askCount" unit="x" /> : <p className="text-sm text-muted-foreground">Belum ada pertanyaan tentang produk.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Jenis pertanyaan (intent)</CardTitle>
                <CardDescription>
                  {data.chat.outOfContext} pertanyaan di luar konteks ditolak · {data.chat.fallbackCount} dijawab mode cadangan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.intents.length ? (
                  <BarList items={data.intents.map((i) => ({ label: INTENT_LABELS[i.intent] || i.intent, count: i.count }))} labelKey="label" valueKey="count" />
                ) : <p className="text-sm text-muted-foreground">Belum ada data chat.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Stok menipis & habis</CardTitle>
                <CardDescription>Varian dengan stok ≤ {data.lowStockThreshold} pcs, urut dari yang paling sedikit.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-5">
                {data.lowStock.length === 0 ? (
                  <EmptyState icon="check" title="Semua stok aman" className="py-8" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Produk</TableHead><TableHead>Ukuran</TableHead><TableHead>Warna</TableHead><TableHead className="text-right">Stok</TableHead><TableHead /></TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lowStock.map((v) => (
                        <TableRow key={v.variantId}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>{v.size}</TableCell>
                          <TableCell>{v.color}</TableCell>
                          <TableCell className="text-right">
                            {v.stock === 0 ? <Badge variant="destructive">Habis</Badge> : <Badge variant="warning">{v.stock} pcs</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/produk?edit=${v.productId}`} className="text-xs font-semibold text-primary hover:underline">Ubah</Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Chat 7 hari terakhir</CardTitle>
                  <CardDescription>Arahkan kursor ke batang untuk melihat angka.</CardDescription>
                </CardHeader>
                <CardContent><ChatsPerDay data={data.chatsPerDay} /></CardContent>
              </Card>

              {data.insights?.insights?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Temuan & rekomendasi</CardTitle>
                    <CardDescription>Analisis tim Data Science · Sumber: {data.insights.dataSource}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.insights.insights.map((ins) => (
                      <div key={ins.title} className="rounded-md bg-secondary p-3.5">
                        <p className="text-sm font-semibold">{ins.title}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">{ins.detail}</p>
                        <p className="mt-2 text-[13px]"><b>Rekomendasi:</b> {ins.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
