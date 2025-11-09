import apiClient, { PaginatedResponse } from './api'

/**
 * Writing Service
 * Handles writing prompts, submissions, and related operations
 */

export interface Theme {
  name: string
}

export interface WritingType {
  name: string
  count: number
}

export interface Topic {
  id: string
  title: string
  theme?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface WritingPrompt {
  id: string
  title: string
  prompt: string
  description?: string
  instructions?: string[]
  type: 'creative' | 'persuasive' | 'descriptive' | 'narrative' | 'informative' | 'poems'
  theme?: string
  ageGroup: string
  difficulty: 'easy' | 'medium' | 'hard'
  wordCountTarget?: number
  wordCountMin?: number
  wordCountMax?: number
  timeLimit?: number
  category: 'practice' | 'quiz' | 'assessment'
}

export interface WritingSubmission {
  id: string
  promptId: string
  promptTitle: string
  theme: string
  promptType?: string
  content: string
  wordCount: number
  timeSpent?: number
  score?: number
  feedback?: any
  status: 'submitted' | 'reviewing' | 'reviewed' | 'revised'
  createdAt: string
  updatedAt: string
}

export interface SubmissionRequest {
  promptId: string
  content: string
  wordCount?: number
  timeSpent?: number
  noCopyPasteCheck?: boolean
}

/**
 * Get available writing types
 */
export async function getTypes(): Promise<WritingType[]> {
  try {
    const response = await apiClient.get<{
      success: boolean
      types: WritingType[]
      totalTypes: number
    }>('/writing/types')
    return response.data.types
  } catch (error: any) {
    console.error('Failed to fetch writing types:', error)
    throw error
  }
}

/**
 * Get topics (prompts) for a specific writing type and age group
 */
export async function getTopics(ageGroup: string, type: string): Promise<Topic[]> {
  try {
    const response = await apiClient.get<{
      success: boolean
      topics: Topic[]
      totalTopics: number
    }>(`/writing/topics/${ageGroup}/${type}`)

    if (!response.data.success || !response.data.topics) {
      throw new Error('Failed to fetch topics')
    }

    return response.data.topics
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch topics'
    throw new Error(message)
  }
}

/**
 * Get available themes (for backward compatibility with creative writing)
 */
export async function getThemes(): Promise<string[]> {
  try {
    const response = await apiClient.get<{ success: boolean; themes: string[] }>(
      '/writing/themes'
    )
    return response.data.themes
  } catch (error: any) {
    console.error('Failed to fetch themes:', error)
    throw error
  }
}

/**
 * Get writing prompt by ID
 */
export async function getPromptById(promptId: string): Promise<WritingPrompt> {
  try {
    const response = await apiClient.get<{ success: boolean; prompt: WritingPrompt }>(
      `/writing/prompt/${promptId}`
    )

    if (!response.data.success || !response.data.prompt) {
      throw new Error('Failed to fetch prompt')
    }

    return response.data.prompt
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch prompt'
    throw new Error(message)
  }
}

/**
 * Get writing prompt for age group and theme/type
 */
export async function getPrompt(
  ageGroup: string,
  theme: string
): Promise<WritingPrompt> {
  try {
    const response = await apiClient.get<{ success: boolean; prompt: WritingPrompt }>(
      `/writing/prompts/${ageGroup}/${theme}`
    )

    if (!response.data.success || !response.data.prompt) {
      throw new Error('Failed to fetch prompt')
    }

    return response.data.prompt
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch prompt'
    throw new Error(message)
  }
}

/**
 * Submit writing for feedback
 */
export async function submitWriting(data: SubmissionRequest): Promise<{
  success: boolean
  message: string
  submission: {
    id: string
    status: string
    wordCount: number
    theme: string
    promptTitle: string
  }
}> {
  try {
    // Use extended timeout for submission (2.5 minutes) to allow AI analysis to complete
    const response = await apiClient.post('/writing/submit', data, {
      timeout: 150000 // 150 seconds = 2.5 minutes
    })

    if (!response.data.success) {
      throw new Error(response.data.error || 'Submission failed')
    }

    return response.data
  } catch (error: any) {
    // Preserve the full error object if available, otherwise create a simple error object
    const errorData = error.response?.data || {}
    const errorObject = {
      error: errorData.error || 'Failed to submit writing',
      message: errorData.message,
      reason: errorData.reason,
      details: errorData.details,
      indicators: errorData.indicators,
      minWords: errorData.minWords,
      maxWords: errorData.maxWords,
      actualWords: errorData.actualWords,
    }

    // Create error with attached metadata
    const err = new Error(errorObject.error)
    ;(err as any).errorObject = errorObject
    throw err
  }
}

/**
 * Get user submissions with pagination
 */
export async function getSubmissions(
  page: number = 1,
  limit: number = 10
): Promise<{
  submissions: WritingSubmission[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}> {
  try {
    const response = await apiClient.get<PaginatedResponse<WritingSubmission>>(
      '/writing/submissions',
      {
        params: { page, limit },
      }
    )

    if (!response.data.success) {
      throw new Error('Failed to fetch submissions')
    }

    const data = response.data.data
    return {
      submissions: data.submissions || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      totalPages: data.pagination?.totalPages || 1,
      hasMore: data.pagination?.hasMore || false,
    }
  } catch (error: any) {
    console.error('Failed to fetch submissions:', error)
    throw error
  }
}

/**
 * Get specific submission details
 */
export async function getSubmissionDetails(submissionId: string): Promise<WritingSubmission> {
  try {
    const response = await apiClient.get<{
      success: boolean
      submission: WritingSubmission & { media: any[] }
    }>(`/writing/submissions/${submissionId}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch submission')
    }

    return response.data.submission
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to fetch submission'
    throw new Error(message)
  }
}

/**
 * Delete submission
 */
export async function deleteSubmission(submissionId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await apiClient.delete(`/writing/submissions/${submissionId}`)

    if (!response.data.success) {
      throw new Error('Failed to delete submission')
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to delete submission'
    throw new Error(message)
  }
}

/**
 * Re-analyze submission to regenerate feedback
 */
export async function reanalyzeSubmission(submissionId: string): Promise<{
  success: boolean
  message: string
  submission: WritingSubmission & { media: any[] }
}> {
  try {
    // Use extended timeout for re-analysis (2 minutes) to allow AI analysis to complete
    const response = await apiClient.post(
      `/writing/submissions/${submissionId}/reanalyze`,
      {},
      {
        timeout: 120000 // 120 seconds = 2 minutes
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Re-analysis failed')
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || error.response?.data?.details || 'Failed to re-analyze submission'
    throw new Error(message)
  }
}
