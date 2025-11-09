import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3088/api'

// Create a separate axios instance for admin API calls
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include admin token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear admin token and redirect
      localStorage.removeItem('adminToken')
      localStorage.removeItem('admin')
      window.location.href = '/platform-admin/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  trialUsers: number
  totalSubmissions: number
  totalPrompts: number
  avgSubmissionsPerUser: string
}

export interface User {
  id: string
  email: string
  name?: string
  age?: number
  ageGroup?: string
  aiCredits: number
  totalScore: number
  level: number
  streak: number
  subscriptionStatus: 'trial' | 'active' | 'inactive' | 'cancelled'
  isActive: boolean
  trialEndDate?: string
  createdAt: string
  updatedAt: string
}

export interface UserDetails extends User {
  stats: {
    totalSubmissions: number
    totalScore: number
    aiCredits: number
    level: number
    streak: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  subscriptionStatus?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    users?: T[]
    prompts?: T[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  age?: number
  ageGroup?: string
  subscriptionStatus?: 'trial' | 'active' | 'inactive' | 'cancelled'
  isActive?: boolean
}

export interface UpdateCreditsRequest {
  aiCredits: number
  action?: 'set' | 'add' | 'subtract'
}

// Admin API Methods

/**
 * Get platform statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const response = await adminApiClient.get('/admin/stats')
    return response.data.stats
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch statistics')
  }
}

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
  try {
    const response = await adminApiClient.get('/admin/users', { params })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch users')
  }
}

/**
 * Get specific user details
 */
export async function getUserDetails(userId: string): Promise<UserDetails> {
  try {
    const response = await adminApiClient.get(`/admin/users/${userId}`)
    return response.data.user
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch user details')
  }
}

/**
 * Update user details
 */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  try {
    const response = await adminApiClient.put(`/admin/users/${userId}`, data)
    return response.data.user
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update user')
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(
  userId: string,
  data: UpdateCreditsRequest
): Promise<User> {
  try {
    const response = await adminApiClient.patch(`/admin/users/${userId}/credits`, data)
    return response.data.user
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update credits')
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await adminApiClient.delete(`/admin/users/${userId}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete user')
  }
}

/**
 * Create new user
 */
export async function createUser(data: {
  name?: string
  email: string
  password: string
  age?: number
  ageGroup?: string
  aiCredits?: number
  subscriptionStatus?: 'trial' | 'active' | 'inactive' | 'cancelled'
}): Promise<User> {
  try {
    const response = await adminApiClient.post('/admin/users', data)
    return response.data.user
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create user')
  }
}
