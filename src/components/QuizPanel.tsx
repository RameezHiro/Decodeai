import { useState } from 'react'
import { AlertCircle, Check, ChevronRight, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react'
import type { QuizResponse } from '../types'

interface QuizPanelProps {
  quiz: QuizResponse | null
  loading: boolean
  error: string
  onGenerate: () => void
  canGenerate: boolean
}

export default function QuizPanel({ quiz, loading, error, onGenerate, canGenerate }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)
  const [localError, setLocalError] = useState('')

  const checkAnswers = () => {
    if (!quiz) return
    if (quiz.questions.some((_, index) => answers[index] === undefined)) {
      setLocalError('Choose an answer for each question before checking.')
      return
    }
    setLocalError('')
    setChecked(true)
  }

  const retry = () => {
    setAnswers({})
    setChecked(false)
    setLocalError('')
  }

  const score = quiz?.questions.reduce((total, item, index) => total + (answers[index] === item.correct_index ? 1 : 0), 0) ?? 0

  return (
    <section className="quiz-section" id="practice" aria-labelledby="quiz-title">
      <div className="quiz-header">
        <div>
          <div className="quiz-eyebrow"><span className="quiz-symbol"><Sparkles size={13} /></span> PUT IT INTO PRACTICE</div>
          <h2 id="quiz-title">Quick check</h2>
          <p>Three questions to see what stuck.</p>
        </div>
        {quiz && !checked && <span className="question-count">03 QUESTIONS</span>}
      </div>

      {error && <div className="inline-error quiz-error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="inline-retry" onClick={onGenerate}>Retry</button></div>}

      {!quiz && !loading && (
        <div className="quiz-empty">
          <div className="quiz-empty-mark">03</div>
          <div><strong>Ready when you are.</strong><p>Generate a short quiz based on this image and explanation.</p></div>
          <button type="button" className="quiz-generate" onClick={onGenerate} disabled={!canGenerate}>Create quiz <ChevronRight size={16} /></button>
        </div>
      )}

      {loading && <div className="quiz-loading" aria-live="polite"><LoaderCircle size={18} /><span>Creating three questions from your material…</span></div>}

      {quiz && (
        <>
          {checked && <div className="score-banner" aria-live="polite"><span className="score-check"><Check size={16} /></span><div><strong>{score} of 3 correct</strong><span>{score === 3 ? 'Excellent work — you’ve got it.' : score === 0 ? 'A good starting point. Review the explanation and try again.' : 'Nice progress. See what to revisit below.'}</span></div></div>}
          <div className="quiz-questions">
            {quiz.questions.map((item, questionIndex) => (
              <fieldset className="quiz-question" key={`${questionIndex}-${item.question}`}>
                <legend><span className="question-number">Q{questionIndex + 1}</span><span>{item.question}</span></legend>
                <div className="option-list">
                  {item.options.map((option, optionIndex) => {
                    const isSelected = answers[questionIndex] === optionIndex
                    const isCorrect = optionIndex === item.correct_index
                    const stateClass = checked ? (isCorrect ? 'option-correct' : isSelected ? 'option-wrong' : '') : isSelected ? 'option-selected' : ''
                    return (
                      <label key={`${optionIndex}-${option}`} className={`quiz-option ${stateClass} ${checked ? 'option-disabled' : ''}`}>
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={isSelected}
                          disabled={checked}
                          onChange={() => { setAnswers((current) => ({ ...current, [questionIndex]: optionIndex })); setLocalError('') }}
                        />
                        <span className="option-radio">{checked && isCorrect ? <Check size={12} /> : String.fromCharCode(65 + optionIndex)}</span>
                        <span className="option-text">{option}</span>
                        {checked && isCorrect && <span className="answer-label">Correct</span>}
                        {checked && isSelected && !isCorrect && <span className="answer-label wrong-label">Your answer</span>}
                      </label>
                    )
                  })}
                </div>
                {checked && <p className="answer-explanation"><strong>{answers[questionIndex] === item.correct_index ? 'Why it’s right' : 'The reasoning'}</strong>{item.explanation}</p>}
              </fieldset>
            ))}
          </div>
          {localError && <p className="field-error" role="alert">{localError}</p>}
          <div className="quiz-footer">
            {checked ? <button className="secondary-button" type="button" onClick={retry}><RotateCcw size={15} /> Try again</button> : <button className="primary-button check-button" type="button" onClick={checkAnswers}>Check answers <ChevronRight size={16} /></button>}
            <span>One answer per question</span>
          </div>
        </>
      )}
    </section>
  )
}
