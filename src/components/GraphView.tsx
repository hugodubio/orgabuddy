import { useEffect, useRef, useMemo } from 'react'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import type { Task } from '../types'

const PRIORITY_RADIUS: Record<string, number> = {
  alta: 10,
  média: 7,
  baixa: 5,
}

interface Node {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  task: Task
  color: string
  r: number
}

export default function GraphView() {
  const { tasks } = useTasksStore()
  const { projects } = useProjectsStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)
  const hoveredRef = useRef<Node | null>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const activeTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])

  // Build edges: task.links + tasks that share a project
  const edges = useMemo(() => {
    const e: [number, number][] = []
    const added = new Set<string>()
    for (const t of activeTasks) {
      for (const lid of t.links) {
        const key = [Math.min(t.id, lid), Math.max(t.id, lid)].join('-')
        if (!added.has(key)) { e.push([t.id, lid]); added.add(key) }
      }
    }
    return e
  }, [activeTasks])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    // Init nodes
    nodesRef.current = activeTasks.map((task, i) => {
      const angle = (i / activeTasks.length) * Math.PI * 2
      const r = Math.min(W, H) * 0.3
      const proj = projects.find((p) => p.id === task.projects[0])
      const color = proj?.dot_color ?? '#aaa'
      return {
        id: task.id,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: 0, vy: 0,
        task,
        color,
        r: PRIORITY_RADIUS[task.priority] ?? 6,
      }
    })

    const ctx = canvas.getContext('2d')!

    const simulate = () => {
      const nodes = nodesRef.current
      const cx = W / 2, cy = H / 2

      // Forces
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        // Center gravity
        a.vx += (cx - a.x) * 0.002
        a.vy += (cy - a.y) * 0.002

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = -800 / (dist * dist)
          const fx = (dx / dist) * force, fy = (dy / dist) * force
          a.vx += fx; a.vy += fy
          b.vx -= fx; b.vy -= fy
        }
      }

      // Edge spring
      for (const [aId, bId] of edges) {
        const a = nodes.find((n) => n.id === aId)
        const b = nodes.find((n) => n.id === bId)
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * 0.05
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      for (const n of nodes) {
        n.vx *= 0.85; n.vy *= 0.85
        n.x = Math.max(20, Math.min(W - 20, n.x + n.vx))
        n.y = Math.max(20, Math.min(H - 20, n.y + n.vy))
      }

      // Draw
      ctx.clearRect(0, 0, W, H)

      // Edges
      for (const [aId, bId] of edges) {
        const a = nodes.find((n) => n.id === aId)
        const b = nodes.find((n) => n.id === bId)
        if (!a || !b) continue
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = '#e0e0de'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Nodes
      const hovered = hoveredRef.current
      for (const n of nodes) {
        const isHovered = hovered?.id === n.id
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + (isHovered ? 3 : 0), 0, Math.PI * 2)
        ctx.fillStyle = n.color + (isHovered ? 'ff' : 'cc')
        ctx.fill()
        if (isHovered) {
          ctx.strokeStyle = n.color
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      // Tooltip
      if (hovered) {
        const mx = mouseRef.current.x, my = mouseRef.current.y
        const label = hovered.task.text.slice(0, 40) + (hovered.task.text.length > 40 ? '…' : '')
        ctx.font = '12px Inter, system-ui, sans-serif'
        const tw = ctx.measureText(label).width
        const px = 8, py = 5
        const tx = Math.min(mx + 12, W - tw - px * 2 - 10)
        const ty = my - 28
        ctx.fillStyle = '#1a1a1a'
        ctx.beginPath()
        ctx.roundRect(tx - px, ty - py - 12, tw + px * 2, 24, 4)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, tx, ty)
      }

      animRef.current = requestAnimationFrame(simulate)
    }

    simulate()

    return () => cancelAnimationFrame(animRef.current)
  }, [activeTasks, edges])

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    mouseRef.current = { x: mx, y: my }
    const found = nodesRef.current.find((n) => {
      const dx = n.x - mx, dy = n.y - my
      return Math.sqrt(dx * dx + dy * dy) < n.r + 6
    })
    hoveredRef.current = found ?? null
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-[22px] font-semibold text-[#1a1a1a]">Grafo</h1>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: p.dot_color }} />
              <span className="text-[11px] text-[#6b6b6b]">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="flex-1 w-full rounded-xl bg-[#fafafa] border border-[#ebebea] cursor-pointer"
        style={{ minHeight: 420 }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => { hoveredRef.current = null }}
      />
      {activeTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#bbb]">
          Ainda não há tarefas.
        </div>
      )}
    </div>
  )
}
