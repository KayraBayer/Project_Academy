/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  getIdTokenResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { callRecordLogin } from '../services/adminFunctionService';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext(null);

function authErrorMessage(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (code.includes('permission-denied')) return 'Kullanıcı profilinize erişilemiyor. Lütfen yönetici ile iletişime geçin.';
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return 'Verilere şu anda ulaşılamıyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
  }
  if (code.includes('network-request-failed')) return 'Ağ bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
  if (code.includes('too-many-requests')) return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
  if (code.includes('invalid-email')) return 'Geçerli bir e-posta adresi girin.';
  return error?.message || 'İşlem tamamlanamadı.';
}

async function getTokenRole(user, forceRefresh = false) {
  try {
    const token = await getIdTokenResult(user, forceRefresh);
    if (token.claims?.admin === true || token.claims?.role === 'admin') return 'admin';
    if (token.claims?.role === 'student') return 'student';
  } catch (error) {
    console.warn('Yetki bilgisi token üzerinden okunamadı, profil rolü kullanılacak:', error);
  }

  return null;
}

async function getResolvedUserProfile(user, forceTokenRefresh = false) {
  const [profile, tokenRole] = await Promise.all([
    getUserProfile(user.uid, user),
    getTokenRole(user, forceTokenRefresh),
  ]);

  if (!profile) return null;

  const role = tokenRole === 'admin' || profile.role === 'admin'
    ? 'admin'
    : tokenRole || profile.role || 'student';

  return {
    ...profile,
    role,
    tokenRole,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    async function watchAuth() {
      await setPersistence(auth, browserLocalPersistence);
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        setCurrentUser(user);

        if (!user) {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        try {
          const profile = await getResolvedUserProfile(user);
          if (!profile || profile.status !== 'active') {
            await signOut(auth);
            setUserProfile(null);
            return;
          }
          setUserProfile(profile);
        } catch (error) {
          console.error('Kullanıcı profili alınamadı:', error);
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      });
    }

    watchAuth().catch((error) => {
      console.error('Oturum kalıcılığı hazırlanamadı:', error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getResolvedUserProfile(credential.user, true);

      if (!profile) {
        await signOut(auth);
        throw new Error('Bu kullanıcı için profil kaydı bulunamadı.');
      }

      if (profile.status !== 'active') {
        await signOut(auth);
        throw new Error('Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.');
      }

      const loginRecord = await callRecordLogin().catch((error) => {
        console.warn('Son giriş bilgisi kaydedilemedi:', error);
        return null;
      });
      const lastLoginAt = loginRecord?.lastLoginAt || new Date();

      setCurrentUser(credential.user);
      setUserProfile({ ...profile, lastLoginAt });
      return { ...profile, lastLoginAt };
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      role: userProfile?.role || null,
      loading,
      login,
      logout,
      resetPassword,
      isActive: userProfile?.status === 'active',
    }),
    [currentUser, userProfile, loading, login, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalıdır.');
  return context;
}
