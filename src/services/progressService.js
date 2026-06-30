import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { callSubmitTestAnswers } from './adminFunctionService';
import { deriveResourceCategory, makeResourceId } from './resourceService';
import { getUserProfile } from './userService';

function scoreFromScoring(scoring, count) {
  if (!scoring || typeof scoring.correctCount !== 'number') return null;
  const total = Number(count || scoring.compared || scoring.keyLength || 0);
  if (!total) return null;
  return Math.round((scoring.correctCount / total) * 100);
}

function hasObjectValues(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function hasArrayValues(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasAnswerPayload(data) {
  return Boolean(
    Number(data.answeredCount || 0) > 0 ||
      (typeof data.answers === 'string' && data.answers.trim()) ||
      hasObjectValues(data.answersMap) ||
      hasArrayValues(data.answersArray),
  );
}

function isCompletedStatus(status) {
  return ['completed', 'done', 'tamamlandi', 'tamamlandı'].includes(
    String(status || '').trim().toLocaleLowerCase('tr-TR'),
  );
}

export function isSolvedProgressItem(item) {
  return Boolean(
    isCompletedStatus(item.status) ||
      item.completedAt ||
      item.scoring ||
      Number(item.answeredCount || 0) > 0 ||
      item.hasAnswerPayload,
  );
}

export function progressItemKey(item) {
  if (item.resourceId) return item.resourceId;
  if (item.sourceCollection || item.sourceDocId) return `${item.sourceCollection || ''}::${item.sourceDocId || ''}`;
  return item.id;
}

function normalizeSubmission(snapshot, studentId, collectionName) {
  const data = snapshot.data();
  const test = data.test || {};
  const sourceCollection = test.category || '';
  const sourceDocId = test.id || '';
  const solved = Boolean(data.scoring || hasAnswerPayload(data) || isCompletedStatus(data.status));
  const status = solved ? 'completed' : 'in_progress';

  return {
    id: snapshot.id,
    studentId,
    resourceId: sourceDocId ? makeResourceId(sourceCollection, sourceDocId) : '',
    sourceCollection,
    sourceDocId,
    resourceTitle: test.name || '',
    resourceLink: test.link || '',
    category: deriveResourceCategory(sourceCollection, test.name),
    status,
    scoring: data.scoring || null,
    hasAnswerPayload: hasAnswerPayload(data),
    score: scoreFromScoring(data.scoring, data.count),
    answers: data.answers || '',
    answersMap: data.answersMap || {},
    answersArray: data.answersArray || [],
    completedAt: solved ? data.createdAt || null : null,
    updatedAt: data.createdAt || null,
    createdAt: data.createdAt || null,
    answeredCount: data.answeredCount || 0,
    questionCount: data.count || data.scoring?.keyLength || 0,
    correctCount: data.scoring?.correctCount ?? null,
    wrongCount: data.scoring?.wrongCount ?? null,
    blankCount: data.scoring?.blankCount ?? null,
    progressCollection: collectionName,
    legacyType: 'submission',
  };
}

function normalizeAssignment(snapshot, studentId, collectionName) {
  const data = snapshot.data();
  const test = data.test || {};
  const sourceCollection = test.category || '';
  const sourceDocId = test.id || '';

  const solved = Boolean(isCompletedStatus(data.status) || data.completedAt);

  return {
    id: snapshot.id,
    studentId,
    resourceId: sourceDocId ? makeResourceId(sourceCollection, sourceDocId) : '',
    sourceCollection,
    sourceDocId,
    resourceTitle: test.name || '',
    resourceLink: test.link || '',
    category: deriveResourceCategory(sourceCollection, test.name),
    status: solved ? 'completed' : 'in_progress',
    score: null,
    completedAt: data.completedAt || null,
    updatedAt: data.completedAt || data.assignedAt || null,
    createdAt: data.assignedAt || null,
    assignedAt: data.assignedAt || null,
    questionCount: test.questionCount || 0,
    progressCollection: collectionName,
    legacyType: 'assignment',
  };
}

async function getProgressCollectionName(studentId) {
  const profile = await getUserProfile(studentId);
  return profile?.progressCollection || profile?.fullname || null;
}

async function readCollectionSafe(name) {
  if (!name) return [];
  try {
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs;
  } catch (error) {
    console.warn(`${name} koleksiyonu okunamadı:`, error);
    return [];
  }
}

export async function getAllProgress() {
  return [];
}

export async function getProgressForStudent(studentId) {
  const progressCollection = await getProgressCollectionName(studentId);
  if (!progressCollection) return [];

  const [submissions, assignments] = await Promise.all([
    readCollectionSafe(progressCollection),
    readCollectionSafe(`${progressCollection}_odevler`),
  ]);

  return [
    ...submissions.map((item) => normalizeSubmission(item, studentId, progressCollection)),
    ...assignments.map((item) => normalizeAssignment(item, studentId, `${progressCollection}_odevler`)),
  ].sort((a, b) => {
    const left = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || 0;
    const right = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || 0;
    return left - right;
  });
}

export async function getAssignmentsForStudent(studentId) {
  const items = await getProgressForStudent(studentId);
  return items.filter((item) => item.legacyType === 'assignment');
}

export async function getSubmissionsForStudent(studentId) {
  const items = await getProgressForStudent(studentId);
  return items.filter((item) => item.legacyType === 'submission');
}

export async function getProgressByResource(studentId, resourceId, resource = null) {
  const items = await getProgressForStudent(studentId);
  return (
    items.find((item) => item.resourceId && item.resourceId === resourceId) ||
    items.find(
      (item) =>
        resource &&
        item.sourceCollection === resource.sourceCollection &&
        (item.sourceDocId === resource.sourceDocId ||
          item.resourceTitle === resource.title ||
          (item.resourceLink && item.resourceLink === resource.link)),
    ) ||
    null
  );
}

export async function saveProgress() {
  throw new Error('İlerleme kaydı şu anda otomatik olarak test cevaplarından güncelleniyor.');
}

export async function saveTestSubmission({ studentId, resource, answers }) {
  if (!studentId) throw new Error('Öğrenci oturumu bulunamadı.');
  if (!resource?.id) throw new Error('Test bilgisi bulunamadı.');

  const result = await callSubmitTestAnswers({
    resourceId: resource.id,
    answers,
  });

  return {
    id: result.id,
    studentId,
    resourceId: resource.id,
    sourceCollection: result.sourceCollection || resource.sourceCollection,
    sourceDocId: result.sourceDocId || resource.sourceDocId,
    resourceTitle: resource.title || result.resourceTitle,
    resourceLink: resource.link || resource.externalLink || resource.fileURL || '',
    category: result.category || deriveResourceCategory(resource.sourceCollection, resource.title),
    status: 'completed',
    score: typeof result.score === 'number' ? result.score : null,
    scoring: result.scoring || null,
    answers: result.answers || '',
    answersMap: result.answersMap || {},
    answersArray: result.answersArray || [],
    answeredCount: result.answeredCount || 0,
    questionCount: result.questionCount || resource.questionCount || 0,
    completedAt: result.completedAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
    createdAt: result.createdAt || new Date(),
    progressCollection: result.progressCollection || '',
    legacyType: 'submission',
  };
}

export async function getProgressSummary(studentId) {
  const items = await getProgressForStudent(studentId);
  const completed = new Set(items.filter(isSolvedProgressItem).map(progressItemKey)).size;
  const inProgress = items.filter((item) => item.status === 'in_progress').length;
  const averageScoreItems = items.filter((item) => typeof item.score === 'number');
  const averageScore =
    averageScoreItems.length > 0
      ? Math.round(averageScoreItems.reduce((total, item) => total + item.score, 0) / averageScoreItems.length)
      : null;

  const categoryBuckets = items.reduce((acc, item) => {
    const current = acc[item.category] || { totalKeys: new Set(), completedKeys: new Set() };
    const key = progressItemKey(item);
    current.totalKeys.add(key);
    if (isSolvedProgressItem(item)) current.completedKeys.add(key);
    acc[item.category] = current;
    return acc;
  }, {});

  const byCategory = Object.entries(categoryBuckets).reduce((acc, [category, bucket]) => {
    acc[category] = {
      total: bucket.totalKeys.size,
      completed: bucket.completedKeys.size,
    };
    return acc;
  }, {});

  return {
    total: items.length,
    completed,
    inProgress,
    averageScore,
    byCategory,
  };
}
