import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './useRedux'
import {
  fetchThemes,
  fetchPrompt,
  fetchPromptById,
  submitWritingAsync,
  fetchSubmissions,
  fetchSubmissionDetails,
  deleteSubmissionAsync,
  clearError,
  clearCurrentPrompt,
  clearSelectedSubmission,
} from '../store/slices/writingSlice'

export const useWriting = () => {
  const dispatch = useAppDispatch()
  const writing = useAppSelector((state) => state.writing)

  const loadThemes = useCallback(async () => {
    const result = await dispatch(fetchThemes())
    return result.payload
  }, [dispatch])

  const loadPrompt = useCallback(
    async (ageGroup: string, theme: string) => {
      const result = await dispatch(fetchPrompt({ ageGroup, theme }))
      return result.payload
    },
    [dispatch]
  )

  const loadPromptById = useCallback(
    async (promptId: string) => {
      const result = await dispatch(fetchPromptById(promptId))
      return result.payload
    },
    [dispatch]
  )

  const submitWriting = useCallback(
    async (data: {
      promptId: string
      content: string
      wordCount?: number
      timeSpent?: number
      noCopyPasteCheck?: boolean
    }) => {
      const result = await dispatch(submitWritingAsync(data))
      return result.payload
    },
    [dispatch]
  )

  const loadSubmissions = useCallback(
    async (page: number = 1, limit: number = 10) => {
      const result = await dispatch(fetchSubmissions({ page, limit }))
      return result.payload
    },
    [dispatch]
  )

  const loadSubmissionDetails = useCallback(
    async (submissionId: string) => {
      const result = await dispatch(fetchSubmissionDetails(submissionId))
      return result.payload
    },
    [dispatch]
  )

  const deleteSubmission = useCallback(
    async (submissionId: string) => {
      const result = await dispatch(deleteSubmissionAsync(submissionId))
      return result.payload
    },
    [dispatch]
  )

  const clearPrompt = useCallback(() => {
    dispatch(clearCurrentPrompt())
  }, [dispatch])

  const clearSubmission = useCallback(() => {
    dispatch(clearSelectedSubmission())
  }, [dispatch])

  const clear = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return {
    themes: writing.themes,
    currentPrompt: writing.currentPrompt,
    submissions: writing.submissions,
    selectedSubmission: writing.selectedSubmission,
    pagination: writing.pagination,
    loading: writing.loading,
    submitting: writing.submitting,
    error: writing.error,
    errorObject: writing.errorObject,
    loadThemes,
    loadPrompt,
    loadPromptById,
    submitWriting,
    loadSubmissions,
    loadSubmissionDetails,
    deleteSubmission,
    clearPrompt,
    clearSubmission,
    clearError: clear,
  }
}
