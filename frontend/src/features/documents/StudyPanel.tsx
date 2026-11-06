import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  ListChecks,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { DocumentStatus } from '@/types/document'
import {
  isStudyProcessing,
  type Flashcard,
  type FlashcardSet,
  type Quiz,
} from '@/types/study'

const controlButton =
  'inline-flex size-11 items-center justify-center rounded-full border border-parchment-200 bg-parchment-50 text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-clay-500'

interface StudyPanelProps {
  flashcards: FlashcardSet | undefined
  flashcardsLoading: boolean
  flashcardsError: boolean
  quiz: Quiz | undefined
  quizLoading: boolean
  quizError: boolean
  documentStatus: DocumentStatus
  isGeneratingFlashcards: boolean
  isGeneratingQuiz: boolean
  generateError: string | null
  onGenerateFlashcards: () => void
  onGenerateQuiz: () => void
  onRetryFlashcards: () => void
  onRetryQuiz: () => void
  onClose: () => void
}

export function StudyPanel({
  flashcards,
  flashcardsLoading,
  flashcardsError,
  quiz,
  quizLoading,
  quizError,
  documentStatus,
  isGeneratingFlashcards,
  isGeneratingQuiz,
  generateError,
  onGenerateFlashcards,
  onGenerateQuiz,
  onRetryFlashcards,
  onRetryQuiz,
  onClose,
}: StudyPanelProps) {
  const [tab, setTab] = useState<'flashcards' | 'quiz'>('flashcards')

  return (
    <div className="flex h-full animate-[panel-in_220ms_ease-out] flex-col gap-4 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 shadow-[0_18px_40px_-24px_rgba(61,45,28,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink-900">
            <GraduationCap className="size-4 text-clay-600" aria-hidden="true" />
            Study this document
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Flashcards and a quiz, generated from the text
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close study"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {documentStatus === 'needs_ocr' ? (
        <Notice tone="ochre">
          This looks like a <strong>scanned PDF</strong> — it has no text layer, so study
          material can&apos;t be generated yet. Reading the pages still works.
        </Notice>
      ) : documentStatus === 'uploaded' || documentStatus === 'extracting' ? (
        <ProgressState label="Still extracting text from this document…" />
      ) : documentStatus === 'failed' ? (
        <Notice tone="brick">
          Text extraction failed for this document, so study material can&apos;t be generated.
        </Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-parchment-200 bg-parchment-100 p-1">
            <TabButton
              active={tab === 'flashcards'}
              icon={Layers}
              label="Flashcards"
              onClick={() => setTab('flashcards')}
            />
            <TabButton
              active={tab === 'quiz'}
              icon={ListChecks}
              label="Quiz"
              onClick={() => setTab('quiz')}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {tab === 'flashcards' ? (
              <FlashcardsTab
                set={flashcards}
                isLoading={flashcardsLoading}
                isError={flashcardsError}
                isGenerating={isGeneratingFlashcards}
                generateError={generateError}
                onGenerate={onGenerateFlashcards}
                onRetry={onRetryFlashcards}
              />
            ) : (
              <QuizTab
                quiz={quiz}
                isLoading={quizLoading}
                isError={quizError}
                isGenerating={isGeneratingQuiz}
                generateError={generateError}
                onGenerate={onGenerateQuiz}
                onRetry={onRetryQuiz}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Layers
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-ink-500 transition-colors hover:text-ink-800 data-[active=true]:bg-parchment-50 data-[active=true]:text-ink-900 data-[active=true]:shadow-sm"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function FlashcardsTab({
  set,
  isLoading,
  isError,
  isGenerating,
  generateError,
  onGenerate,
  onRetry,
}: {
  set: FlashcardSet | undefined
  isLoading: boolean
  isError: boolean
  isGenerating: boolean
  generateError: string | null
  onGenerate: () => void
  onRetry: () => void
}) {
  const status = set?.status ?? 'none'

  if (isError) return <ErrorState message="Couldn't load your flashcards." onRetry={onRetry} />
  if (isGenerating || isStudyProcessing(status)) {
    return <ProgressState label="Building your flashcards…" />
  }
  if (status === 'failed') {
    return <ErrorState message={set?.error ?? 'The flashcards failed.'} onRetry={onGenerate} />
  }
  if (status === 'succeeded' && set && set.cards.length > 0) {
    return (
      <FlashcardDeck key={set.id ?? 'flashcards'} cards={set.cards} onNewSet={onGenerate} />
    )
  }
  if (isLoading && !set) return <ProgressState label="Loading…" />

  return (
    <GenerateState
      icon={Layers}
      title="Turn this document into flashcards"
      description="Get a deck of key terms and answers you can flip through."
      error={generateError}
      disabled={isGenerating}
      onGenerate={onGenerate}
      label="Generate flashcards"
    />
  )
}

function FlashcardDeck({
  cards,
  onNewSet,
}: {
  cards: Flashcard[]
  onNewSet: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [leaving, setLeaving] = useState<{
    card: Flashcard
    direction: 1 | -1
    nonce: number
  } | null>(null)
  const card = cards[index]
  const progress = ((index + 1) / cards.length) * 100

  const navigate = useCallback(
    (next: number) => {
      const current = cards[index]
      if (!current || next < 0 || next >= cards.length) return
      const nextDirection: 1 | -1 = next > index ? 1 : -1
      const nonce = Date.now()
      setDirection(nextDirection)
      setLeaving({ card: current, direction: nextDirection, nonce })
      setIndex(next)
      setFlipped(false)
      window.setTimeout(() => {
        setLeaving((value) => (value?.nonce === nonce ? null : value))
      }, 400)
    },
    [cards, index],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') navigate(index + 1)
      else if (event.key === 'ArrowLeft') navigate(index - 1)
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, index])

  if (!card) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <button
          type="button"
          onClick={onNewSet}
          className="inline-flex items-center gap-1 font-medium text-clay-600 transition-colors hover:text-clay-700"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          New set
        </button>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-parchment-200">
        <div
          className="h-full rounded-full bg-clay-500 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={index} className="relative h-80">
        <span
          className="pointer-events-none absolute inset-0 translate-y-4 scale-[0.94] rounded-2xl border border-parchment-200 bg-parchment-50/50"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.97] rounded-2xl border border-parchment-200 bg-parchment-50/75"
          aria-hidden="true"
        />

        {leaving ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-20',
              leaving.direction === 1 ? 'deck-out-next' : 'deck-out-prev',
            )}
            aria-hidden="true"
          >
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-parchment-200 bg-parchment-50 p-8 shadow-[0_24px_50px_-28px_rgba(61,45,28,0.55)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-600">
                Question
              </span>
              <p className="font-serif text-xl leading-relaxed text-ink-900">
                {leaving.card.front}
              </p>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            'absolute inset-0 z-10',
            direction === 1 ? 'deck-in-next' : 'deck-in-prev',
          )}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setFlipped((value) => !value)
              }
            }}
            aria-label={flipped ? 'Show question' : 'Show answer'}
            className="flashcard-scene h-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-500"
          >
            <div className={cn('flashcard-card', flipped && 'is-flipped')}>
              <div className="flashcard-face">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-600">
                  Question
                </span>
                <p className="font-serif text-xl leading-relaxed text-ink-900">{card.front}</p>
                <span className="mt-auto text-[11px] text-ink-400">Click to reveal</span>
              </div>
              <div className="flashcard-face flashcard-back">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-600">
                  Answer
                </span>
                <p className="text-[15px] leading-7 text-ink-700">{card.back}</p>
                <span className="mt-auto text-[11px] text-ink-400">Click to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(index - 1)}
          disabled={index === 0}
          aria-label="Previous card"
          className={controlButton}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-clay-600 px-5 text-sm font-medium text-parchment-50 transition-colors hover:bg-clay-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          {flipped ? 'Show question' : 'Show answer'}
        </button>
        <button
          type="button"
          onClick={() => navigate(index + 1)}
          disabled={index === cards.length - 1}
          aria-label="Next card"
          className={controlButton}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-center text-[11px] text-ink-400">
        Arrow keys to move · Space to flip
      </p>
    </div>
  )
}

