import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  registerUser as apiRegisterUser,
  loginUser as apiLoginUser,
  adminLogin as apiAdminLogin,
  logoutUser as apiLogoutUser,
  logoutAdmin as apiLogoutAdmin,
  getStoredUser,
  getStoredAdmin,
} from '../../services/authService'

export interface User {
  id: string
  email: string
  name?: string
  age?: number
  ageGroup?: string
  aiCredits: number
  totalScore: number
  level: number
  profilePictureUrl?: string
}

export interface Admin {
  id: string
  email: string
  name?: string
  role: string
}

export interface AuthState {
  user: User | null
  admin: Admin | null
  isUserAuthenticated: boolean
  isAdminAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: getStoredUser(),
  admin: getStoredAdmin(),
  isUserAuthenticated: !!getStoredUser(),
  isAdminAuthenticated: !!getStoredAdmin(),
  loading: false,
  error: null,
}

// Async thunks
export const registerUserAsync = createAsyncThunk(
  'auth/registerUser',
  async (
    data: { name?: string; email: string; password: string; age?: number; ageGroup?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiRegisterUser(data)
      return response.user
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const loginUserAsync = createAsyncThunk(
  'auth/loginUser',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiLoginUser(data)
      return response.user
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const adminLoginAsync = createAsyncThunk(
  'auth/adminLogin',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiAdminLogin(data)
      return response.admin
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      apiLogoutUser()
      state.user = null
      state.isUserAuthenticated = false
      state.error = null
    },
    logoutAdmin: (state) => {
      apiLogoutAdmin()
      state.admin = null
      state.isAdminAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isUserAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isUserAuthenticated = true
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Login user
    builder
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isUserAuthenticated = true
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Admin login
    builder
      .addCase(adminLoginAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(adminLoginAsync.fulfilled, (state, action) => {
        state.loading = false
        state.admin = action.payload
        state.isAdminAuthenticated = true
      })
      .addCase(adminLoginAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logoutUser, logoutAdmin, clearError, updateUser, setUser } = authSlice.actions
export default authSlice.reducer
