import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { callCreatePublisher, callCreateTest, callDeleteTest, callDeleteTests, callUpdateTest } from './adminFunctionService';

const RESOURCE_META_COLLECTIONS = ['ozelKategoriler', 'kategoriAdlari'];
const COLLECTION_NAME_FIELD = 'name';

const FALLBACK_COLLECTIONS = [
  'ADIM ADIM ZİRVEYE 8',
  'ALL STAR 5',
  'ALTINKARMA KA_SB',
  'ANKARA_HAFTALIK_DENEMELER',
  'AV YAYINLARI KONU TESTLERİ',
  'BANKO MODEL',
  'BANKO MODEL SB 7',
  'BENİM HOCAM 5',
  'BUMERANG HAFTALIK DENEMELER 5',
  'BUMERANG HAFTALIK DENEMELER 7',
  'BUMERANG HAFTALIK DENEMELER 8',
  'BUMERANG_HAFTALIK_DENEMELER_6',
  'BİLFEN_PROTEST_5',
  'BİLTEST SB',
  'DM BECERİ TEMELLİ TESTLER',
  'DM_KAZANIM_TESTLERİ',
  'FENOMEN A_8_SINIF',
  'FENOMEN_B_8',
  'FULL YAYINLARI',
  'HEP HAFTALIK DENEMELER 7',
  'HIZ HAFTALIK DENEMELER 6',
  'HIZ HAFTALIK DENEMELER 7',
  'HIZ HAFTALIK DENEMELER 8',
  'HIZ HİBRİT KA',
  'HIZ HİBRİT KA_06',
  'HIZ SB',
  'HİPER ZEKA KONU 6',
  'MARATON SB 6.SINIF',
  'MOZAİK HAFTALIK DENEMELER 6',
  'MOZAİK HAFTALIK DENEMELER 7',
  'PARAF HAFTALIK DENEMELER',
  'SINAV SORUBANK 8',
  'SİNAN KUZUCU KAZANIM KİTABI',
  'SİNAN KUZUCU MEB 2026',
  'TESTMAKER 6.SINIF',
  'ULTİ HAFTALIK DENEMELER_5',
  'USTA İŞİ SB',
  'VOLTAJ HAFTALIK DENEMELER',
  'YARGI HAFTALIK DENEMELER',
  'YARGI YENİ NESİL TESTLERİ',
  'ZOOM',
  'ZOOM_SB_6',
  'İDOL BAŞLANGIÇ DENEMELERİ',
  'İRRASYONEL YAPRAK TEST',
  'İŞLEYEN ZEKA DENEMELR',
];

let collectionNameCache = null;
let resourceCache = null;

function isValidLink(link) {
  return typeof link === 'string' && link.trim() && link.trim() !== '-' && /^https?:\/\//i.test(link.trim());
}

function normalizeText(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function upperTR(value) {
  return normalizeText(value).toLocaleUpperCase('tr-TR');
}

export function makeResourceId(collectionName, docId) {
  return `${encodeURIComponent(collectionName)}__${encodeURIComponent(docId)}`;
}

export function parseResourceId(id) {
  const value = String(id || '');
  const separatorIndex = value.lastIndexOf('__');
  return {
    collectionName: separatorIndex >= 0 ? decodeURIComponent(value.slice(0, separatorIndex)) : '',
    docId: separatorIndex >= 0 ? decodeURIComponent(value.slice(separatorIndex + 2)) : '',
  };
}

export function deriveResourceCategory(collectionName, resourceName = '') {
  const text = upperTR(`${collectionName} ${resourceName}`);
  if (text.includes('YAZILI')) return 'yazili-ornekleri';
  if (text.includes('HAFTALIK')) return 'haftalik-denemeler';
  if (text.includes('DENEME')) return 'denemeler';
  if (
    text.includes('TEST') ||
    text.includes('SB') ||
    text.includes('SORUBANK') ||
    text.includes('Soru Bank'.toLocaleUpperCase('tr-TR')) ||
    text.includes('YAPRAK') ||
    text.includes('KAZANIM') ||
    text.includes('BECERİ') ||
    text.includes('PROTEST') ||
    text.includes('HAFTA SONU')
  ) {
    return 'testler';
  }
  return 'yayinlar';
}

function deriveSubject(name) {
  const cleaned = normalizeText(name)
    .replace(/^\d+\s*[-.]?\s*/, '')
    .replace(/\bTEST\b/gi, '')
    .trim();
  return cleaned || 'Matematik';
}

function normalizeResource(collectionName, snapshot) {
  const data = snapshot.data();
  const title = normalizeText(data.name || snapshot.id);
  const link = isValidLink(data.link) ? data.link.trim() : '';
  const questionCount = Number(data.questionCount || 0);
  const grade = data.grade ? Number(data.grade) : null;

  return {
    id: makeResourceId(collectionName, snapshot.id),
    legacyId: data.id || snapshot.id,
    testId: data.testId || `${collectionName}::${snapshot.id}`,
    uniqueId: data.uniqueId || `${collectionName}::${snapshot.id}`,
    sourceCollection: collectionName,
    sourceDocId: snapshot.id,
    title,
    description: `${collectionName} yayıncısına ait ${questionCount || 'çok'} soruluk çalışma.`,
    category: deriveResourceCategory(collectionName, title),
    publisher: collectionName,
    subject: deriveSubject(title),
    gradeLevel: grade ? `${grade}. Sınıf` : 'Tüm Sınıflar',
    grade,
    coverImageURL: '',
    fileURL: link,
    externalLink: link,
    link,
    answerKey: data.answerKey || '',
    questionCount,
    createdAt: data.createdAt || null,
    updatedAt: data.createdAt || null,
    createdBy: '',
    viewCount: 0,
    legacyType: data.type || 'yayın',
  };
}

function sortResources(resources, sortBy = 'newest') {
  const sorted = [...resources];
  if (sortBy === 'popular') return sorted.sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0));
  if (sortBy === 'title') return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));

  return sorted.sort((a, b) => {
    const left = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    const right = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    return left - right;
  });
}

