import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getThemes as apiGetThemes,
  getPrompt as apiGetPrompt,
  getPromptById as apiGetPromptById,
  submitWriting as apiSubmitWriting,
  getSubmissions as apiGetSubmissions,
  getSubmissionDetails as apiGetSubmissionDetails,
  deleteSubmission as apiDeleteSubmission,
  WritingPrompt,
  WritingSubmission,
} from '../../services/writingService'

export interface WritingState {
  themes: string[]
  currentPrompt: WritingPrompt | null
  submissions: WritingSubmission[]
  selectedSubmission: WritingSubmission | null
  pagination: {
    total: number
    page: number
    totalPages: number
    hasMore: boolean
  }
  loading: boolean
  submitting: boolean
  error: string | null
  errorObject: any
}

const initialState: WritingState = {
  themes: [],
  currentPrompt: null,
  submissions: [],
  selectedSubmission: null,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 0,
    hasMore: false,
  },
  loading: false,
  submitting: false,
  error: null,
  errorObject: null,
}

// Async thunks
export const fetchThemes = createAsyncThunk(
  'writing/fetchThemes',
  async (_, { rejectWithValue }) => {
    try {
      const themes = await apiGetThemes()
      return themes
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPrompt = createAsyncThunk(
  'writing/fetchPrompt',
  async ({ ageGroup, theme }: { ageGroup: string; theme: string }, { rejectWithValue }) => {
    try {
      const prompt = await apiGetPrompt(ageGroup, theme)
      return prompt
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPromptById = createAsyncThunk(
  'writing/fetchPromptById',
  async (promptId: string, { rejectWithValue }) => {
    try {
      const prompt = await apiGetPromptById(promptId)
      return prompt
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitWritingAsync = createAsyncThunk(
  'writing/submitWriting',
  async (
    data: { promptId: string; content: string; wordCount?: number; timeSpent?: number, noCopyPasteCheck?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const result = await apiSubmitWriting(data)
      return result
    } catch (error: any) {
      // Pass the full error object including errorObject metadata
      return rejectWithValue({
        message: error.message,
        errorObject: error.errorObject
      })
    }
  }
)

export const fetchSubmissions = createAsyncThunk(
  'writing/fetchSubmissions',
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const result = await apiGetSubmissions(page, limit)
      return result
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSubmissionDetails = createAsyncThunk(
  'writing/fetchSubmissionDetails',
  async (submissionId: string, { rejectWithValue }) => {
    try {
      const submission = await apiGetSubmissionDetails(submissionId)
      return submission
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteSubmissionAsync = createAsyncThunk(
  'writing/deleteSubmission',
  async (submissionId: string, { rejectWithValue }) => {
    try {
      await apiDeleteSubmission(submissionId)
      return submissionId
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Writing slice
const writingSlice = createSlice({
  name: 'writing',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.errorObject = null
    },
    clearCurrentPrompt: (state) => {
      state.currentPrompt = null
    },
    clearSelectedSubmission: (state) => {
      state.selectedSubmission = null
    },
  },
  extraReducers: (builder) => {
    // Fetch themes
    builder
      .addCase(fetchThemes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchThemes.fulfilled, (state, action) => {
        state.loading = false
        state.themes = action.payload
      })
      .addCase(fetchThemes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch prompt
    builder
      .addCase(fetchPrompt.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPrompt.fulfilled, (state, action) => {
        state.loading = false
        state.currentPrompt = action.payload
      })
      .addCase(fetchPrompt.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch prompt by ID
    builder
      .addCase(fetchPromptById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPromptById.fulfilled, (state, action) => {
        state.loading = false
        state.currentPrompt = action.payload
      })
      .addCase(fetchPromptById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Submit writing
    builder
      .addCase(submitWritingAsync.pending, (state) => {
        state.submitting = true
        state.error = null
        state.errorObject = null
      })
      .addCase(submitWritingAsync.fulfilled, (state) => {
        state.submitting = false
        state.error = null
        state.errorObject = null
      })
      .addCase(submitWritingAsync.rejected, (state, action) => {
        state.submitting = false
        const payload = action.payload as any
        state.error = payload?.message || 'Failed to submit writing'
        state.errorObject = payload?.errorObject || null
      })

    // Fetch submissions
    builder
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.loading = false
        state.submissions = action.payload.submissions
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          hasMore: action.payload.hasMore,
        }
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch submission details
    builder
      .addCase(fetchSubmissionDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubmissionDetails.fulfilled, (state, action) => {
        state.loading = false
        state.selectedSubmission = action.payload
      })
      .addCase(fetchSubmissionDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete submission
    builder
      .addCase(deleteSubmissionAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteSubmissionAsync.fulfilled, (state, action) => {
        state.loading = false
        state.submissions = state.submissions.filter((s) => s.id !== action.payload)
        if (state.selectedSubmission?.id === action.payload) {
          state.selectedSubmission = null
        }
      })
      .addCase(deleteSubmissionAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentPrompt, clearSelectedSubmission } = writingSlice.actions
export default writingSlice.reducer
