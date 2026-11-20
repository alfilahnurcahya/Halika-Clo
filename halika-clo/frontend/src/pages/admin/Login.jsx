import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/feedback';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Icon } from '@/lib/icons';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email wajib diisi.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email tidak valid.';
    if (!form.password) e.password = 'Password wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const u = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Selamat datang, ${u.name}!`);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Login gagal.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-brown md:block">
        <img src="https://images.unsplash.com/photo-1604300834574-252c0c25d1c1?auto=format&fit=crop&w=1200&q=80" alt="" className="photo h-full w-full object-cover opacity-60" />
        <div className="absolute bottom-12 left-12 max-w-sm text-white">
          <p className="font-display text-4xl leading-tight">Kelola stok di satu tempat.</p>
          <p className="mt-3 text-sm text-white/80">Perubahan stok langsung tampil di katalog dan jawaban Halika Assistant.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-ivory px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm" noValidate>
          <Link to="/" className="mb-10 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <Icon name="arrowLeft" size={16} /> Kembali ke toko
          </Link>
          <p className="eyebrow mb-2 text-primary">Admin Halika.Clo</p>
          <h1 className="font-display text-4xl">Masuk</h1>
          <p className="mt-2 text-sm text-muted-foreground">Khusus owner & co-owner.</p>

          {serverError && (
            <Alert variant="destructive" className="mt-6">
              <Icon name="alert" size={18} />
              <AlertDescription className="mt-0">{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" value={form.email} aria-invalid={Boolean(errors.email)}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password}
                aria-invalid={Boolean(errors.password)} className="pr-11"
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <Button type="submit" size="lg" className="mt-7 w-full" disabled={loading}>
            {loading ? <><Spinner /> Memproses...</> : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
}
