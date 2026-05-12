import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function addMonths(date: string, months: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().split('T')[0]
}

// Gera próxima data dado a data actual e a regra
function nextOccurrence(current: string, rule: string): string {
  if (rule === 'weekly') return addDays(current, 7)
  if (rule === 'monthly') return addMonths(current, 1)
  if (rule === 'first-week-monthly') {
    // Próximo mês, primeiro dia + ajuste para o mesmo dia da semana
    const d = new Date(current + 'T00:00:00Z')
    const dayOfWeek = d.getUTCDay()
    const next = new Date(d)
    next.setUTCMonth(next.getUTCMonth() + 1)
    next.setUTCDate(1)
    // Ajusta para o mesmo dia da semana na primeira semana
    while (next.getUTCDay() !== dayOfWeek) next.setUTCDate(next.getUTCDate() + 1)
    return next.toISOString().split('T')[0]
  }
  return addDays(current, 7) // fallback
}

Deno.serve(async () => {
  const horizon = addDays(new Date().toISOString().split('T')[0], 60) // gera 60 dias à frente

  // Buscar todos os eventos pai com recorrência activa
  const { data: parents, error } = await supabase
    .from('ob_events')
    .select('*')
    .not('recurrence_rule', 'is', null)
    .is('parent_event_id', null)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let created = 0

  for (const parent of parents ?? []) {
    const limit = parent.recurrence_end ?? horizon
    const effectiveHorizon = limit < horizon ? limit : horizon

    // Buscar a última instância existente desta recorrência
    const { data: lastInstance } = await supabase
      .from('ob_events')
      .select('start_date, end_date')
      .eq('parent_event_id', parent.id)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    // Ponto de partida: última instância ou o próprio evento pai
    const lastStart = lastInstance?.start_date ?? parent.start_date
    const lastEnd = lastInstance?.end_date ?? parent.end_date
    const duration = Math.round(
      (new Date(lastEnd + 'T00:00:00Z').getTime() - new Date(lastStart + 'T00:00:00Z').getTime()) / 86400000
    )

    let nextStart = nextOccurrence(lastStart, parent.recurrence_rule)

    while (nextStart <= effectiveHorizon) {
      const nextEnd = addDays(nextStart, duration)

      // Verificar se já existe instância para esta data
      const { count } = await supabase
        .from('ob_events')
        .select('id', { count: 'exact', head: true })
        .eq('parent_event_id', parent.id)
        .eq('start_date', nextStart)

      if (!count) {
        await supabase.from('ob_events').insert({
          user_id: parent.user_id,
          title: parent.title,
          start_date: nextStart,
          end_date: nextEnd,
          project_id: parent.project_id,
          notes: parent.notes,
          location: parent.location,
          parent_event_id: parent.id,
        })

        // Se o pai tem tarefa associada, criar tarefa para esta instância também
        if (parent.task_id) {
          const { data: task } = await supabase
            .from('ob_tasks')
            .insert({
              user_id: parent.user_id,
              text: parent.title,
              projects: parent.project_id ? [parent.project_id] : [],
              priority: 'média',
              type: 'tarefa',
              due_date: nextStart,
            })
            .select('id')
            .single()

          if (task) {
            await supabase
              .from('ob_events')
              .update({ task_id: task.id })
              .eq('parent_event_id', parent.id)
              .eq('start_date', nextStart)
          }
        }

        created++
      }

      nextStart = nextOccurrence(nextStart, parent.recurrence_rule)
    }
  }

  return new Response(JSON.stringify({ ok: true, created }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
