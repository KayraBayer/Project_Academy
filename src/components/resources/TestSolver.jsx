import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleSlash2, ExternalLink, RotateCcw, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { isSolvedProgressItem, saveTestSubmission } from '../../services/progressService';
import { cn } from '../../utils/classNames';

const choices = ['A', 'B', 'C', 'D'];

function answerCountFromResource(resource) {
  const keyLength = String(resource.answerKey || '').replace(/[^ABCDabcd]/g, '').length;
  return Number(resource.questionCount || keyLength || 0);
}

function drivePreviewUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes('drive.google.com')) {
      const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      const id = fileMatch?.[1] || parsed.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch {
    return value;
  }

  return value;
}

function answersFromProgress(progress, questionCount) {
  const result = {};
  if (!progress || !questionCount) return result;

  if (progress.answersMap && typeof progress.answersMap === 'object') {
    Object.entries(progress.answersMap).forEach(([key, value]) => {
      if (choices.includes(String(value).toLocaleUpperCase('tr-TR'))) result[Number(key)] = value;
    });
  }

  if (Array.isArray(progress.answersArray)) {
    progress.answersArray.forEach((value, index) => {
      const answer = String(value || '').toLocaleUpperCase('tr-TR');
      if (choices.includes(answer)) result[index + 1] = answer;
    });
  }

  if (typeof progress.answers === 'string' && !Object.keys(result).length) {
    progress.answers.split('').forEach((value, index) => {
      const answer = value.toLocaleUpperCase('tr-TR');
      if (choices.includes(answer)) result[index + 1] = answer;
    });
  }

  return result;
}

function ResultNumbers({ title, numbers = [], icon: Icon, tone }) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-3 dark:border-dark-border dark:bg-dark-surface">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tone.icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-extrabold text-ink dark:text-white">{title}</p>
      </div>
      {numbers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {numbers.map((number) => (
            <span key={number} className={cn('rounded-lg px-2 py-1 text-xs font-extrabold', tone.badge)}>
              {number}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-outline dark:text-dark-muted">Yok</p>
      )}
    </div>
  );
}

