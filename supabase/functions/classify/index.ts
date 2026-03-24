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
    return new Response(JSON.stringify({ error: 'text required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const list = (projects as { id: string; label: string }[])
    .map((p) => `- ${p.id}: ${p.label}`)
    .join('\n')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b:free',
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content: `És um assistente de organização pessoal. Classifica entradas em linguagem natural.

Projetos disponíveis:
${list || '- geral: Geral'}

Responde APENAS com JSON válido, sem markdown:
{"text":"versão limpa em imperativo, máx 80 chars","projects":["id"],"priority":"alta|média|baixa","reason":"frase curta","type":"tarefa|ideia"}

Prioridade: alta=urgente/deadline, média=importante, baixa=quando houver tempo`,
        },
        { role: 'user', content: text },
      ],
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.error?.message ?? 'openrouter error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const result = data.choices?.[0]?.message?.content?.trim()
  return new Response(result, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
