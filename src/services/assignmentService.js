import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { getResourceById, parseResourceId } from './resourceService';

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

async function getStudentAssignmentCollection(studentId) {
  const snapshot = await getDoc(doc(db, 'ogrenciAdlari', studentId));
  const fullname = snapshot.exists() ? snapshot.data()?.fullname : '';
  if (fullname) return `${fullname}_odevler`;

  const [userSnapshot, studentSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', studentId)),
    getDoc(doc(db, 'students', studentId)),
  ]);
  const user = userSnapshot.exists() ? userSnapshot.data() : {};
  const student = studentSnapshot.exists() ? studentSnapshot.data() : {};
  const derivedName = user.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || user.email?.split('@')[0] || '';
  const derivedFullname = slugName(derivedName);
  return derivedFullname ? `${derivedFullname}_odevler` : '';
}

export async function assignHomework({ resourceId, studentIds = [] }) {
  const resource = await getResourceById(resourceId);
  if (!resource) throw new Error('Test bulunamadı.');

  const students = await Promise.all(
    studentIds.map(async (studentId) => ({
      studentId,
      collectionName: await getStudentAssignmentCollection(studentId),
    })),
  );

  const assignableStudents = students.filter((student) => student.collectionName);
  if (assignableStudents.length === 0) throw new Error('Ödev atanabilecek öğrenci bulunamadı.');

  const { collectionName, docId } = parseResourceId(resourceId);
  const batch = writeBatch(db);

  assignableStudents.forEach((student) => {
    batch.set(
      doc(db, student.collectionName, resourceId),
      {
        studentId: student.studentId,
        status: 'assigned',
        assigned: false,
        assignedAt: serverTimestamp(),
        assignedBy: auth.currentUser?.uid || '',
        test: {
          id: docId,
          testId: resource.testId || `${collectionName}::${docId}`,
          uniqueId: resource.uniqueId || `${collectionName}::${docId}`,
          category: collectionName,
          name: resource.title,
          link: resource.link || resource.externalLink || '',
          questionCount: resource.questionCount || 0,
          grade: resource.grade || null,
          answerKey: resource.answerKey || '',
        },
      },
      { merge: true },
    );
  });

  await batch.commit();
  return {
    assignedCount: assignableStudents.length,
    missingStudents: students.filter((student) => !student.collectionName).map((student) => student.studentId),
  };
}
