-- Correr no Supabase SQL Editor
-- Activa o cron job diário para gerar instâncias de eventos recorrentes

-- Primeiro, activar a extensão pg_cron (se ainda não estiver activa)
-- Vai a: Supabase Dashboard → Database → Extensions → pg_cron → Enable

-- Depois corre isto:
select cron.schedule(
  'generate-recurrences-daily',    -- nome do job
  '0 6 * * *',                     -- todos os dias às 6h UTC
  $$
  select net.http_post(
    url := (select value from vault.secrets where name = 'supabase_url') || '/functions/v1/generate-recurrences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from vault.secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para verificar que o job foi criado:
-- select * from cron.job;

-- Para apagar o job (se precisares):
-- select cron.unschedule('generate-recurrences-daily');
