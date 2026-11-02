-- Free scheduler: Supabase pg_cron + pg_net call the Vercel dispatcher every minute.
-- Replaces Vercel Pro cron (Hobby only allows daily crons). Run after schema.sql.
-- Replace YOUR-APP and YOUR_CRON_SECRET first.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('wa-dispatch') where exists (select 1 from cron.job where jobname = 'wa-dispatch');
select cron.schedule('wa-dispatch', '* * * * *', $$
  select net.http_get(
    url := 'https://YOUR-APP.vercel.app/api/cron/dispatch',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    timeout_milliseconds := 60000
  );
$$);

-- Keep free-tier DB under 500 MB: drop raw webhook payloads after 30 days,
-- delete message history older than 180 days. Runs daily at 03:00 UTC.
select cron.unschedule('wa-retention') where exists (select 1 from cron.job where jobname = 'wa-retention');
select cron.schedule('wa-retention', '0 3 * * *', $$
  update messages set payload = null
    where direction = 'in' and payload is not null and created_at < now() - interval '30 days';
  delete from messages where created_at < now() - interval '180 days';
  delete from wa_events where created_at < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '1 day';
$$);
