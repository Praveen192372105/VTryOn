import { useState, useEffect, useRef, useCallback } from "react"

export interface UseRateLimitCountdownOptions {
  onFinish?: () => void
}

export interface UseRateLimitCountdownResult {
  secondsLeft: number
  isCountingDown: boolean
  isFinished: boolean
  reset: (newSeconds?: number) => void
}

/**
 * Reusable hook that manages a live second-by-second countdown for HTTP 429 Retry-After responses.
 * Decrements every second down to 0, at which point isFinished is set to true and optional onFinish callback fires.
 */
export function useRateLimitCountdown(
  initialSeconds?: number,
  options?: UseRateLimitCountdownOptions
): UseRateLimitCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return initialSeconds && initialSeconds > 0 ? Math.ceil(initialSeconds) : 0
  })
  const [isFinished, setIsFinished] = useState<boolean>(false)

  const onFinishRef = useRef(options?.onFinish)
  onFinishRef.current = options?.onFinish

  // Reset when initialSeconds prop changes from an external response
  useEffect(() => {
    if (initialSeconds && initialSeconds > 0) {
      setSecondsLeft(Math.ceil(initialSeconds))
      setIsFinished(false)
    } else {
      setSecondsLeft(0)
      setIsFinished(false)
    }
  }, [initialSeconds])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsFinished(true)
          onFinishRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  const reset = useCallback((newSeconds?: number) => {
    if (newSeconds && newSeconds > 0) {
      setSecondsLeft(Math.ceil(newSeconds))
      setIsFinished(false)
    } else {
      setSecondsLeft(0)
      setIsFinished(false)
    }
  }, [])

  return {
    secondsLeft,
    isCountingDown: secondsLeft > 0,
    isFinished,
    reset,
  }
}
