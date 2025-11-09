import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export interface Media {
  id: string
  submissionId: string
  mediaType: 'image' | 'video'
  imageUrl?: string
  videoUrl?: string
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed'
  creditsUsed: number
  createdAt: string
}

export interface MediaState {
  mediaItems: Media[]
  generatingImages: boolean
  generatingVideo: boolean
  imageGenerationError: string | null
  videoGenerationError: string | null
  loading: boolean
  error: string | null
}

const initialState: MediaState = {
  mediaItems: [],
  generatingImages: false,
  generatingVideo: false,
  imageGenerationError: null,
  videoGenerationError: null,
  loading: false,
  error: null,
}

// Async thunks for media operations
// These will be implemented when mediaService.ts is created
export const generateImages = createAsyncThunk(
  'media/generateImages',
  async (
    { submissionId, description }: { submissionId: string; description: string },
    { rejectWithValue }
  ) => {
    try {
      // Implementation will use mediaService
      return { submissionId, mediaType: 'image' }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const generateVideo = createAsyncThunk(
  'media/generateVideo',
  async (
    { submissionId, description }: { submissionId: string; description: string },
    { rejectWithValue }
  ) => {
    try {
      // Implementation will use mediaService
      return { submissionId, mediaType: 'video' }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Media slice
const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearImageError: (state) => {
      state.imageGenerationError = null
    },
    clearVideoError: (state) => {
      state.videoGenerationError = null
    },
    addMedia: (state, action) => {
      state.mediaItems.push(action.payload)
    },
    removeMedia: (state, action) => {
      state.mediaItems = state.mediaItems.filter((m) => m.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    // Generate images
    builder
      .addCase(generateImages.pending, (state) => {
        state.generatingImages = true
        state.imageGenerationError = null
      })
      .addCase(generateImages.fulfilled, (state) => {
        state.generatingImages = false
      })
      .addCase(generateImages.rejected, (state, action) => {
        state.generatingImages = false
        state.imageGenerationError = action.payload as string
      })

    // Generate video
    builder
      .addCase(generateVideo.pending, (state) => {
        state.generatingVideo = true
        state.videoGenerationError = null
      })
      .addCase(generateVideo.fulfilled, (state) => {
        state.generatingVideo = false
      })
      .addCase(generateVideo.rejected, (state, action) => {
        state.generatingVideo = false
        state.videoGenerationError = action.payload as string
      })
  },
})

export const { clearError, clearImageError, clearVideoError, addMedia, removeMedia } =
  mediaSlice.actions
export default mediaSlice.reducer