function QuizTab({
  quiz,
  isLoading,
  isError,
  isGenerating,
  generateError,
  onGenerate,
  onRetry,
}: {
  quiz: Quiz | undefined
  isLoading: boolean
  isError: boolean
  isGenerating: boolean
  generateError: string | null
  onGenerate: () => void
  onRetry: () => void
}) {
  const status = quiz?.status ?? 'none'

  if (isError) return <ErrorState message="Couldn't load your quiz." onRetry={onRetry} />
  if (isGenerating || isStudyProcessing(status)) {
    return <ProgressState label="Writing your quiz…" />
  }
  if (status === 'failed') {
    return <ErrorState message={quiz?.error ?? 'The quiz failed.'} onRetry={onGenerate} />
  }
  if (status === 'succeeded' && quiz && quiz.questions.length > 0) {
    return <QuizRunner key={quiz.id ?? 'quiz'} quiz={quiz} onNewQuiz={onGenerate} />
  }
  if (isLoading && !quiz) return <ProgressState label="Loading…" />

  return (
    <GenerateState
      icon={ListChecks}
      title="Test yourself"
      description="A multiple-choice quiz with a score at the end."
      error={generateError}
      disabled={isGenerating}
      onGenerate={onGenerate}
      label="Generate quiz"
    />
  )
}

