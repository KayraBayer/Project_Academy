import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const db = getFirestore();
const auth = getAuth();
const allowedTestGrades = [5, 6, 7, 8];
const callableOptions = { cors: true };

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || 'admin@mail.com,erdincbayer@hotmail.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}

function requireAdmin(request) {
  const token = request.auth?.token;
  const email = token?.email || '';
  if (!request.auth || (!token?.admin && token?.role !== 'admin' && !adminEmails().includes(email.toLowerCase()))) {
    throw new HttpsError('permission-denied', 'Bu işlem için admin yetkisi gerekir.');
  }
}

function cleanString(value) {
  return String(value || '').trim();
}

function resourcePath(collectionName, docId) {
  if (!collectionName || !docId) throw new HttpsError('invalid-argument', 'Kaynak kimliği geçersiz.');
  return db.collection(collectionName).doc(docId);
}

function validateCollectionName(collectionName) {
  if (!collectionName || collectionName.includes('/')) {
    throw new HttpsError('invalid-argument', 'Yayıncı adı boş olamaz ve / karakteri içeremez.');
  }
}

function parseResourceId(id) {
  const value = String(id || '');
  const separatorIndex = value.lastIndexOf('__');
  return {
    collectionName: separatorIndex >= 0 ? decodeURIComponent(value.slice(0, separatorIndex)) : '',
    docId: separatorIndex >= 0 ? decodeURIComponent(value.slice(separatorIndex + 2)) : '',
  };
}

async function deleteCollectionIfExists(collectionName) {
  if (!collectionName) return;
  const ref = db.collection(collectionName);
  await db.recursiveDelete(ref);
}

function makeAssignmentId(collectionName, docId) {
  return `${encodeURIComponent(collectionName)}__${encodeURIComponent(docId)}`;
}

function normalizeAnswer(value) {
  const answer = cleanString(value).toLocaleUpperCase('tr-TR');
  return ['A', 'B', 'C', 'D'].includes(answer) ? answer : '';
}

function normalizeAnswerKey(value) {
  return cleanString(value)
    .toLocaleUpperCase('tr-TR')
    .replace(/[^ABCD]/g, '')
    .split('');
}

function makeScoring(answersArray, answerKey) {
  const key = normalizeAnswerKey(answerKey);
  const compared = Math.min(answersArray.length, key.length);
  if (!compared) return null;

  const correctQuestions = [];
  const wrongQuestions = [];
  const blankQuestions = [];

  for (let index = 0; index < compared; index += 1) {
    const questionNumber = index + 1;
    const answer = normalizeAnswer(answersArray[index]);
    if (!answer) {
      blankQuestions.push(questionNumber);
    } else if (answer === key[index]) {
      correctQuestions.push(questionNumber);
    } else {
      wrongQuestions.push(questionNumber);
    }
  }

  return {
    status: 'ok',
    answerKey: key.join(''),
    keyLength: key.length,
    compared,
    correctCount: correctQuestions.length,
    wrongCount: wrongQuestions.length,
    blankCount: blankQuestions.length,
    correctQuestions,
    wrongQuestions,
    blankQuestions,
  };
}

function scoreFromScoring(scoring, count) {
  if (!scoring || typeof scoring.correctCount !== 'number') return null;
  const total = Number(count || scoring.compared || scoring.keyLength || 0);
  if (!total) return null;
  return Math.round((scoring.correctCount / total) * 100);
}

function istanbulDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const createAccount = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const data = request.data || {};
  const email = cleanString(data.email).toLowerCase();
  const password = String(data.password || '');
  const name = cleanString(data.name);
  const role = data.role === 'admin' ? 'admin' : 'student';
  const status = ['active', 'passive', 'suspended'].includes(data.status) ? data.status : 'active';
  const gradeLevel = cleanString(data.gradeLevel);

  if (!email || !password || password.length < 6 || !name) {
    throw new HttpsError('invalid-argument', 'Ad, e-posta ve en az 6 karakter şifre zorunludur.');
  }

  const userRecord = await auth.createUser({
    email,
    password,
    displayName: name,
    disabled: status !== 'active',
  });
  try {
    await auth.setCustomUserClaims(userRecord.uid, { role, admin: role === 'admin' });

    const commonProfile = {
      uid: userRecord.uid,
      name,
      email,
      role,
      status,
      gradeLevel,
      profilePhotoURL: null,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: null,
    };

    await db.collection('users').doc(userRecord.uid).set(commonProfile, { merge: true });

    if (role === 'student') {
      const { firstName, lastName } = splitName(name);
      const fullname = slugName(name);
      await db.collection('students').doc(userRecord.uid).set(
        {
          firstName,
          lastName,
          email,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await db.collection('ogrenciAdlari').doc(userRecord.uid).set({ fullname }, { merge: true });
    }
  } catch (error) {
    await auth.deleteUser(userRecord.uid).catch(() => {});
    throw error;
  }

  return { uid: userRecord.uid };
});

