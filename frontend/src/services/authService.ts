import apiClient, { ApiResponse } from './api'

/**
 * Authentication Service
 * Handles user login, signup, and token management
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name?: string
  email: string
  password: string
  age?: number
  ageGroup?: string
}

export interface AuthResponse {
  success: boolean
  user: {
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
  token: string
  trialEndDate?: string
  initialCredits?: number
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminAuthResponse {
  success: boolean
  admin: {
    id: string
    email: string
    name?: string
    role: string
  }
  token: string
  role: string
}

/**
 * Register a new user
 */
export async function registerUser(data: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)

    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Registration failed'
    throw new Error(message)
  }
}

/**
 * Login user
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)

    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Login failed'
    throw new Error(message)
  }
}

/**
 * Admin login
 */
export async function adminLogin(data: AdminLoginRequest): Promise<AdminAuthResponse> {
  try {
    const response = await apiClient.post<AdminAuthResponse>('/auth/admin/login', data)

    if (response.data.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('admin', JSON.stringify(response.data.admin))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Admin login failed'
    throw new Error(message)
  }
}

/**
 * Validate current token
 */
export async function validateToken(): Promise<boolean> {
  try {
    const response = await apiClient.post<ApiResponse>('/auth/validate-token')
    return response.data.success
  } catch {
    return false
  }
}

/**
 * Refresh token
 */
export async function refreshToken(): Promise<string> {
  try {
    const response = await apiClient.post<{ success: boolean; token: string }>(
      '/auth/refresh-token'
    )

    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token)
      return response.data.token
    }

    throw new Error('Token refresh failed')
  } catch (error: any) {
    throw new Error(error.message || 'Token refresh failed')
  }
}

/**
 * Logout user
 */
export function logoutUser(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('admin')
}

/**
 * Get stored user
 */
export function getStoredUser(): any {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

/**
 * Get stored admin
 */
export function getStoredAdmin(): any {
  const admin = localStorage.getItem('admin')
  return admin ? JSON.parse(admin) : null
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken') && !!getStoredUser()
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem('adminToken') && !!getStoredAdmin()
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Get admin token
 */
export function getAdminToken(): string | null {
  return localStorage.getItem('adminToken')
}

/**
 * Update user profile
 */
export interface UpdateProfileRequest {
  name?: string
  email?: string
  age?: number
  ageGroup?: string
  avatar?: string
}

export interface UpdateProfileResponse {
  success: boolean
  message: string
  user: {
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
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    const response = await apiClient.put<UpdateProfileResponse>('/user/profile', data)

    if (response.data.success && response.data.user) {
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to update profile'
    throw new Error(message)
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File): Promise<UpdateProfileResponse> {
  try {
    const formData = new FormData()
    formData.append('profilePicture', file)

    const response = await apiClient.post<UpdateProfileResponse>('/user/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success && response.data.user) {
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to upload profile picture'
    throw new Error(message)
  }
}

/**
 * Delete profile picture
 */
export async function deleteProfilePicture(): Promise<UpdateProfileResponse> {
  try {
    const response = await apiClient.delete<UpdateProfileResponse>('/user/profile-picture')

    if (response.data.success && response.data.user) {
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error: any) {
    const message = error.response?.data?.error || 'Failed to delete profile picture'
    throw new Error(message)
  }
}