export default function TestSolver({ resource, currentUser, progress, onSaved }) {
  const resultRef = useRef(null);
  const questionCount = useMemo(() => answerCountFromResource(resource), [resource]);
  const [answers, setAnswers] = useState(() => answersFromProgress(progress, questionCount));
  const [saving, setSaving] = useState(false);
  const [revealResult, setRevealResult] = useState(false);
  const fileUrl = resource.fileURL || resource.externalLink || resource.link || '';
  const previewUrl = drivePreviewUrl(fileUrl);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const hasAnswerKey = Boolean(String(resource.answerKey || '').replace(/[^ABCDabcd]/g, ''));
  const scoring = progress?.scoring || null;
  const hasScoring = Boolean(scoring && typeof scoring.correctCount === 'number');
  const isReadOnly = progress ? isSolvedProgressItem(progress) : false;

  useEffect(() => {
    setAnswers(answersFromProgress(progress, questionCount));
  }, [progress, questionCount]);

  useEffect(() => {
    if (!revealResult || !hasScoring) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setRevealResult(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hasScoring, revealResult]);

  function setAnswer(questionNumber, answer) {
    setAnswers((current) => {
      const next = { ...current };
      if (next[questionNumber] === answer) delete next[questionNumber];
      else next[questionNumber] = answer;
      return next;
    });
  }

  async function handleSubmit() {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const savedProgress = await saveTestSubmission({
        studentId: currentUser.uid,
        resource,
        answers,
      });
      toast.success(hasAnswerKey ? 'Test kaydedildi ve puanlandı.' : 'Cevaplar kaydedildi.');
      onSaved?.(savedProgress);
      setRevealResult(Boolean(savedProgress?.scoring));
    } catch (error) {
      toast.error(error.message || 'Cevaplar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (!fileUrl) {
    return (
      <div className="surface-card p-6">
        <h2 className="text-xl font-extrabold text-ink dark:text-white">Testi Çöz</h2>
        <p className="mt-2 text-sm text-muted dark:text-dark-muted">Bu test için görüntülenecek PDF bağlantısı bulunmuyor.</p>
      </div>
    );
  }

  if (!questionCount) {
    return (
      <div className="surface-card p-6">
        <h2 className="text-xl font-extrabold text-ink dark:text-white">Testi Çöz</h2>
        <p className="mt-2 text-sm text-muted dark:text-dark-muted">Bu test için soru sayısı tanımlı değil.</p>
      </div>
    );
  }

  return (
    <section className="grid h-full min-h-0 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="surface-card flex min-h-[58dvh] flex-col overflow-hidden lg:min-h-0">
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-surface-border px-4 py-3 dark:border-dark-border sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink dark:text-white">PDF Görüntüleyici</h2>
            <p className="truncate text-sm text-muted dark:text-dark-muted">{resource.title}</p>
          </div>
          <Button as="a" href={fileUrl} target="_blank" rel="noreferrer" variant="outline" size="sm" icon={ExternalLink}>
            Yeni Sekme
          </Button>
        </div>
        <div className="min-h-[50dvh] flex-1 bg-surface-low dark:bg-dark-surface lg:min-h-0">
          <iframe
            title={`${resource.title} PDF`}
            src={previewUrl}
            className="h-full w-full border-0"
            allow="autoplay"
          />
        </div>
      </div>

      <aside className="surface-card flex max-h-none min-h-[38dvh] flex-col overflow-y-auto p-4 sm:p-5 lg:max-h-full lg:min-h-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink dark:text-white">Cevap Kağıdı</h2>
            <p className="text-sm text-muted dark:text-dark-muted">
              {answeredCount} / {questionCount} cevap girildi
            </p>
          </div>
          {progress?.status === 'completed' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/10 px-3 py-1 text-xs font-bold text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Kaydedildi
            </span>
          ) : null}
        </div>

        <div className="mt-4 max-h-[42dvh] space-y-2 overflow-y-auto pr-1 lg:max-h-[34dvh]">
          {Array.from({ length: questionCount }, (_, index) => {
            const questionNumber = index + 1;
            return (
              <div
                key={questionNumber}
                className="grid grid-cols-[2.5rem_1fr] items-center gap-2 rounded-xl border border-surface-border bg-surface-low p-2 dark:border-dark-border dark:bg-dark-surface"
              >
                <span className="text-center text-sm font-extrabold text-ink dark:text-white">{questionNumber}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {choices.map((choice) => {
                    const selected = answers[questionNumber] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={selected}
                        disabled={isReadOnly}
                        onClick={() => setAnswer(questionNumber, choice)}
                        className={cn(
                          'h-9 rounded-lg border text-sm font-extrabold transition-all duration-200',
                          selected
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-surface-border bg-white text-muted hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-card dark:text-dark-muted',
                          isReadOnly && 'cursor-default hover:border-surface-border hover:text-muted dark:hover:border-dark-border dark:hover:text-dark-muted',
                        )}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <Button icon={Save} loading={saving} disabled={!answeredCount || isReadOnly} onClick={handleSubmit}>
            {isReadOnly ? 'Cevaplar Kaydedildi' : 'Cevapları Kaydet'}
          </Button>
          <Button variant="outline" icon={RotateCcw} disabled={saving || !answeredCount || isReadOnly} onClick={() => setAnswers({})}>
            Temizle
          </Button>
        </div>

        <p className="mt-3 text-xs text-outline dark:text-dark-muted">
          {hasAnswerKey ? 'Cevaplar kaydedildiğinde sonuç otomatik hesaplanır.' : 'Bu testte cevap anahtarı olmadığı için yalnızca cevaplar kaydedilir.'}
        </p>

        {hasScoring ? (
          <div ref={resultRef} className="mt-5 rounded-2xl border border-surface-border bg-surface-low p-4 dark:border-dark-border dark:bg-dark-surface/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-ink dark:text-white">Sonuç Özeti</h3>
                <p className="text-sm text-muted dark:text-dark-muted">
                  {scoring.compared || questionCount} soru değerlendirildi
                </p>
              </div>
              <span className="rounded-xl bg-primary px-3 py-1.5 text-sm font-extrabold text-white">
                %{progress.score ?? Math.round(((scoring.correctCount || 0) / (questionCount || scoring.compared || 1)) * 100)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-50 p-3 text-tertiary dark:bg-emerald-500/10 dark:text-emerald-200">
                <p className="text-xl font-black">{scoring.correctCount || 0}</p>
                <p className="text-[11px] font-bold">Doğru</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3 text-danger dark:bg-red-500/10 dark:text-red-200">
                <p className="text-xl font-black">{scoring.wrongCount || 0}</p>
                <p className="text-[11px] font-bold">Yanlış</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-outline dark:bg-white/5 dark:text-dark-muted">
                <p className="text-xl font-black">{scoring.blankCount || 0}</p>
                <p className="text-[11px] font-bold">Boş</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <ResultNumbers
                title="Doğru Sorular"
                numbers={scoring.correctQuestions || []}
                icon={CheckCircle2}
                tone={{
                  icon: 'bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
                  badge: 'bg-emerald-100 text-tertiary dark:bg-emerald-500/15 dark:text-emerald-200',
                }}
              />
              <ResultNumbers
                title="Yanlış Sorular"
                numbers={scoring.wrongQuestions || []}
                icon={XCircle}
                tone={{
                  icon: 'bg-red-100 text-danger dark:bg-red-500/15 dark:text-red-200',
                  badge: 'bg-red-100 text-danger dark:bg-red-500/15 dark:text-red-200',
                }}
              />
              <ResultNumbers
                title="Boş Sorular"
                numbers={scoring.blankQuestions || []}
                icon={CircleSlash2}
                tone={{
                  icon: 'bg-slate-200 text-outline dark:bg-white/10 dark:text-dark-muted',
                  badge: 'bg-slate-200 text-outline dark:bg-white/10 dark:text-dark-muted',
                }}
              />
            </div>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
