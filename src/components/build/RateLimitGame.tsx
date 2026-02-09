import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Zap, Trophy } from 'lucide-react'

interface RateLimitGameProps {
  secondsLeft: number
}

interface FallingBlock {
  id: number
  x: number
  y: number
  color: string
  speed: number
}

const COLORS = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500']
const GAME_W = 300
const GAME_H = 200
const PADDLE_W = 60
const BLOCK_SIZE = 16

export default function RateLimitGame({ secondsLeft }: RateLimitGameProps) {
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [paddleX, setPaddleX] = useState(GAME_W / 2 - PADDLE_W / 2)
  const [blocks, setBlocks] = useState<FallingBlock[]>([])
  const [countdown, setCountdown] = useState(secondsLeft)
  const nextId = useRef(0)
  const gameRef = useRef<HTMLDivElement>(null)

  // Reset countdown when a new rate limit value comes in
  useEffect(() => {
    if (secondsLeft > 0) setCountdown(secondsLeft)
  }, [secondsLeft])

  // Tick down every second
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [countdown > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const spawnBlock = useCallback(() => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? 'bg-indigo-500'
    const block: FallingBlock = {
      id: nextId.current++,
      x: Math.random() * (GAME_W - BLOCK_SIZE),
      y: -BLOCK_SIZE,
      color,
      speed: 1.5 + Math.random() * 2,
    }
    setBlocks(prev => [...prev, block])
  }, [])

  // Game loop
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setBlocks(prev => {
        const alive: FallingBlock[] = []
        let caught = 0
        for (const b of prev) {
          const ny = b.y + b.speed
          if (ny + BLOCK_SIZE >= GAME_H - 12 && ny + BLOCK_SIZE <= GAME_H + 4) {
            if (b.x + BLOCK_SIZE > paddleX && b.x < paddleX + PADDLE_W) {
              caught++
              continue
            }
          }
          if (ny > GAME_H + 20) continue
          alive.push({ ...b, y: ny })
        }
        if (caught > 0) setScore(s => s + caught)
        return alive
      })
    }, 16)
    return () => clearInterval(interval)
  }, [playing, paddleX])

  // Spawn blocks
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(spawnBlock, 800)
    return () => clearInterval(interval)
  }, [playing, spawnBlock])

  // Mouse/touch control
  const handleMove = useCallback((clientX: number) => {
    if (!gameRef.current) return
    const rect = gameRef.current.getBoundingClientRect()
    const x = clientX - rect.left - PADDLE_W / 2
    setPaddleX(Math.max(0, Math.min(GAME_W - PADDLE_W, x)))
  }, [])

  const startGame = () => {
    setPlaying(true)
    setScore(0)
    setBlocks([])
    nextId.current = 0
  }

  useEffect(() => {
    if (score > highScore) setHighScore(score)
  }, [score, highScore])

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Free API rate limit — next request in {countdown}s
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Zap className="h-3 w-3" />
          Free tier
        </div>
      </div>

      <p className="mb-3 text-xs text-amber-600">
        Waiting for rate limit to reset. Play a quick game while you wait!
      </p>

      <div className="flex items-start gap-4">
        <div
          ref={gameRef}
          className="relative overflow-hidden rounded-lg bg-gray-900 cursor-none"
          style={{ width: GAME_W, height: GAME_H }}
          onMouseMove={e => playing && handleMove(e.clientX)}
          onTouchMove={e => { const touch = e.touches[0]; if (playing && touch) handleMove(touch.clientX) }}
          role="application"
          aria-label="Block catcher game"
        >
          {!playing && (
            <button
              onClick={startGame}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80 text-white transition-colors hover:bg-gray-900/70"
            >
              <Zap className="h-6 w-6 text-amber-400" />
              <span className="text-sm font-medium">Click to play</span>
              <span className="text-xs text-gray-400">Catch the falling blocks!</span>
            </button>
          )}

          {blocks.map(b => (
            <div
              key={b.id}
              className={`absolute rounded-sm ${b.color}`}
              style={{ left: b.x, top: b.y, width: BLOCK_SIZE, height: BLOCK_SIZE }}
            />
          ))}

          <div
            className="absolute rounded-full bg-white shadow-lg"
            style={{ left: paddleX, top: GAME_H - 12, width: PADDLE_W, height: 8 }}
          />

          {playing && (
            <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs font-mono text-white">
              {score}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div className="rounded-lg bg-white/60 px-3 py-2">
            <p className="font-medium text-gray-700">Score</p>
            <p className="text-lg font-bold text-indigo-600">{score}</p>
          </div>
          {highScore > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-white/60 px-3 py-2">
              <Trophy className="h-3 w-3 text-amber-500" />
              <span className="font-medium text-gray-600">Best: {highScore}</span>
            </div>
          )}
          <div className="mt-1 rounded-lg bg-white/60 px-3 py-2">
            <p className="font-medium text-gray-700">Countdown</p>
            <p className="font-mono text-lg font-bold text-amber-600">{countdown}s</p>
          </div>
        </div>
      </div>
    </div>
  )
}
