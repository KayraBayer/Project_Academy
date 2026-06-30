import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const notificationsRef = collection(db, 'adminNotifications');

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const left = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    const right = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    return left - right;
  });
}

export async function getAdminNotifications() {
  const snapshot = await getDocs(notificationsRef);
  return sortNewest(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
}

export async function markNotificationRead(id) {
  return updateDoc(doc(db, 'adminNotifications', id), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(ids = []) {
  return Promise.all(ids.map((id) => markNotificationRead(id)));
}

export async function deleteNotification(id) {
  return deleteDoc(doc(db, 'adminNotifications', id));
}
