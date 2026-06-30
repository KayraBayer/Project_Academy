import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { callCreateAccount, callDeleteAccount, callListAccounts, callUpdateAccount } from './adminFunctionService';

function normalizeUser(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function displayNameFromSlug(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR'))
    .join(' ');
}

function slugName(name) {
  return String(name || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function adminEmails() {
  return String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLocaleLowerCase('tr-TR'))
    .filter(Boolean);
}

function isAdminEmail(email) {
  return Boolean(email && adminEmails().includes(email.toLocaleLowerCase('tr-TR')));
}

function normalizeListedUser(user) {
  return {
    ...user,
    role: isAdminEmail(user.email) || user.role === 'admin' ? 'admin' : user.role || 'student',
  };
}

function isStudentAccount(user) {
  return user.role === 'student' && !isAdminEmail(user.email);
}

function adminFallbackProfile(uid, authUser) {
  return {
    id: uid,
    uid,
    name: authUser?.email?.split('@')[0] || 'Admin',
    email: authUser?.email || '',
    role: 'admin',
    status: 'active',
    createdAt: null,
    lastLoginAt: null,
    gradeLevel: '',
    profilePhotoURL: null,
    legacyProfile: true,
    adminFallback: true,
  };
}

export async function getUserProfile(uid, authUser = null) {
  const [snapshot, legacySnapshot] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'ogrenciAdlari', uid)),
  ]);

  if (snapshot.exists()) {
    const profile = normalizeUser(snapshot);
    const legacy = legacySnapshot.exists() ? legacySnapshot.data() : null;
    const isAdmin = isAdminEmail(authUser?.email || profile.email);
    const derivedFullname =
      legacy?.fullname ||
      profile.fullname ||
      (profile.role === 'student' ? slugName(profile.name || authUser?.displayName || profile.email?.split('@')[0]) : '');
    return {
      ...profile,
      role: isAdmin || profile.role === 'admin' ? 'admin' : profile.role || 'student',
      fullname: derivedFullname,
      progressCollection: derivedFullname || profile.progressCollection || '',
    };
  }

  if (!legacySnapshot.exists()) {
    return isAdminEmail(authUser?.email) ? adminFallbackProfile(uid, authUser) : null;
  }

  const legacy = legacySnapshot.data();
  const isAdmin = isAdminEmail(authUser?.email);
  return {
    id: uid,
    uid,
    name: displayNameFromSlug(legacy.fullname) || authUser?.email || 'Öğrenci',
    email: authUser?.email || '',
    role: isAdmin ? 'admin' : 'student',
    status: 'active',
    createdAt: null,
    lastLoginAt: null,
    gradeLevel: '',
    profilePhotoURL: null,
    fullname: legacy.fullname,
    progressCollection: legacy.fullname,
    legacyProfile: true,
    adminFallback: isAdmin,
  };
}

export async function getAllUsers() {
  try {
    const accounts = await callListAccounts();
    return accounts
      .map(normalizeListedUser)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
  } catch (error) {
    console.warn('Cloud Functions hesap listesi okunamadı, Firestore fallback kullanılacak:', error);
  }

  try {
    const snapshot = await getDocs(collection(db, 'students'));
    return snapshot.docs
      .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          uid: item.id,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || item.id,
          email: data.email || '',
          role: 'student',
          status: 'active',
          createdAt: data.createdAt || null,
          lastLoginAt: null,
          gradeLevel: '',
          profilePhotoURL: null,
          legacyProfile: true,
        };
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
  } catch (error) {
    console.warn('students koleksiyonu okunamadı, ogrenciAdlari kullanılacak:', error);
    const snapshot = await getDocs(collection(db, 'ogrenciAdlari'));
    return snapshot.docs
      .filter((item) => item.id !== '_index')
      .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          uid: item.id,
          name: displayNameFromSlug(data.fullname) || item.id,
          email: '',
          role: 'student',
          status: 'active',
          createdAt: null,
          lastLoginAt: null,
          gradeLevel: '',
          profilePhotoURL: null,
          fullname: data.fullname,
          progressCollection: data.fullname,
          legacyProfile: true,
        };
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
  }
}

export async function getStudents() {
  const users = await getAllUsers();
  return users.filter(isStudentAccount);
}

export async function updateUserProfile(uid, payload) {
  return callUpdateAccount({ uid, ...payload });
}

export async function deleteUserProfile(uid) {
  return callDeleteAccount(uid);
}

export async function createStudentProfile(payload) {
  return callCreateAccount(payload);
}

export async function sendAccountPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}
