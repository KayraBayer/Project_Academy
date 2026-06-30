import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('E-posta adresi girin.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      toast.success('Şifre sıfırlama e-postası gönderildi.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#eef6ff] px-4 py-10 dark:bg-dark-bg">
      <div className="auth-pattern" />
      <div className="pointer-events-none absolute inset-0">
        <span className="auth-token left-[10%] top-[18%]" style={{ '--x': '18px', '--y': '-18px', '--rotate': '-7deg' }}>
          EB
        </span>
        <span className="auth-token right-[14%] top-[22%]" style={{ '--x': '-16px', '--y': '20px', '--rotate': '6deg' }}>
          √
        </span>
        <span className="auth-token bottom-[18%] left-[18%]" style={{ '--x': '14px', '--y': '18px', '--rotate': '5deg' }}>
          x²
        </span>
      </div>

      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle />
      </div>

      <main className="animate-pop relative z-10 w-full max-w-md rounded-2xl border border-white/70 bg-white/90 p-8 shadow-soft backdrop-blur-xl dark:border-dark-border/80 dark:bg-dark-card/90">
        <div className="animate-rise mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-black tracking-wide text-white shadow-soft">
            EB
          </div>
          <p className="text-sm font-bold uppercase text-primary dark:text-primary-muted">Erdinç Bayer Akademi</p>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Şifre Sıfırlama</h1>
          <p className="mt-2 text-sm text-muted dark:text-dark-muted">
            Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısını gönderelim.
          </p>
        </div>

        <form className="stagger-grid space-y-5" onSubmit={handleSubmit}>
          <Input
            label="E-posta Adresi"
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ogrenci@erdincbayer.com"
          />
          <Button type="submit" loading={submitting} className="w-full">
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>

        <Link
          to="/login"
          className="animate-rise mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline dark:text-primary-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Giriş sayfasına dön
        </Link>
      </main>
    </div>
  );
}
