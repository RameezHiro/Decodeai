import { AlertCircle, ArrowRight, BookOpen, Check, Lightbulb, LoaderCircle, Sparkles } from 'lucide-react'
import type { Explanation } from '../types'

interface ResultViewProps {
  explanation: Explanation | null
  loading: boolean
  error: string
  onRetry: () => void
  hasImage: boolean
}

export default function ResultView({ explanation, loading, error, onRetry, hasImage }: ResultViewProps) {
  if (loading && !explanation) {
    return (
      <div className="empty-state loading-state" aria-live="polite">
        <div className="loading-mark"><LoaderCircle size={25} /></div>
        <p className="eyebrow">A moment to think</p>
        <h2>Reading the details…</h2>
        <p>Decode AI is working through your image and question.</p>
        <div className="progress-track"><span /></div>
      </div>
    )
  }

  if (!explanation && error) {
    return (
      <div className="empty-state error-state" role="alert">
        <span className="state-icon error-icon"><AlertCircle size={22} /></span>
        <p className="eyebrow">Couldn’t complete that request</p>
        <h2>Let’s try that again.</h2>
        <p>{error}</p>
        <button className="text-action" type="button" onClick={onRetry}>Retry request <ArrowRight size={15} /></button>
      </div>
    )
  }

  if (!explanation) {
    return (
      <div className="empty-state">
        <div className="empty-illustration" aria-hidden="true">
          <div className="illustration-paper"><span /><span /><span /><b>?</b></div>
          <div className="illustration-spark"><Sparkles size={21} /></div>
        </div>
        <p className="eyebrow">Your study space</p>
        <h2>{hasImage ? 'Ask your first question.' : 'A little more clarity, right here.'}</h2>
        <p>{hasImage ? 'Tell us what feels unclear. We’ll take it one step at a time.' : 'Add an image and a question. We’ll help you find the idea behind it.'}</p>
        <div className="empty-note"><span className="note-dot" /> Made for the things that don’t click at first</div>
      </div>
    )
  }

  return (
    <article className="explanation-card">
      {error && <div className="inline-error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="inline-retry" onClick={onRetry}>Retry</button></div>}
      {loading && <div className="request-ribbon" aria-live="polite"><LoaderCircle size={14} /> Asking a follow-up…</div>}
      <div className="result-intro">
        <div className="result-kicker"><span className="result-kicker-icon"><Sparkles size={14} /></span> YOUR EXPLANATION</div>
        <h2>{explanation.title}</h2>
        <p className="result-summary">{explanation.summary}</p>
      </div>

      {explanation.key_concepts.length > 0 && (
        <section className="result-section concepts-section">
          <div className="result-section-heading"><span className="mini-icon"><Lightbulb size={16} /></span><h3>Key concepts</h3></div>
          <ul className="concept-list">{explanation.key_concepts.map((concept, index) => <li key={`${index}-${concept}`}><span className="concept-check"><Check size={12} /></span>{concept}</li>)}</ul>
        </section>
      )}

      {explanation.steps.length > 0 && (
        <section className="result-section">
          <div className="result-section-heading"><span className="mini-icon"><BookOpen size={16} /></span><h3>Step by step</h3></div>
          <ol className="step-list">{explanation.steps.map((step, index) => <li key={`${index}-${step}`}><span className="step-index">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol>
        </section>
      )}

      {explanation.example && (
        <section className="example-box">
          <span className="example-label">A PRACTICAL EXAMPLE</span>
          <p>{explanation.example}</p>
        </section>
      )}

      {explanation.uncertainties.length > 0 && (
        <section className="uncertainty-box">
          <div className="uncertainty-title"><AlertCircle size={15} /><h3>Worth a second look</h3></div>
          <ul>{explanation.uncertainties.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
        </section>
      )}
      <div className="result-footnote">Explanation returned by your connected API</div>
    </article>
  )
}
