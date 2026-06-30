import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/firebase';

function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uploadFile(file, folder = 'resources') {
  if (!file) return '';

  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function deleteFileByURL(url) {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return false;

  try {
    await deleteObject(ref(storage, url));
    return true;
  } catch (error) {
    console.warn('Storage dosyası silinemedi:', error);
    return false;
  }
}
