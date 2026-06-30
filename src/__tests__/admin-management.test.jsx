import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResourceForm from '../components/resources/ResourceForm';
import ResourceTable from '../components/resources/ResourceTable';
import AdminNotifications from '../pages/admin/AdminNotifications';
import {
  deleteNotification,
  getAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import { getResourceCollections } from '../services/resourceService';

vi.mock('../services/notificationService', () => ({
  deleteNotification: vi.fn(),
  getAdminNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('../services/resourceService', () => ({
  createPublisher: vi.fn(),
  getResourceCollections: vi.fn(),
}));

const resources = [
  {
    id: 'YAYIN__test-1',
    title: 'Birinci Test',
    publisher: 'YAYIN',
    subject: 'Problemler',
    gradeLevel: '5. Sınıf',
    questionCount: 20,
    testId: 'YAYIN::test-1',
  },
  {
    id: 'YAYIN__test-2',
    title: 'İkinci Test',
    publisher: 'YAYIN',
    subject: 'Kesirler',
    gradeLevel: '6. Sınıf',
    questionCount: 15,
    testId: 'YAYIN::test-2',
  },
];

describe('admin kaynak yönetimi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test tablosunda çoklu seçim callbacklerini çalıştırır', async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    const onToggleSelectAll = vi.fn();

    render(
      <MemoryRouter>
        <ResourceTable
          resources={resources}
          selectable
          selectedIds={['YAYIN__test-1']}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText('İkinci Test testini seç'));
    await user.click(screen.getByLabelText('Tüm testleri seç'));

    expect(onToggleSelect).toHaveBeenCalledWith('YAYIN__test-2');
    expect(onToggleSelectAll).toHaveBeenCalled();
  });

  it('test düzenleme formunda yayıncı seçimini açık bırakır', async () => {
    getResourceCollections.mockResolvedValue(['YAYIN', 'YENI YAYIN']);

    render(
      <ResourceForm
        initialData={{
          id: 'YAYIN__test-1',
          sourceCollection: 'YAYIN',
          title: 'Birinci Test',
          grade: 5,
          questionCount: 20,
          answerKey: 'ABCD',
          externalLink: 'https://example.com/test.pdf',
        }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const publisherButton = await screen.findByRole('button', { name: /YAYIN/i });

    expect(publisherButton).not.toBeDisabled();
  });
});

describe('admin bildirimleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminNotifications.mockResolvedValue([
      {
        id: 'notification-1',
        type: 'homework_completed',
        title: 'Ödev tamamlandı',
        message: 'Deneme Öğrenci "Problemler Testi" ödevini tamamladı.',
        studentName: 'Deneme Öğrenci',
        resourceId: 'YAYIN__test-1',
        score: 80,
        read: false,
        createdAt: new Date('2026-07-01T09:00:00.000Z'),
      },
    ]);
    markNotificationRead.mockResolvedValue();
    markAllNotificationsRead.mockResolvedValue();
    deleteNotification.mockResolvedValue();
  });

  it('ödev tamamlama bildirimini gösterir ve okundu yapar', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminNotifications />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Ödev tamamlandı')).toBeInTheDocument();
    expect(screen.getAllByText(/Deneme Öğrenci/).length).toBeGreaterThan(0);
    expect(screen.getByText((_, element) => element?.textContent === 'Puan %80')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Okundu' }));

    expect(markNotificationRead).toHaveBeenCalledWith('notification-1');
  });
});
