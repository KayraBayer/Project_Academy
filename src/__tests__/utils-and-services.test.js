import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase/firebase', () => ({
  auth: {},
  db: {},
  functions: {},
  storage: {},
}));

vi.mock('../services/adminFunctionService', () => ({
  callCreatePublisher: vi.fn(),
  callCreateTest: vi.fn(),
  callDeleteTest: vi.fn(),
  callSubmitTestAnswers: vi.fn(),
  callUpdateTest: vi.fn(),
}));

import { callSubmitTestAnswers } from '../services/adminFunctionService';
import {
  deriveResourceCategory,
  makeResourceId,
  parseResourceId,
} from '../services/resourceService';
import {
  isSolvedProgressItem,
  progressItemKey,
  saveTestSubmission,
} from '../services/progressService';
import { getCategoryName } from '../utils/categories';
import { formatDate, toDate } from '../utils/formatDate';

describe('yardımcı fonksiyonlar ve servis adaptörleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kategori çıkarımını mevcut koleksiyon adlarına göre doğru yapar', () => {
    expect(deriveResourceCategory('ANKARA_HAFTALIK_DENEMELER', '1. Hafta')).toBe('haftalik-denemeler');
    expect(deriveResourceCategory('İDOL BAŞLANGIÇ DENEMELERİ', 'Matematik')).toBe('denemeler');
    expect(deriveResourceCategory('HIZ SB', 'Problemler Testi')).toBe('testler');
    expect(deriveResourceCategory('OKUL YAZILI', '2. Dönem')).toBe('yazili-ornekleri');
    expect(deriveResourceCategory('Matematik Arşivi', 'Konu anlatımı')).toBe('yayinlar');
  });

  it('legacy kaynak idlerini güvenli encode/decode eder', () => {
    const id = makeResourceId('BİLFEN_PROTEST_5', 'Kesir Problemleri / Test 1');

    expect(id).toBe('B%C4%B0LFEN_PROTEST_5__Kesir%20Problemleri%20%2F%20Test%201');
    expect(parseResourceId(id)).toEqual({
      collectionName: 'BİLFEN_PROTEST_5',
      docId: 'Kesir Problemleri / Test 1',
    });
  });

  it('çözülmüş ilerleme kayıtlarını farklı legacy formatlarda tanır', () => {
    expect(isSolvedProgressItem({ status: 'completed' })).toBe(true);
    expect(isSolvedProgressItem({ status: 'tamamlandı' })).toBe(true);
    expect(isSolvedProgressItem({ scoring: { correctCount: 8 } })).toBe(true);
    expect(isSolvedProgressItem({ answeredCount: 3 })).toBe(true);
    expect(isSolvedProgressItem({ status: 'in_progress' })).toBe(false);
  });

  it('ilerleme kayıtları için stabil anahtar üretir', () => {
    expect(progressItemKey({ resourceId: 'kaynak-1', id: 'fallback' })).toBe('kaynak-1');
    expect(progressItemKey({ sourceCollection: 'YAYIN', sourceDocId: 'test-1' })).toBe('YAYIN::test-1');
    expect(progressItemKey({ id: 'progress-1' })).toBe('progress-1');
  });

  it('test cevaplarını Cloud Function sonucundan normalize ederek döndürür', async () => {
    callSubmitTestAnswers.mockResolvedValue({
      id: 'submission-1',
      sourceCollection: 'HIZ SB',
      sourceDocId: 'test-1',
      category: 'testler',
      score: 50,
      scoring: {
        correctCount: 1,
        wrongCount: 1,
        blankCount: 0,
        correctQuestions: [1],
        wrongQuestions: [2],
      },
      answers: 'AC',
      answersMap: { 1: 'A', 2: 'C' },
      answersArray: ['A', 'C'],
      answeredCount: 2,
      questionCount: 2,
      progressCollection: 'deneme',
    });

    const resourceId = makeResourceId('HIZ SB', 'test-1');
    const result = await saveTestSubmission({
      studentId: 'student-1',
      resource: {
        id: resourceId,
        sourceCollection: 'HIZ SB',
        sourceDocId: 'test-1',
        title: 'Problemler Testi',
        link: 'https://example.com/test.pdf',
      },
      answers: { 1: 'A', 2: 'C' },
    });

    expect(callSubmitTestAnswers).toHaveBeenCalledWith({
      resourceId,
      answers: { 1: 'A', 2: 'C' },
    });
    expect(result).toMatchObject({
      id: 'submission-1',
      studentId: 'student-1',
      resourceId,
      status: 'completed',
      score: 50,
      answeredCount: 2,
      questionCount: 2,
      legacyType: 'submission',
    });
  });

  it('Türkçe kategori adı ve tarih formatı üretir', () => {
    const date = new Date('2026-06-30T12:00:00.000Z');

    expect(getCategoryName('haftalik-denemeler')).toBe('Haftalık Denemeler');
    expect(toDate({ toDate: () => date })).toBe(date);
    expect(formatDate(null)).toBe('-');
    expect(formatDate(date)).toContain('2026');
  });
});
