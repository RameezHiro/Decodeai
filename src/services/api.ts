import type { Explanation, LearningLevel, QuizResponse } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const raw = await response.text()
  let payload: unknown

  try {
    payload = raw ? JSON.parse(raw) : undefined
  } catch {
    if (!response.ok) throw new ApiError(raw || `Request failed (${response.status})`, response.status)
    throw new ApiError('The API returned a response that was not valid JSON.', response.status)
  }

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : `Request failed (${response.status})`
    throw new ApiError(detail, response.status)
  }

  return payload as T
}

async function postImage<T>(path: string, image: File, question: string, level: LearningLevel, context?: string): Promise<T> {
  const form = new FormData()
  form.append('image', image)
  form.append('question', question)
  form.append('level', level)
  if (context) form.append('context', context)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', body: form })
  } catch {
    throw new ApiError('Could not reach the Decode AI API. Check that the backend is running and the API URL is correct.')
  }
  return readResponse<T>(response)
}

function asStringArray(value: unknown, field: string): string[] {
  if (value == null) return []
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new ApiError(`The API response has an invalid "${field}" field.`)
  }
  return value
}

function asText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(`The API response is missing a valid "${field}" field.`)
  }
  return value
}

function parseExplanation(value: unknown): Explanation {
  if (typeof value !== 'object' || value === null) throw new ApiError('The API returned an invalid explanation.')
  const data = value as Record<string, unknown>
  return {
    title: asText(data.title, 'title'),
    summary: asText(data.summary, 'summary'),
    key_concepts: asStringArray(data.key_concepts, 'key_concepts'),
    steps: asStringArray(data.steps, 'steps'),
    example: typeof data.example === 'string' ? data.example : '',
    uncertainties: asStringArray(data.uncertainties, 'uncertainties'),
  }
}

function parseQuiz(value: unknown): QuizResponse {
  if (typeof value !== 'object' || value === null || !('questions' in value)) {
    throw new ApiError('The API returned an invalid quiz response.')
  }
  const questions = (value as { questions: unknown }).questions
  if (!Array.isArray(questions) || questions.length !== 3) {
    throw new ApiError('The quiz API must return exactly three questions.')
  }
  const parsed = questions.map((item, index) => {
    if (typeof item !== 'object' || item === null) throw new ApiError(`Quiz question ${index + 1} is invalid.`)
    const row = item as Record<string, unknown>
    if (typeof row.question !== 'string' || !row.question.trim()) throw new ApiError(`Quiz question ${index + 1} is missing its prompt.`)
    if (!Array.isArray(row.options) || row.options.length !== 4 || !row.options.every((option) => typeof option === 'string')) {
      throw new ApiError(`Quiz question ${index + 1} must have exactly four answer options.`)
    }
    if (!Number.isInteger(row.correct_index) || Number(row.correct_index) < 0 || Number(row.correct_index) > 3) {
      throw new ApiError(`Quiz question ${index + 1} has an invalid correct_index.`)
    }
    if (typeof row.explanation !== 'string' || !row.explanation.trim()) {
      throw new ApiError(`Quiz question ${index + 1} is missing its answer explanation.`)
    }
    return {
      question: row.question,
      options: row.options as [string, string, string, string],
      correct_index: Number(row.correct_index),
      explanation: row.explanation,
    }
  })
  return { questions: parsed as QuizResponse['questions'] }
}

export async function checkHealth(): Promise<boolean> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/health`)
  } catch {
    return false
  }
  return response.ok
}

export async function explainImage(image: File, question: string, level: LearningLevel): Promise<Explanation> {
  const response = await postImage<unknown>('/api/explain', image, question, level)
  return parseExplanation(response)
}

export async function generateQuiz(
  image: File,
  question: string,
  level: LearningLevel,
  context: string,
): Promise<QuizResponse> {
  const response = await postImage<unknown>('/api/quiz', image, question, level, context)
  return parseQuiz(response)
}
