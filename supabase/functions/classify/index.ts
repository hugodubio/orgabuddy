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

  const prompt = `És um assistente de organização pessoal. Classifica a entrada em linguagem natural.

Projetos disponíveis:
${list || '- geral: Geral'}

Responde APENAS com JSON válido, sem markdown:
{"text":"versão limpa em imperativo, máx 80 chars","projects":["id"],"priority":"alta|média|baixa","reason":"frase curta","type":"tarefa|ideia"}

Prioridade: alta=urgente/deadline, média=importante, baixa=quando houver tempo

Entrada: ${text}`

  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.error?.message ?? 'gemini error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  return new Response(result, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
