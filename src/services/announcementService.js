import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const announcementsRef = collection(db, 'announcements');

function normalizeAnnouncement(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const left = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    const right = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    return left - right;
  });
}

export async function getAnnouncements(filters = {}) {
  const snapshot = await getDocs(announcementsRef);
  let announcements = snapshot.docs.map(normalizeAnnouncement);

  if (filters.activeOnly) {
    announcements = announcements.filter((item) => item.isActive);
  }

  return sortNewest(announcements);
}

export async function createAnnouncement(payload) {
  return addDoc(announcementsRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function updateAnnouncement(id, payload) {
  return updateDoc(doc(db, 'announcements', id), payload);
}

export async function deleteAnnouncement(id) {
  return deleteDoc(doc(db, 'announcements', id));
}
