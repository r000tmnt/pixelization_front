export interface ImageProcessResult {
  file: File
  downscaled: boolean
  width: number
  height: number
}

/**
 * Loads an image from a File and retrieves its natural dimensions and HTMLImageElement.
 */
export const getImageMetadata = (
  file: File,
): Promise<{ width: number; height: number; img: HTMLImageElement }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Browser environment required to process images'))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Invalid image dimensions'))
        return
      }
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        img,
      })
    }

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl)
      reject(error)
    }

    img.src = objectUrl
  })
}

/**
 * Checks image dimensions and automatically downscales the image if either width or height
 * exceeds maxDimension while preserving aspect ratio.
 *
 * - If dimensions <= maxDimension: returns the original file untouched.
 * - If dimensions > maxDimension: downscales via offscreen canvas with high quality smoothing.
 * - Throws error if decoding or canvas creation fails, allowing graceful fallback handling.
 */
export const downscaleImageIfNeeded = async (
  file: File,
  maxDimension: number,
): Promise<ImageProcessResult> => {
  const { width, height, img } = await getImageMetadata(file)

  if (width <= maxDimension && height <= maxDimension) {
    return {
      file,
      downscaled: false,
      width,
      height,
    }
  }

  const maxEdge = Math.max(width, height)
  const scale = maxDimension / maxEdge
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  const mimeType = file.type || 'image/png'
  const quality = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? 0.92 : undefined

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mimeType, quality)
  })

  if (!blob) {
    throw new Error('Failed to create downscaled image blob')
  }

  const downscaledFile = new File([blob], file.name, {
    type: blob.type || mimeType,
    lastModified: Date.now(),
  })

  return {
    file: downscaledFile,
    downscaled: true,
    width: targetWidth,
    height: targetHeight,
  }
}

