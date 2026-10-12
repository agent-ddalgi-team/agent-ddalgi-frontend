import React, { useEffect, useRef } from 'react'

interface ConfettiProps {
  duration?: number // 지속 시간 (ms)
  onComplete?: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  vRot: number
  alpha: number
  shape: 'rect' | 'circle'
}

const COLORS = [
  '#007A78', // 브랜드 틸
  '#0F766E', // 딥 틸
  '#14B8A6', // 라이트 틸
  '#F59E0B', // 골드 앰버
  '#3B82F6', // 블루
  '#EC4899', // 핑크
  '#10B981', // 에메랄드
]

export const Confetti: React.FC<ConfettiProps> = ({
  duration = 3000,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const startTime = Date.now()
    const particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 파티클 70개 초기화 (상단 중앙에서 부드럽게 흩뿌려짐)
    const count = 75
    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 4, // 위로 솟구치다가
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      })
    }

    const render = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let aliveCount = 0

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.28 // 중력
        p.vx *= 0.985 // 공기 저항
        p.rotation += p.vRot

        // 2초 이후 서서히 페이드 아웃
        if (elapsed > duration * 0.65) {
          p.alpha = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35))
        }

        if (p.alpha > 0 && p.y < canvas.height + 20) {
          aliveCount++
          ctx.save()
          ctx.globalAlpha = p.alpha
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)
          ctx.fillStyle = p.color

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }
      }

      if (elapsed < duration && aliveCount > 0) {
        animId = requestAnimationFrame(render)
      } else {
        onComplete?.()
      }
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [duration, onComplete])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    />
  )
}