function QuizRunner({ quiz, onNewQuiz }: { quiz: Quiz; onNewQuiz: () => void }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = quiz.questions[index]
  const total = quiz.questions.length
  const answered = selected !== null

  if (!current) return null
  const question = current

  function choose(option: number) {
    if (answered) return
    setSelected(option)
    if (option === question.answer_index) setScore((value) => value + 1)
  }

  function advance() {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setSelected(null)
  }

  function restart() {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = Math.round((score / total) * 100)
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="rounded-full bg-clay-600/10 p-4">
          <Trophy className="size-7 text-clay-600" aria-hidden="true" />
        </span>
        <div>
          <p className="font-serif text-3xl font-semibold text-ink-900">
            {score} / {total}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {percent >= 80
              ? 'Excellent work.'
              : percent >= 50
                ? 'Solid effort — a little more review will help.'
                : 'Keep studying — you’ll get there.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={restart}>
            Try again
          </Button>
          <Button size="md" onClick={onNewQuiz}>
            <Sparkles className="size-4" aria-hidden="true" />
            New quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-parchment-200">
        <div
          className="h-full rounded-full bg-clay-500 transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div key={index} className="card-swap space-y-3">
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink-900">
          {question.question}
        </h3>

        <div className="space-y-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.answer_index
            const isSelected = optionIndex === selected
            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => choose(optionIndex)}
                disabled={answered}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors',
                  !answered &&
                    'border-parchment-200 bg-parchment-50 text-ink-700 hover:border-clay-300 hover:bg-parchment-100',
                  answered && isCorrect && 'border-sage-600/40 bg-sage-50 text-sage-600',
                  answered &&
                    isSelected &&
                    !isCorrect &&
                    'border-brick-600/40 bg-brick-50 text-brick-600',
                  answered &&
                    !isCorrect &&
                    !isSelected &&
                    'border-parchment-200 bg-parchment-50 text-ink-400',
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="flex-1">{option}</span>
                {answered && isCorrect ? (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                ) : null}
                {answered && isSelected && !isCorrect ? (
                  <X className="size-4 shrink-0" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>

        {answered ? (
          <div
            className={cn(
              'rounded-xl border px-3.5 py-3 text-sm leading-6',
              selected === question.answer_index
                ? 'border-sage-600/25 bg-sage-50 text-sage-600'
                : 'border-brick-600/25 bg-brick-50 text-brick-600',
            )}
          >
            <p className="font-medium">
              {selected === question.answer_index
                ? 'Correct!'
                : `Not quite — the answer is ${String.fromCharCode(65 + question.answer_index)}.`}
            </p>
            {question.explanation ? (
              <p className="mt-1 text-ink-600">{question.explanation}</p>
            ) : null}
          </div>
        ) : null}

        {answered ? (
          <Button size="md" onClick={advance} className="w-full">
            {index + 1 >= total ? 'See my score' : 'Next question'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function GenerateState({
  icon: Icon,
  title,
  description,
  error,
  disabled,
  onGenerate,
  label,
}: {
  icon: typeof Layers
  title: string
  description: string
  error: string | null
  disabled: boolean
  onGenerate: () => void
  label: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="rounded-full bg-clay-600/10 p-3">
        <Icon className="size-5 text-clay-600" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-sm font-medium text-ink-700">{title}</p>
      <p className="max-w-xs text-xs leading-5 text-ink-500">{description}</p>
      {error ? (
        <p className="max-w-xs rounded-lg border border-brick-600/25 bg-brick-50 px-3 py-2 text-xs text-brick-600">
          {error}
        </p>
      ) : null}
      <Button size="md" onClick={onGenerate} disabled={disabled}>
        <Sparkles className="size-4" aria-hidden="true" />
        {label}
      </Button>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'ochre' | 'brick'; children: ReactNode }) {
  const toneClass =
    tone === 'ochre'
      ? 'border-ochre-600/25 bg-ochre-50 text-ochre-600'
      : 'border-brick-600/25 bg-brick-50 text-brick-600'
  return (
    <div className={cn('rounded-lg border px-3.5 py-3 text-sm leading-6', toneClass)}>
      {children}
    </div>
  )
}

function ProgressState({ label }: { label: string }) {
  return (
    <div className="space-y-5 py-6" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <Spinner className="size-4" />
        {label}
      </div>
      <div className="space-y-2.5">
        <div className="h-2.5 w-full animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-11/12 animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-parchment-200" />
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="max-w-xs text-sm text-brick-600">{message}</p>
      <Button size="md" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
