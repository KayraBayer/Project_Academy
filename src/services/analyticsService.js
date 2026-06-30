import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function getLoginEvents() {
  try {
    const snapshot = await getDocs(collection(db, 'loginEvents'));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.warn('Giriş geçmişi okunamadı:', error);
    return [];
  }
}
