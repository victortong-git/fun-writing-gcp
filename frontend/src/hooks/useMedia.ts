import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './useRedux'
import {
  generateImages,
  generateVideo,
  clearError,
  clearImageError,
  clearVideoError,
  addMedia,
  removeMedia,
} from '../store/slices/mediaSlice'

export const useMedia = () => {
  const dispatch = useAppDispatch()
  const media = useAppSelector((state) => state.media)

  const generateImagesForSubmission = useCallback(
    async (submissionId: string, description: string) => {
      const result = await dispatch(generateImages({ submissionId, description }))
      return result.payload
    },
    [dispatch]
  )

  const generateVideoForSubmission = useCallback(
    async (submissionId: string, description: string) => {
      const result = await dispatch(generateVideo({ submissionId, description }))
      return result.payload
    },
    [dispatch]
  )

  const addMediaItem = useCallback(
    (mediaItem) => {
      dispatch(addMedia(mediaItem))
    },
    [dispatch]
  )

  const removeMediaItem = useCallback(
    (mediaId: string) => {
      dispatch(removeMedia(mediaId))
    },
    [dispatch]
  )

  const clear = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const clearImageErr = useCallback(() => {
    dispatch(clearImageError())
  }, [dispatch])

  const clearVideoErr = useCallback(() => {
    dispatch(clearVideoError())
  }, [dispatch])

  return {
    mediaItems: media.mediaItems,
    generatingImages: media.generatingImages,
    generatingVideo: media.generatingVideo,
    imageGenerationError: media.imageGenerationError,
    videoGenerationError: media.videoGenerationError,
    loading: media.loading,
    error: media.error,
    generateImages: generateImagesForSubmission,
    generateVideo: generateVideoForSubmission,
    addMedia: addMediaItem,
    removeMedia: removeMediaItem,
    clearError: clear,
    clearImageError: clearImageErr,
    clearVideoError: clearVideoErr,
  }
}
