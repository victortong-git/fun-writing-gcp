import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'

/**
 * API Client for Fun Writing Backend
 * Handles authentication, error handling, and caching
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3088/api'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000')

// Cache storage
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Create API client instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor - adds auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor - handles errors and caching
 */
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      cache.set(response.config.url || '', {
        data: response.data,
        timestamp: Date.now(),
      })
    }
    return response
  },
  (error: AxiosError) => {
    // Handle 401 - token expired
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // Return cached data if available and request fails
    if (error.config?.method === 'get') {
      const cached = cache.get(error.config.url || '')
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.warn('[API] Using cached response for:', error.config.url)
        return Promise.resolve({
          ...error.response,
          data: cached.data,
        } as AxiosResponse)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Clear cache
 */
export function clearCache(): void {
  cache.clear()
  console.log('[API] Cache cleared')
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  cache.delete(key)
}

/**
 * API response type
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T = any> {
  success: boolean
  data: {
    [key: string]: any
    pagination?: {
      total: number
      page: number
      limit: number
      totalPages: number
      hasMore: boolean
    }
  }
}

export default apiClient
