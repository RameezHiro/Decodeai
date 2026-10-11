import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, CircleHelp, GraduationCap, LoaderCircle, Network, Sparkles } from 'lucide-react'
import UploadField from './components/UploadField'
import ResultView from './components/ResultView'
import QuizPanel from './components/QuizPanel'
import HeroScene from './components/HeroScene'
import ThemeSwitcher from './components/ThemeSwitcher'
import { ApiError, checkHealth, explainImage, generateQuiz } from './services/api'
import type { Explanation, LearningLevel, QuizResponse } from './types'

function App() {
  const [image, setImage] = useState<File | null>(null)
  const [question, setQuestion] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [level, setLevel] = useState<LearningLevel>('Beginner')
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [requestQuestion, setRequestQuestion] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainError, setExplainError] = useState('')
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    checkHealth().then((online) => { if (active) setApiOnline(online) })
    return () => { active = false }
  }, [])

  const runExplanation = async (nextQuestion: string) => {
    if (!image || !nextQuestion.trim()) return
    setRequestQuestion(nextQuestion.trim())
    setExplainLoading(true)
    setExplainError('')
    setQuiz(null)
    setQuizError('')
    try {
      const result = await explainImage(image, nextQuestion.trim(), level)
      setExplanation(result)
      setApiOnline(true)
    } catch (error) {
      setExplainError(error instanceof Error ? error.message : 'The explanation request failed.')
      setApiOnline(error instanceof ApiError ? typeof error.status === 'number' : false)
    } finally {
      setExplainLoading(false)
    }
  }

  const submitMainQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runExplanation(question)
  }

  const submitFollowUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runExplanation(followUp)
    setQuestion(followUp)
    setFollowUp('')
  }

  const createQuiz = async () => {
    if (!image || !explanation || !requestQuestion) return
    setQuizLoading(true)
    setQuizError('')
    try {
      const context = [
        `Explanation title: ${explanation.title}`,
        `Summary: ${explanation.summary}`,
        explanation.key_concepts.length ? `Key concepts: ${explanation.key_concepts.join('; ')}` : '',
        explanation.steps.length ? `Steps: ${explanation.steps.join('; ')}` : '',
        explanation.example ? `Example: ${explanation.example}` : '',
      ].filter(Boolean).join('\n')
      const result = await generateQuiz(image, requestQuestion, level, context)
      setQuiz(result)
      setApiOnline(true)
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'The quiz request failed.')
      setApiOnline(error instanceof ApiError ? typeof error.status === 'number' : false)
    } finally {
      setQuizLoading(false)
    }
  }

  const apiStatus = apiOnline === null ? 'Checking connection' : apiOnline ? 'API connected' : 'API unavailable'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Decode AI home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>decode<span className="brand-ai">ai</span></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href="#workspace">Workspace</a>
          <a href="#practice">Practice</a>
        </nav>
        <div className="topbar-right">
          <span className={`api-status ${apiOnline === true ? 'status-online' : apiOnline === false ? 'status-offline' : ''}`} title={apiStatus}>
            <span className="status-dot" />{apiStatus}
          </span>
          <span className="level-chip"><GraduationCap size={14} /> Study mode</span>
          <ThemeSwitcher />
        </div>
      </header>

      <main id="top">
        <section className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="eyebrow-rule" /> YOUR POCKET EXPLAINER</p>
            <h1 className="hero-title">Understand anything.<br /><em>One image at a time.</em></h1>
            <p className="hero-lead">Make the things that feel complicated feel clear. Start with a diagram, a page, or a problem you can’t quite solve.</p>
            <div className="hero-actions">
              <a className="hero-cta" href="#workspace"><span>Start with an image</span><ArrowRight size={16} /></a>
              <span className="hero-flow"><span>01</span> Upload <i /> Ask <i /> Understand</span>
            </div>
          </div>
          <div className="hero-visual-wrap"><HeroScene /></div>
        </section>

        <section className="workspace" id="workspace" aria-label="Image explanation workspace">
          <aside className="input-column">
            <div className="input-card">
              <UploadField image={image} onImageChange={(file) => { setImage(file); setExplanation(null); setExplainError(''); setQuiz(null); setQuizError('') }} disabled={explainLoading || quizLoading} />
              <div className="form-divider" />
              <form onSubmit={submitMainQuestion}>
                <div className="section-heading question-heading">
                  <span className="step-number">02</span>
                  <div><h2>Your question</h2><p>There’s no such thing as too basic.</p></div>
                </div>
                <label className="visually-hidden" htmlFor="main-question">What would you like to understand about this image?</label>
                <textarea
                  id="main-question"
                  className="question-input"
                  placeholder="What would you like to understand about this image?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  maxLength={1500}
                />
                <div className="input-meta"><span>{question.length}/1500</span><span><CircleHelp size={13} /> Be as specific as you like</span></div>

                <div className="level-control">
                  <div><label htmlFor="learning-level">Explain it at</label><span>Adjust the depth to suit you</span></div>
                  <select id="learning-level" value={level} onChange={(event) => setLevel(event.target.value as LearningLevel)} disabled={explainLoading}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>

                <button className="primary-button explain-button" type="submit" disabled={!image || !question.trim() || explainLoading}>
                  {explainLoading && !explanation ? <><LoaderCircle size={17} className="spin" /> Thinking through it…</> : <><Sparkles size={16} /> Explain this <ArrowRight size={16} /></>}
                </button>
                <p className="privacy-note"><Network size={12} /> Your image is sent to your connected API for analysis.</p>
              </form>
            </div>
            <div className="workflow-note"><span className="note-icon"><BookOpen size={16} /></span><div><strong>Learn it, don’t just look it up.</strong><p>Clear explanations, then a quick check to help it stick.</p></div></div>
          </aside>

          <div className="results-column">
            <ResultView
              explanation={explanation}
              loading={explainLoading}
              error={explainError}
              hasImage={Boolean(image)}
              onRetry={() => { if (requestQuestion) void runExplanation(requestQuestion) }}
            />

            {explanation && (
              <>
                <form className="followup-form" onSubmit={submitFollowUp}>
                  <span className="followup-mark"><span>↳</span></span>
                  <label className="visually-hidden" htmlFor="follow-up">Ask a follow-up question</label>
                  <input id="follow-up" type="text" value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Still curious? Ask a follow-up…" maxLength={1500} />
                  <button type="submit" aria-label="Send follow-up question" disabled={!image || !followUp.trim() || explainLoading}><ArrowRight size={17} /></button>
                </form>
                <QuizPanel
                  quiz={quiz}
                  loading={quizLoading}
                  error={quizError}
                  onGenerate={() => void createQuiz()}
                  canGenerate={!quizLoading && !explainLoading && Boolean(image && explanation)}
                />
              </>
            )}
          </div>
        </section>
      </main>
      <footer className="site-footer"><span>Decode AI</span><span>Understand the idea behind the image.</span><span>Built for curious minds <span className="footer-star">✳</span></span></footer>
    </div>
  )
}

export default App
