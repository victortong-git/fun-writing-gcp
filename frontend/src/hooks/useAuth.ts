import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './useRedux'
import {
  registerUserAsync,
  loginUserAsync,
  adminLoginAsync,
  logoutUser,
  logoutAdmin,
  clearError,
  updateUser,
} from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  const register = useCallback(
    async (data: { name?: string; email: string; password: string; age?: number; ageGroup?: string }) => {
      const result = await dispatch(registerUserAsync(data))
      return result.payload
    },
    [dispatch]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(loginUserAsync({ email, password }))
      return result.payload
    },
    [dispatch]
  )

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(adminLoginAsync({ email, password }))
      return result.payload
    },
    [dispatch]
  )

  const logout = useCallback(() => {
    dispatch(logoutUser())
  }, [dispatch])

  const logoutAdminUser = useCallback(() => {
    dispatch(logoutAdmin())
  }, [dispatch])

  const clear = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const updateUserData = useCallback((data: any) => {
    dispatch(updateUser(data))
  }, [dispatch])

  return {
    user: auth.user,
    admin: auth.admin,
    isUserAuthenticated: auth.isUserAuthenticated,
    isAdminAuthenticated: auth.isAdminAuthenticated,
    loading: auth.loading,
    error: auth.error,
    register,
    login,
    adminLogin,
    logout,
    logoutAdmin: logoutAdminUser,
    clearError: clear,
    updateUser: updateUserData,
  }
}
