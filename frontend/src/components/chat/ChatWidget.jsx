import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/lib/icons';
import { chatApi, getErrorMessage } from '@/lib/api';
import { cn, formatRupiah } from '@/lib/utils';

const SUGGESTIONS = ['Aruna Linen Dress ukuran M ready?', 'Ada dress warna sage?', 'Bahan Senja Blouse apa?'];
const MAX_LENGTH = 500;

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  text: 'Halo, Kak! Aku Halika Assistant. Tanyakan stok, ukuran, warna, atau bahan produk — jawabanku diambil langsung dari data stok toko.',
};

function getSessionId() {
  const KEY = 'halika_chat_session';
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `guest${Date.now()}`;
  }
}

/** Buka chat dari halaman lain, mis. tombol "Tanya produk ini" di halaman detail. */
// eslint-disable-next-line react-refresh/only-export-components
export const openChat = (message = '') => window.dispatchEvent(new CustomEvent('chat:open', { detail: { message } }));

function ProductSuggestion({ product, onNavigate }) {
  return (
    <Link
      to={`/produk/${product.slug}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md border bg-white p-2 transition-colors hover:border-primary"
    >
      {product.imageUrl ? (
        <img src={product.imageUrl} alt="" className="photo size-12 shrink-0 object-cover" />
      ) : (
        <span className="size-12 shrink-0 bg-accent" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{product.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatRupiah(product.price)} · {product.totalStock > 0 ? `stok ${product.totalStock}` : 'stok habis'}
        </span>
      </span>
      <Icon name="arrow" size={16} className="text-primary" />
    </Link>
  );
}

function Message({ message, onRetry, onNavigate }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-[13.5px] leading-relaxed',
          isUser ? 'rounded-[14px_14px_4px_14px] bg-brown text-ivory' : 'rounded-[4px_14px_14px_14px] bg-white shadow-sm',
          message.error && 'border border-destructive/30 bg-destructive/5 text-destructive',
        )}
      >
        {message.text}
      </div>
      {message.error && onRetry && (
        <button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <Icon name="refresh" size={14} /> Kirim ulang
        </button>
      )}
      {message.products?.length > 0 && (
        <div className="flex w-[85%] flex-col gap-2">
          {message.products.map((p) => <ProductSuggestion key={p.id} product={p} onNavigate={onNavigate} />)}
        </div>
      )}
      {message.meta && (
        <span className="text-[10px] text-muted-foreground">{message.meta}</span>
      )}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [sending, setSending] = useState(false);
  const [lastFailed, setLastFailed] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const send = useCallback(async (raw) => {
    const text = raw.trim();
    if (text.length < 2 || sending) return;

    setMessages((prev) => [...prev.filter((m) => !m.error), { id: `u${Date.now()}`, role: 'user', text }]);
    setInput('');
    setSending(true);
    setLastFailed(null);

    try {
      const data = await chatApi.send({ message: text, sessionId: sessionId.current });
      setMessages((prev) => [
        ...prev,
        {
          id: `b${Date.now()}`,
          role: 'bot',
          text: data.reply,
          products: data.products,
          meta: data.intentSource === 'fallback' ? 'Mode cadangan: layanan AI sedang tidak tersedia' : undefined,
        },
      ]);
    } catch (err) {
      setLastFailed(text);
      setMessages((prev) => [...prev, { id: `e${Date.now()}`, role: 'bot', error: true, text: getErrorMessage(err, 'Maaf, pesan gagal dikirim.') }]);
    } finally {
      setSending(false);
    }
  }, [sending]);

  // Event global untuk membuka chat (opsional dengan pertanyaan terisi)
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      if (e.detail?.message) setInput(e.detail.message);
    };
    window.addEventListener('chat:open', handler);
    return () => window.removeEventListener('chat:open', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const tooShort = input.trim().length > 0 && input.trim().length < 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_#4b352a33] transition-transform hover:-translate-y-0.5 md:flex',
          open && 'md:hidden',
        )}
        aria-expanded={open}
      >
        <Icon name="sparkle" /> Tanya Halika
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Halika Assistant"
          className="animate-chat-in fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col overflow-hidden border bg-background shadow-2xl md:inset-auto md:bottom-5 md:right-5 md:h-[600px] md:max-h-[calc(100vh-40px)] md:w-[390px] md:rounded-xl"
        >
          <header className="flex items-center justify-between bg-brown px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white/10"><Icon name="sparkle" size={18} /></span>
              <div>
                <p className="text-sm font-semibold">Halika Assistant</p>
                <p className="text-[11px] text-white/65">Info stok, ukuran, warna & bahan</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 hover:bg-white/10" aria-label="Tutup chat">
              <Icon name="close" size={18} />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#f8f2eb] px-4 py-5" aria-live="polite">
            {messages.map((m) => (
              <Message
                key={m.id}
                message={m}
                onRetry={m.error && lastFailed ? () => send(lastFailed) : undefined}
                onNavigate={() => setOpen(window.innerWidth >= 768)}
              />
            ))}
            {sending && (
              <div className="flex w-fit items-center gap-1 rounded-[4px_14px_14px_14px] bg-white px-4 py-3 shadow-sm" role="status" aria-label="Asisten sedang mengetik">
                <span className="typing-dot size-1.5 rounded-full bg-brown" />
                <span className="typing-dot size-1.5 rounded-full bg-brown" />
                <span className="typing-dot size-1.5 rounded-full bg-brown" />
              </div>
            )}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-[#d9c6bc] bg-white px-3 py-1.5 text-xs hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="Ketik pertanyaanmu..."
                className="h-10 flex-1 bg-transparent px-1 text-sm outline-none"
                aria-label="Pesan"
                disabled={sending}
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={sending || input.trim().length < 2} aria-label="Kirim">
                <Icon name="send" size={17} />
              </Button>
            </div>
            {tooShort && <p className="px-1 pt-1 text-[11px] text-destructive">Pesan minimal 2 karakter.</p>}
          </form>
        </section>
      )}
    </>
  );
}