async function getCollectionNames() {
  if (collectionNameCache) return collectionNameCache;

  const names = new Set(FALLBACK_COLLECTIONS);
  const reads = await Promise.allSettled(
    RESOURCE_META_COLLECTIONS.map(async (metaCollection) => {
      const snapshot = await getDocs(collection(db, metaCollection));
      snapshot.docs.forEach((item) => {
        const name = item.data()?.[COLLECTION_NAME_FIELD];
        if (name) names.add(name);
      });
    }),
  );

  reads
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.warn('Kategori metadata okunamadı:', result.reason));

  collectionNameCache = [...names].sort((a, b) => a.localeCompare(b, 'tr'));
  return collectionNameCache;
}

async function loadAllResources() {
  if (resourceCache) return resourceCache;

  const collectionNames = await getCollectionNames();
  const reads = await Promise.allSettled(
    collectionNames.map(async (collectionName) => {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map((item) => normalizeResource(collectionName, item));
    }),
  );

  resourceCache = reads
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  reads
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.warn('Kaynak koleksiyonu okunamadı:', result.reason));

  return resourceCache;
}

export function clearResourceCache() {
  collectionNameCache = null;
  resourceCache = null;
}

export async function getResourceCollections() {
  return getCollectionNames();
}

export async function getResources(filters = {}) {
  let resources = await loadAllResources();

  if (filters.category) resources = resources.filter((resource) => resource.category === filters.category);
  if (filters.publisher) resources = resources.filter((resource) => resource.publisher === filters.publisher);
  if (filters.sourceCollection) resources = resources.filter((resource) => resource.sourceCollection === filters.sourceCollection);
  if (filters.subject) resources = resources.filter((resource) => resource.subject === filters.subject);
  if (filters.gradeLevel) resources = resources.filter((resource) => resource.gradeLevel === filters.gradeLevel);

  if (filters.search) {
    const search = filters.search.toLocaleLowerCase('tr-TR');
    resources = resources.filter((resource) =>
      [resource.title, resource.publisher, resource.subject, resource.description]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase('tr-TR').includes(search)),
    );
  }

  return sortResources(resources, filters.sortBy);
}

export async function getResourceById(id) {
  const { collectionName, docId } = parseResourceId(id);
  if (!collectionName || !docId) return null;

  const snapshot = await getDoc(doc(db, collectionName, docId));
  if (!snapshot.exists()) return null;
  return normalizeResource(collectionName, snapshot);
}

export async function createResource(payload) {
  const result = await callCreateTest(payload);
  clearResourceCache();
  return result;
}

export async function createPublisher(name) {
  const result = await callCreatePublisher({ name });
  clearResourceCache();
  return result;
}

export async function updateResource(id, payload) {
  const result = await callUpdateTest({ id, ...payload });
  clearResourceCache();
  return result;
}

export async function deleteResource(idOrResource) {
  const id = typeof idOrResource === 'string' ? idOrResource : idOrResource?.id;
  const result = await callDeleteTest(id);
  clearResourceCache();
  return result;
}

export async function deleteResources(ids = []) {
  const result = await callDeleteTests(ids);
  clearResourceCache();
  return result;
}

export async function increaseResourceViewCount() {
  return false;
}

export async function getResourceFacets(category) {
  const resources = await getResources({ category });
  const subjects = [...new Set(resources.map((item) => item.subject).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  );
  const gradeLevels = [...new Set(resources.map((item) => item.gradeLevel).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  );

  return { subjects, gradeLevels };
}
