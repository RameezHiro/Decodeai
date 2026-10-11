export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface ExplainRequest {
  image: File
  question: string
  level: LearningLevel
}

export interface Explanation {
  title: string
  summary: string
  key_concepts: string[]
  steps: string[]
  example: string
  uncertainties: string[]
}

export interface QuizRequest {
  image: File
  question: string
  level: LearningLevel
  context: string
}

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct_index: number
  explanation: string
}

export interface QuizResponse {
  questions: [QuizQuestion, QuizQuestion, QuizQuestion]
}
