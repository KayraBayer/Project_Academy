import { collection, getDocs } from 'firebase/firestore';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analyticsMeasurementId, db, getFirebaseAnalytics } from '../firebase/firebase';

function cleanAnalyticsParams(params = {}) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      acc[key] = value;
    } else if (value instanceof Date) {
      acc[key] = value.toISOString();
    }
    return acc;
  }, {});
}

export function isFirebaseAnalyticsConfigured() {
  return Boolean(analyticsMeasurementId);
}

export async function trackAnalyticsEvent(eventName, params = {}) {
  const analytics = await getFirebaseAnalytics();
  if (!analytics) return false;

  logEvent(analytics, eventName, cleanAnalyticsParams(params));
  return true;
}

export async function setAnalyticsIdentity(user, profile = null) {
  const analytics = await getFirebaseAnalytics();
  if (!analytics || !user?.uid) return false;

  setUserId(analytics, user.uid);
  setUserProperties(analytics, cleanAnalyticsParams({
    role: profile?.role || 'anonymous',
    status: profile?.status || '',
    grade_level: profile?.gradeLevel || '',
  }));
  return true;
}

export async function getLoginEvents() {
  try {
    const snapshot = await getDocs(collection(db, 'loginEvents'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.warn('Giriş geçmişi okunamadı:', error);
    return [];
  }
}
