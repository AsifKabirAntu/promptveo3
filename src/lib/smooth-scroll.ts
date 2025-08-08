export function smoothScrollTo(elementId: string, offset: number = 80) {
  const element = document.getElementById(elementId)
  
  if (element) {
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

export function smoothScrollToWithEasing(elementId: string, offset: number = 80, duration: number = 1000) {
  const element = document.getElementById(elementId)
  
  if (!element) return

  const startPosition = window.pageYOffset
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset
  const distance = targetPosition - startPosition
  let startTime: number | null = null

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const run = easeInOutCubic(timeElapsed, startPosition, distance, duration)
    window.scrollTo(0, run)
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}

// Easing function for smooth animation
function easeInOutCubic(t: number, b: number, c: number, d: number): number {
  t /= d / 2
  if (t < 1) return c / 2 * t * t * t + b
  t -= 2
  return c / 2 * (t * t * t + 2) + b
}

// Enhanced scroll with bounce effect
export function smoothScrollWithBounce(elementId: string, offset: number = 80) {
  const element = document.getElementById(elementId)
  
  if (!element) return

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset
  const startPosition = window.pageYOffset
  const distance = targetPosition - startPosition
  let startTime: number | null = null
  const duration = 1200

  function bounceAnimation(currentTime: number) {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = timeElapsed / duration
    
    // Bounce easing function
    const bounce = 1 - Math.pow(1 - progress, 3)
    const run = startPosition + distance * bounce
    
    window.scrollTo(0, run)
    
    if (timeElapsed < duration) {
      requestAnimationFrame(bounceAnimation)
    }
  }

  requestAnimationFrame(bounceAnimation)
} 