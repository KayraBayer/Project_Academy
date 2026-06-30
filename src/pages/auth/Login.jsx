import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../../components/common/BrandLogo';
import Button from '../../components/common/Button';
import InteractiveMathTokens from '../../components/common/InteractiveMathTokens';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SpacetimeBackground from '../../components/common/SpacetimeBackground';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

const backgroundTokens = [
  { text: 'x²', left: '7%', top: '12%', x: '18px', y: '-18px', rotate: '-7deg', delay: '0s' },
  { text: '√64', left: '78%', top: '13%', x: '-16px', y: '20px', rotate: '6deg', delay: '0.4s' },
  { text: '5-8', left: '13%', top: '76%', x: '14px', y: '18px', rotate: '5deg', delay: '0.8s' },
  { text: 'π', left: '82%', top: '78%', x: '-20px', y: '-16px', rotate: '-5deg', delay: '1.1s' },
  { text: '3/4', left: '20%', top: '28%', x: '16px', y: '-22px', rotate: '8deg', delay: '1.5s', small: true },
  { text: 'Δ', left: '68%', top: '32%', x: '-18px', y: '-14px', rotate: '-8deg', delay: '1.9s', small: true },
  { text: '12×7', left: '4%', top: '48%', x: '22px', y: '12px', rotate: '4deg', delay: '2.3s' },
  { text: '∑', left: '91%', top: '44%', x: '-24px', y: '18px', rotate: '9deg', delay: '2.7s' },
  { text: 'a+b', left: '31%', top: '82%', x: '16px', y: '-18px', rotate: '-6deg', delay: '3.1s', small: true },
  { text: '90°', left: '57%', top: '83%', x: '-16px', y: '-20px', rotate: '7deg', delay: '3.5s', small: true },
  { text: '2⁵', left: '42%', top: '14%', x: '12px', y: '20px', rotate: '-4deg', delay: '3.9s', small: true },
  { text: 'EB', left: '46%', top: '68%', x: '-12px', y: '-18px', rotate: '5deg', delay: '4.3s' },
  { text: '%', left: '25%', top: '56%', x: '18px', y: '16px', rotate: '-9deg', delay: '4.7s', small: true },
  { text: '8.s', left: '73%', top: '58%', x: '-20px', y: '-12px', rotate: '5deg', delay: '5.1s', small: true },
];

const loginInputClass =
  '!border-white !bg-white text-ink shadow-[0_18px_42px_-24px_rgba(47,128,237,0.55)] ring-1 ring-primary/12 placeholder:text-outline/80 focus:!border-primary/50 focus:!bg-white focus:ring-primary/20 dark:!border-blue-100 dark:!bg-white dark:text-ink dark:placeholder:text-outline dark:focus:!bg-white';

export default function Login() {
  const { login, currentUser, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function landingPathFor(profile, target) {
    if (profile.role === 'admin') return target?.startsWith('/admin') ? target : '/admin';
    return target?.startsWith('/admin') ? '/dashboard' : target || '/dashboard';
  }

  useEffect(() => {
    if (!loading && currentUser && role) {
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate, role]);

  function validate() {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'E-posta adresi zorunludur.';
    if (!password) nextErrors.password = 'Şifre zorunludur.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const profile = await login(email.trim(), password);
      toast.success('Giriş yapıldı.');
      const target = location.state?.from?.pathname;
      navigate(landingPathFor(profile, target), { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface dark:bg-dark-bg">
        <LoadingSpinner label="Oturum hazırlanıyor" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef6ff] dark:bg-dark-bg">
      <div className="auth-pattern" />
      <SpacetimeBackground />
      <InteractiveMathTokens tokens={backgroundTokens} />

      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle />
      </div>

      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <section className="animate-pop w-full max-w-md p-7 sm:p-8">
          <BrandLogo className="mx-auto mb-8 h-28 w-full max-w-[320px]" imageClassName="object-center" />
          <form className="stagger-grid space-y-4" onSubmit={handleSubmit}>
            <Input
              label="E-posta Adresi"
              icon={Mail}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ogrenci@erdincbayer.com"
              error={errors.email}
              inputClassName={loginInputClass}
            />
            <div className="relative">
              <Input
                label="Şifre"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                error={errors.password}
                inputClassName={`pr-12 ${loginInputClass}`}
              />
              <button
                type="button"
                className="absolute right-3 top-10 text-outline hover:text-primary"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Şifre görünürlüğünü değiştir"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Oturumu Aç
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
