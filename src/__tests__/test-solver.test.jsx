import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestSolver from '../components/resources/TestSolver';
import { saveTestSubmission } from '../services/progressService';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/progressService', () => ({
  isSolvedProgressItem: vi.fn((item) =>
    Boolean(item?.status === 'completed' || item?.completedAt || item?.scoring || Number(item?.answeredCount || 0) > 0),
  ),
  saveTestSubmission: vi.fn(),
}));

const resource = {
  id: 'HIZ%20SB__test-1',
  sourceCollection: 'HIZ SB',
  sourceDocId: 'test-1',
  title: 'Problemler Testi',
  externalLink: 'https://drive.google.com/file/d/drive-file-id/view',
  answerKey: 'AB',
  questionCount: 2,
};

const currentUser = {
  uid: 'student-1',
};

function SolverHarness({ initialProgress = null }) {
  const [progress, setProgress] = useState(initialProgress);

  return (
    <TestSolver
      resource={resource}
      currentUser={currentUser}
      progress={progress}
      onSaved={(savedProgress) => setProgress(savedProgress)}
    />
  );
}

describe('test çözme ekranı', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cevapları kaydeder ve sonuç özetini görünür hale getirir', async () => {
    const user = userEvent.setup();
    saveTestSubmission.mockResolvedValue({
      id: 'submission-1',
      studentId: 'student-1',
      resourceId: resource.id,
      status: 'completed',
      score: 50,
      scoring: {
        compared: 2,
        correctCount: 1,
        wrongCount: 1,
        blankCount: 0,
        correctQuestions: [1],
        wrongQuestions: [2],
        blankQuestions: [],
      },
      answers: 'AC',
      answersMap: { 1: 'A', 2: 'C' },
      answersArray: ['A', 'C'],
      answeredCount: 2,
      questionCount: 2,
    });

    render(<SolverHarness />);

    await user.click(screen.getAllByRole('button', { name: 'A' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'C' })[1]);
    await user.click(screen.getByRole('button', { name: 'Cevapları Kaydet' }));

    await screen.findByText('Sonuç Özeti');

    expect(saveTestSubmission).toHaveBeenCalledWith({
      studentId: 'student-1',
      resource,
      answers: { 1: 'A', 2: 'C' },
    });
    expect(screen.getByText('%50')).toBeInTheDocument();
    expect(screen.getByText('Doğru Sorular')).toBeInTheDocument();
    expect(screen.getByText('Yanlış Sorular')).toBeInTheDocument();
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it('çözülmüş testte cevap seçimini ve tekrar kaydetmeyi kapatır', async () => {
    render(
      <SolverHarness
        initialProgress={{
          status: 'completed',
          score: 100,
          answersMap: { 1: 'A', 2: 'B' },
          scoring: {
            compared: 2,
            correctCount: 2,
            wrongCount: 0,
            blankCount: 0,
            correctQuestions: [1, 2],
            wrongQuestions: [],
            blankQuestions: [],
          },
        }}
      />,
    );

    await screen.findByText('Sonuç Özeti');

    expect(screen.getByRole('button', { name: 'Cevaplar Kaydedildi' })).toBeDisabled();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'A' })[0]).toBeDisabled();
      expect(screen.getAllByRole('button', { name: 'B' })[1]).toBeDisabled();
    });
  });
});
