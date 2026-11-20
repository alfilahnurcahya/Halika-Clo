import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AdminPageHeader } from '@/components/layout/AdminLayout';
import { chatApi, getErrorMessage } from '@/lib/api';
import { Icon } from '@/lib/icons';
import { INTENT_LABELS, formatDateTime } from '@/lib/utils';

export default function ChatLogs() {
  const [intent, setIntent] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], meta: null });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setResult(await chatApi.logs({ page, limit: 20, ...(intent !== 'all' && { intent }) }));
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('error');
    }
  }, [intent, page]);

  useEffect(() => { load(); }, [load]);

  const meta = result.meta;

  return (
    <>
      <AdminPageHeader
        eyebrow="Data analisis"
        title="Riwayat Chat"
        description="Setiap pertanyaan, intent hasil model, dan jawaban chatbot tersimpan di sini."
        actions={
          <>
            <Select value={intent} onValueChange={(v) => { setIntent(v); setPage(1); }}>
              <SelectTrigger className="w-48" aria-label="Filter intent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua intent</SelectItem>
                {Object.entries(INTENT_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} aria-label="Muat ulang"><Icon name="refresh" size={17} /></Button>
          </>
        }
      />

      <Card className="p-2 sm:p-5">
        {status === 'loading' && <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>}
        {status === 'error' && <ErrorState message={error} onRetry={load} />}
        {status === 'success' && result.data.length === 0 && <EmptyState icon="message" title="Belum ada riwayat chat" description="Riwayat akan muncul setelah pelanggan bertanya di Halika Assistant." />}
        {status === 'success' && result.data.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pertanyaan & jawaban</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead className="hidden lg:table-cell">Produk dikenali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((log) => (
                  <TableRow key={log.id} className="align-top">
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                      {log.responseMs != null && <span className="block">{log.responseMs} ms</span>}
                    </TableCell>
                    <TableCell className="min-w-[260px] max-w-md">
                      <p className="font-medium">“{log.message}”</p>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{log.answer}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={log.intent === 'di_luar_konteks' ? 'secondary' : 'default'}>{INTENT_LABELS[log.intent] || log.intent}</Badge>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {log.confidence != null ? `${Math.round(log.confidence * 100)}%` : '–'} · {log.intentSource === 'fallback' ? 'cadangan' : 'model'}{log.llmUsed ? ' · LLM' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {log.productName || <span className="text-muted-foreground">–</span>}
                      {(log.size || log.color) && <span className="block text-xs text-muted-foreground">{[log.size, log.color].filter(Boolean).join(' · ')}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {meta && meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{meta.total} percakapan</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                  <span>{page}/{meta.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
