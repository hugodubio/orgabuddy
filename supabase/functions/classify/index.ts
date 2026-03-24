import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { text, projects } = await req.json()
  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: 'text required' }), { status: 400, headers: corsHeaders })
  }

  const list = (projects as { id: string; label: string }[])
    .map((p) => `- ${p.id}: ${p.label}`)
    .join('\n')

  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    system: `És um assistente de organização pessoal. Classifica entradas em linguagem natural.

Projetos disponíveis:
${list}

Responde APENAS com JSON válido, sem markdown:
{"text":"versão limpa em imperativo, máx 80 chars","projects":["id"],"priority":"alta|média|baixa","reason":"frase curta","type":"tarefa|ideia"}

Prioridade: alta=urgente/deadline, média=importante, baixa=quando houver tempo`,
    messages: [{ role: 'user', content: text }],
  })

  const result = (msg.content[0] as { text: string }).text.trim()
  return new Response(result, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