export const updateAccount = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const data = request.data || {};
  const uid = cleanString(data.uid);
  if (!uid) throw new HttpsError('invalid-argument', 'UID zorunludur.');

  const existingUser = await auth.getUser(uid);
  const name = cleanString(data.name || existingUser.displayName || '');
  const role = data.role ? (data.role === 'admin' ? 'admin' : 'student') : existingUser.customClaims?.admin ? 'admin' : 'student';
  const status = ['active', 'passive', 'suspended'].includes(data.status)
    ? data.status
    : existingUser.disabled
      ? 'suspended'
      : 'active';
  const gradeLevel = cleanString(data.gradeLevel);

  await auth.updateUser(uid, {
    displayName: name || undefined,
    disabled: status !== 'active',
  });
  await auth.setCustomUserClaims(uid, { role, admin: role === 'admin' });

  await db.collection('users').doc(uid).set(
    {
      uid,
      name: name || existingUser.displayName || '',
      email: existingUser.email || '',
      role,
      status,
      gradeLevel,
      profilePhotoURL: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (role === 'student') {
    const { firstName, lastName } = splitName(name || existingUser.displayName || '');
    await db.collection('students').doc(uid).set(
      {
        firstName,
        lastName,
        email: existingUser.email || '',
      },
      { merge: true },
    );
    await db.collection('ogrenciAdlari').doc(uid).set({ fullname: slugName(name || existingUser.displayName || '') }, { merge: true });
  } else {
    await Promise.all([db.collection('students').doc(uid).delete(), db.collection('ogrenciAdlari').doc(uid).delete()]);
  }

  return { uid };
});

export const deleteAccount = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const uid = cleanString(request.data?.uid);
  if (!uid) throw new HttpsError('invalid-argument', 'UID zorunludur.');

  const nameSnapshot = await db.collection('ogrenciAdlari').doc(uid).get();
  const fullname = nameSnapshot.exists ? nameSnapshot.data()?.fullname : null;

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  await Promise.all([
    db.collection('users').doc(uid).delete(),
    db.collection('students').doc(uid).delete(),
    db.collection('ogrenciAdlari').doc(uid).delete(),
  ]);

  if (fullname) {
    await Promise.all([deleteCollectionIfExists(fullname), deleteCollectionIfExists(`${fullname}_odevler`)]);
  }

  return { uid, deleted: true };
});

