import { useEffect, useState } from 'react'

export function hasHoverCapability(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}

export function isTouchLikeDevice(): boolean {
  return !hasHoverCapability() || isCoarsePointer()
}

export function useDeviceCapabilities(): { canHover: boolean; isCoarse: boolean; isTouchLike: boolean } {
  const canUseDOM = typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined'
  const initialHover = canUseDOM ? hasHoverCapability() : false
  const initialCoarse = canUseDOM ? isCoarsePointer() : false

  const [canHover, setCanHover] = useState<boolean>(initialHover)
  const [isCoarse, setIsCoarse] = useState<boolean>(initialCoarse)

  useEffect(() => {
    if (!canUseDOM) return
    const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqCoarse = window.matchMedia('(pointer: coarse)')

    const update = () => {
      setCanHover(mqHover.matches)
      setIsCoarse(mqCoarse.matches)
    }

    // Initialize
    update()

    mqHover.addEventListener('change', update)
    mqCoarse.addEventListener('change', update)
    return () => {
      mqHover.removeEventListener('change', update)
      mqCoarse.removeEventListener('change', update)
    }
  }, [])

  return { canHover, isCoarse, isTouchLike: !canHover || isCoarse }
}


