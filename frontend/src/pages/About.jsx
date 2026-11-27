import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { openChat } from '@/components/chat/ChatWidget';
import { Icon } from '@/lib/icons';
import { orderLinks } from '@/lib/utils';

// Foto placeholder dari mockup — ganti dengan foto Halika.Clo yang sudah diizinkan owner
const ABOUT_IMAGE = 'https://images.unsplash.com/photo-1604300834574-252c0c25d1c1?auto=format&fit=crop&w=1200&q=80';

const VALUES = [
  {
    icon: 'sparkle',
    title: 'Nyaman & anggun',
    text: 'Busana perempuan dengan potongan dan bahan yang nyaman dipakai dari pagi hingga malam.',
  },
  {
    icon: 'box',
    title: 'Stok transparan',
    text: 'Stok ukuran dan warna di website dicatat langsung oleh toko, jadi kamu tahu apa yang benar-benar tersedia.',
  },
  {
    icon: 'message',
    title: 'Mudah bertanya',
    text: 'Halika Assistant siap menjawab pertanyaan stok, ukuran, warna, dan bahan tanpa perlu menunggu admin.',
  },
];

export default function About() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const links = orderLinks(null);

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-[1440px] px-[6vw] py-16 md:py-24">
          <p className="mb-8 text-xs text-[#9c8980]">
            <Link to="/" className="hover:text-primary">Beranda</Link> / Tentang Kami
          </p>
          <p className="eyebrow mb-3">Tentang Kami</p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
            Halika.Clo, busana perempuan untuk setiap <em className="font-normal text-primary">cerita dan langkahmu.</em>
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-[6vw] py-16 md:grid-cols-[1fr_1.1fr] md:gap-[7vw] md:py-24">
        <img src={ABOUT_IMAGE} alt="Koleksi Halika.Clo" loading="lazy" className="photo h-[420px] w-full object-cover md:h-[540px]" />
        <div>
          <p className="eyebrow mb-3">Cerita kami</p>
          <h2 className="font-display text-3xl sm:text-[38px]">Berawal dari usaha kecil yang dekat dengan pelanggannya.</h2>
          {/* TODO: ganti dua paragraf di bawah dengan cerita asli dari owner (cek juga kanal penjualannya) */}
          <p className="mt-5 leading-relaxed text-[#75635a]">
            Halika.Clo adalah usaha fashion wanita yang menjual koleksinya melalui Shopee dan live TikTok. Setiap produk dipilih agar nyaman dipakai dan tetap terlihat anggun untuk berbagai kesempatan.
          </p>
          <p className="mt-4 leading-relaxed text-[#75635a]">
            Website ini kami hadirkan agar kamu bisa melihat koleksi, mengecek stok ukuran dan warna, serta bertanya kapan saja, semuanya di satu tempat.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/koleksi">Lihat koleksi <Icon name="arrow" size={18} /></Link>
            </Button>
            <Button variant="outline" onClick={() => openChat()}>
              <Icon name="sparkle" size={18} /> Tanya Halika
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-[1440px] px-[6vw] py-16 md:py-24">
          <p className="eyebrow mb-3">Yang kami jaga</p>
          <h2 className="mb-10 font-display text-3xl sm:text-[38px]">Kenapa berbelanja di Halika.Clo</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-ivory p-7">
                <span className="grid size-11 place-items-center rounded-full bg-primary/15 text-rose-dark">
                  <Icon name={v.icon} size={20} />
                </span>
                <h3 className="mt-5 font-display text-xl">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#75635a]">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(links.shopee || links.whatsapp) && (
        <section className="mx-auto max-w-[1440px] px-[6vw] py-16 text-center md:py-20">
          <p className="eyebrow mb-3">Belanja & hubungi kami</p>
          <h2 className="font-display text-3xl">Temukan kami juga di sini</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {links.shopee && (
              <Button asChild variant="shopee" size="lg">
                <a href={links.shopee} target="_blank" rel="noopener noreferrer"><Icon name="bag" /> Shopee</a>
              </Button>
            )}
            {links.whatsapp && (
              <Button asChild variant="whatsapp" size="lg">
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="message" /> WhatsApp</a>
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}