export const listAccounts = onCall(callableOptions, async (request) => {
  requireAdmin(request);

  const [authUsers, usersSnapshot, studentsSnapshot, namesSnapshot] = await Promise.all([
    auth.listUsers(1000),
    db.collection('users').get(),
    db.collection('students').get(),
    db.collection('ogrenciAdlari').get(),
  ]);

  const usersMap = new Map(usersSnapshot.docs.map((item) => [item.id, item.data()]));
  const studentsMap = new Map(studentsSnapshot.docs.map((item) => [item.id, item.data()]));
  const namesMap = new Map(namesSnapshot.docs.map((item) => [item.id, item.data()]));

  return authUsers.users.map((user) => {
    const profile = usersMap.get(user.uid) || {};
    const student = studentsMap.get(user.uid) || {};
    const nameDoc = namesMap.get(user.uid) || {};
    const role =
      user.customClaims?.admin || profile.role === 'admin'
        ? 'admin'
        : user.customClaims?.role || profile.role || 'student';
    const displayName =
      profile.name ||
      user.displayName ||
      `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
      nameDoc.fullname ||
      user.email ||
      user.uid;

    return {
      uid: user.uid,
      id: user.uid,
      name: displayName,
      email: user.email || profile.email || student.email || '',
      role,
      status: user.disabled ? 'suspended' : profile.status || 'active',
      gradeLevel: profile.gradeLevel || '',
      profilePhotoURL: profile.profilePhotoURL || null,
      createdAt: user.metadata.creationTime || null,
      lastLoginAt: user.metadata.lastSignInTime || profile.lastLoginAt || null,
      fullname: nameDoc.fullname || '',
    };
  });
});

export const recordLogin = onCall(callableOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Oturum gerekli.');

  const uid = request.auth.uid;
  const email = cleanString(request.auth.token?.email).toLowerCase();
  const userRef = db.collection('users').doc(uid);
  const [userSnapshot, nameSnapshot] = await Promise.all([
    userRef.get(),
    db.collection('ogrenciAdlari').doc(uid).get(),
  ]);

  const existing = userSnapshot.exists ? userSnapshot.data() : {};
  const role = existing.role || (adminEmails().includes(email) ? 'admin' : 'student');
  const name =
    cleanString(existing.name) ||
    cleanString(request.auth.token?.name) ||
    cleanString(nameSnapshot.data()?.fullname).replace(/_/g, ' ') ||
    email.split('@')[0] ||
    uid;
  const now = FieldValue.serverTimestamp();

  await userRef.set(
    {
      uid,
      name,
      email: email || existing.email || '',
      role,
      status: existing.status || 'active',
      gradeLevel: existing.gradeLevel || '',
      profilePhotoURL: existing.profilePhotoURL || null,
      createdAt: existing.createdAt || now,
      lastLoginAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  if (role === 'student') {
    await db.collection('students').doc(uid).set(
      {
        email: email || existing.email || '',
        lastLoginAt: now,
      },
      { merge: true },
    );
  }

  await db.collection('loginEvents').add({
    userId: uid,
    email: email || existing.email || '',
    role,
    createdAt: now,
    dateKey: istanbulDateKey(),
  });

  return { uid, lastLoginAt: new Date().toISOString() };
});

export const createTest = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const data = request.data || {};
  const collectionName = cleanString(data.sourceCollection || data.publisher);
  const name = cleanString(data.title || data.name);
  const link = cleanString(data.link || data.externalLink);
  const grade = Number(data.grade);
  const questionCount = Number(data.questionCount);
  const answerKey = cleanString(data.answerKey).toLocaleUpperCase('tr-TR');

  validateCollectionName(collectionName);

  if (!collectionName || !name || !link || !allowedTestGrades.includes(grade) || !questionCount) {
    throw new HttpsError('invalid-argument', 'Koleksiyon, test adı, link, 5-8 arası sınıf ve soru sayısı zorunludur.');
  }

  const ref = db.collection(collectionName).doc();
  const testId = `${collectionName}::${ref.id}`;
  await ref.set({
    id: ref.id,
    testId,
    uniqueId: testId,
    sourceCollection: collectionName,
    name,
    type: 'yayın',
    questionCount,
    link,
    grade,
    answerKey,
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('ozelKategoriler').doc(collectionName).set({ name: collectionName }, { merge: true });
  return { id: ref.id, testId, uniqueId: testId };
});

export const createPublisher = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const name = cleanString(request.data?.name).toLocaleUpperCase('tr-TR');
  validateCollectionName(name);

  await db.collection('ozelKategoriler').doc(name).set(
    {
      name,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    },
    { merge: true },
  );

  return { name };
});

export const updateTest = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const data = request.data || {};
  const { collectionName, docId } = parseResourceId(data.id);
  const grade = Number(data.grade);
  const questionCount = Number(data.questionCount);

  if (!allowedTestGrades.includes(grade) || !questionCount) {
    throw new HttpsError('invalid-argument', 'Sınıf 5-8 arasında olmalı ve soru sayısı girilmelidir.');
  }

  const ref = resourcePath(collectionName, docId);

  await ref.update({
    name: cleanString(data.title || data.name),
    link: cleanString(data.link || data.externalLink),
    grade,
    questionCount,
    answerKey: cleanString(data.answerKey).toLocaleUpperCase('tr-TR'),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: docId, testId: `${collectionName}::${docId}` };
});

export const deleteTest = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const { collectionName, docId } = parseResourceId(request.data?.id);
  await resourcePath(collectionName, docId).delete();
  return { id: docId, deleted: true };
});

export const assignHomework = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const data = request.data || {};
  const studentIds = Array.isArray(data.studentIds) ? data.studentIds.map(cleanString).filter(Boolean) : [];
  const { collectionName, docId } = parseResourceId(data.resourceId);

  if (studentIds.length === 0) throw new HttpsError('invalid-argument', 'En az bir öğrenci seçilmelidir.');

  const resourceSnapshot = await resourcePath(collectionName, docId).get();
  if (!resourceSnapshot.exists) throw new HttpsError('not-found', 'Test bulunamadı.');

  const resource = resourceSnapshot.data() || {};
  const assignmentId = makeAssignmentId(collectionName, docId);
  const assignedAt = FieldValue.serverTimestamp();
  const batch = db.batch();
  const missingStudents = [];

  const nameSnapshots = await Promise.all(studentIds.map((studentId) => db.collection('ogrenciAdlari').doc(studentId).get()));

  nameSnapshots.forEach((nameSnapshot, index) => {
    const studentId = studentIds[index];
    const fullname = nameSnapshot.exists ? cleanString(nameSnapshot.data()?.fullname) : '';
    if (!fullname) {
      missingStudents.push(studentId);
      return;
    }

    const ref = db.collection(`${fullname}_odevler`).doc(assignmentId);
    batch.set(
      ref,
      {
        studentId,
        status: 'assigned',
        assigned: false,
        assignedAt,
        assignedBy: request.auth.uid,
        test: {
          id: docId,
          testId: resource.testId || `${collectionName}::${docId}`,
          uniqueId: resource.uniqueId || `${collectionName}::${docId}`,
          category: collectionName,
          name: resource.name || docId,
          link: resource.link || '',
          questionCount: resource.questionCount || 0,
          grade: resource.grade || null,
          answerKey: resource.answerKey || '',
        },
      },
      { merge: true },
    );
  });

  await batch.commit();
  return { assignedCount: studentIds.length - missingStudents.length, missingStudents };
});

export const submitTestAnswers = onCall(callableOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Oturum gerekli.');

  const uid = request.auth.uid;
  const { collectionName, docId } = parseResourceId(request.data?.resourceId);
  if (!collectionName || !docId) throw new HttpsError('invalid-argument', 'Test kimliği geçersiz.');

  const resourceSnapshot = await resourcePath(collectionName, docId).get();
  if (!resourceSnapshot.exists) throw new HttpsError('not-found', 'Test bulunamadı.');

  const nameSnapshot = await db.collection('ogrenciAdlari').doc(uid).get();
  let fullname = nameSnapshot.exists ? cleanString(nameSnapshot.data()?.fullname) : '';
  if (!fullname) {
    const userSnapshot = await db.collection('users').doc(uid).get();
    const user = userSnapshot.exists ? userSnapshot.data() : {};
    fullname = slugName(user.name || request.auth.token?.name || request.auth.token?.email?.split('@')[0] || '');
  }
  if (!fullname) throw new HttpsError('failed-precondition', 'Öğrenci ilerleme koleksiyonu bulunamadı.');

  const resource = resourceSnapshot.data() || {};
  const questionCount = Number(resource.questionCount || normalizeAnswerKey(resource.answerKey).length || 0);
  if (!questionCount) throw new HttpsError('failed-precondition', 'Bu test için soru sayısı tanımlı değil.');

  const answerInput = request.data?.answers || {};
  const answersArray = Array.from({ length: questionCount }, (_, index) => normalizeAnswer(answerInput[index + 1] || answerInput[String(index + 1)]));
  const answersMap = answersArray.reduce((acc, answer, index) => {
    if (answer) acc[String(index + 1)] = answer;
    return acc;
  }, {});
  const answeredCount = Object.keys(answersMap).length;
  if (!answeredCount) throw new HttpsError('invalid-argument', 'Kaydetmek için en az bir cevap girin.');

  const scoring = makeScoring(answersArray, resource.answerKey);
  const now = FieldValue.serverTimestamp();
  const progressRef = db.collection(fullname).doc();
  const assignmentRef = db.collection(`${fullname}_odevler`).doc(makeAssignmentId(collectionName, docId));
  const payload = {
    type: 'submission',
    studentId: uid,
    resourceId: request.data.resourceId,
    status: 'completed',
    category: collectionName,
    test: {
      id: docId,
      testId: resource.testId || `${collectionName}::${docId}`,
      uniqueId: resource.uniqueId || `${collectionName}::${docId}`,
      category: collectionName,
      name: resource.name || docId,
      link: resource.link || '',
      grade: resource.grade || null,
      questionCount,
    },
    answers: answersArray.map((answer) => answer || '-').join(''),
    answersMap,
    answersArray,
    answeredCount,
    count: questionCount,
    scoring,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await progressRef.set(payload);

  const assignmentSnapshot = await assignmentRef.get();
  if (assignmentSnapshot.exists) {
    await assignmentRef.set(
      {
        status: 'completed',
        assigned: false,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const completedAt = new Date().toISOString();
  return {
    id: progressRef.id,
    studentId: uid,
    resourceId: request.data.resourceId,
    sourceCollection: collectionName,
    sourceDocId: docId,
    resourceTitle: resource.name || docId,
    resourceLink: resource.link || '',
    category: collectionName,
    status: 'completed',
    score: scoreFromScoring(scoring, questionCount),
    scoring,
    answers: payload.answers,
    answersMap,
    answersArray,
    answeredCount,
    questionCount,
    completedAt,
    updatedAt: completedAt,
    createdAt: completedAt,
    progressCollection: fullname,
    legacyType: 'submission',
  };
});
