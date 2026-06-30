import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/student/Dashboard';
import Assignments from '../pages/student/Assignments';
import ResourceDetail from '../pages/student/ResourceDetail';
import { useAuth } from '../contexts/AuthContext';
import { getAnnouncements } from '../services/announcementService';
import {
  getResourceById,
  getResources,
  increaseResourceViewCount,
} from '../services/resourceService';
import {
  getAssignmentsForStudent,
  getProgressByResource,
  getProgressForStudent,
  getProgressSummary,
  isSolvedProgressItem,
} from '../services/progressService';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/announcementService', () => ({
  getAnnouncements: vi.fn(),
}));

vi.mock('../services/analyticsService', () => ({
  trackAnalyticsEvent: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('../services/resourceService', () => ({
  getResourceById: vi.fn(),
  getResources: vi.fn(),
  increaseResourceViewCount: vi.fn(),
}));

vi.mock('../services/progressService', () => ({
  getAssignmentsForStudent: vi.fn(),
  getProgressByResource: vi.fn(),
  getProgressForStudent: vi.fn(),
  getProgressSummary: vi.fn(),
  isSolvedProgressItem: vi.fn((item) =>
    Boolean(item?.status === 'completed' || item?.completedAt || item?.scoring || Number(item?.answeredCount || 0) > 0),
  ),
}));

const sampleResources = [
  {
    id: 'HIZ%20SB__test-1',
    title: 'Problemler Testi',
    category: 'testler',
    publisher: 'HIZ SB',
    subject: 'Problemler',
    gradeLevel: '5. Sınıf',
    description: 'Problemler çalışması',
    fileURL: 'https://example.com/test.pdf',
    createdAt: { seconds: 10 },
  },
  {
    id: 'ANKARA__deneme-1',
    title: 'Haftalık Deneme',
    category: 'haftalik-denemeler',
    publisher: 'ANKARA',
    subject: 'Genel',
    gradeLevel: '6. Sınıf',
    description: 'Haftalık çalışma',
    fileURL: 'https://example.com/deneme.pdf',
    createdAt: { seconds: 20 },
  },
];

const pendingAssignment = {
  id: 'assignment-1',
  legacyType: 'assignment',
  status: 'in_progress',
  resourceId: 'HIZ%20SB__test-1',
  resourceTitle: 'Bekleyen Test',
  resourceLink: 'https://example.com/test.pdf',
  sourceCollection: 'HIZ SB',
  category: 'testler',
  questionCount: 20,
  assignedAt: new Date('2026-06-29T09:00:00.000Z'),
};

const completedAssignment = {
  id: 'assignment-2',
  legacyType: 'assignment',
  status: 'completed',
  resourceId: 'ANKARA__deneme-1',
  resourceTitle: 'Bitmiş Test',
  resourceLink: 'https://example.com/done.pdf',
  sourceCollection: 'ANKARA',
  category: 'haftalik-denemeler',
  questionCount: 10,
  assignedAt: new Date('2026-06-28T09:00:00.000Z'),
  completedAt: new Date('2026-06-29T11:00:00.000Z'),
};

const solvedSubmission = {
  id: 'submission-1',
  legacyType: 'submission',
  status: 'completed',
  resourceId: 'HIZ%20SB__test-1',
  resourceTitle: 'Çözülmüş Test',
  category: 'testler',
  answeredCount: 20,
  questionCount: 20,
  score: 80,
  scoring: { correctCount: 16, wrongCount: 4 },
  updatedAt: new Date('2026-06-30T09:00:00.000Z'),
};

function setStudentAuth() {
  useAuth.mockReturnValue({
    currentUser: { uid: 'student-1', email: 'deneme@mail.com' },
    userProfile: { name: 'Deneme Öğrenci', role: 'student', status: 'active' },
    role: 'student',
    loading: false,
  });
}

describe('öğrenci ekranları', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStudentAuth();
    getResources.mockResolvedValue(sampleResources);
    getProgressForStudent.mockResolvedValue([pendingAssignment, completedAssignment, solvedSubmission]);
    getProgressSummary.mockResolvedValue({ completed: 1, averageScore: 80 });
    getAnnouncements.mockResolvedValue([{ title: 'Hafta Programı', content: 'Yeni ödevlerinizi kontrol edin.' }]);
    getAssignmentsForStudent.mockResolvedValue([pendingAssignment, completedAssignment]);
    increaseResourceViewCount.mockResolvedValue(false);
  });

  it('dashboard yayıncılar bloğunu göstermez ve sadece bekleyen ödevleri listeler', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Bekleyen Test')).toBeInTheDocument();
    expect(screen.queryByText('Bitmiş Test')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Yayıncılar' })).not.toBeInTheDocument();
    expect(screen.getByText('Hafta Programı')).toBeInTheDocument();
  });

  it('atanan ödevler sayfasında tamamlanan ödevleri gizler', async () => {
    render(
      <MemoryRouter>
        <Assignments />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Bekleyen Test')).toBeInTheDocument();
    expect(screen.queryByText('Bitmiş Test')).not.toBeInTheDocument();
    expect(screen.getByText('Bekleyen')).toBeInTheDocument();
  });

  it('çözülmüş test detayında testi çöz butonunu pasif gösterir', async () => {
    getResourceById.mockResolvedValue({
      id: 'HIZ%20SB__test-1',
      title: 'Problemler Testi',
      description: 'Problemler çalışması',
      category: 'testler',
      publisher: 'HIZ SB',
      subject: 'Problemler',
      gradeLevel: '5. Sınıf',
      fileURL: 'https://example.com/test.pdf',
      viewCount: 0,
    });
    getProgressByResource.mockResolvedValue(solvedSubmission);

    render(
      <MemoryRouter initialEntries={['/resource/HIZ%20SB__test-1']}>
        <Routes>
          <Route path="/resource/:id" element={<ResourceDetail />} />
          <Route path="/category/:category" element={<div>Kategori Sayfası</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const solvedButton = await screen.findByRole('button', { name: /Test Çözüldü/i });

    expect(isSolvedProgressItem).toHaveBeenCalledWith(solvedSubmission);
    expect(solvedButton).toBeDisabled();
    expect(screen.queryByRole('link', { name: /Testi Çöz/i })).not.toBeInTheDocument();
  });
});
