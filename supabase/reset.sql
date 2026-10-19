-- DESTRUCTIVE: wipes every table, view, function and type in the "public" schema
-- (old Arth Realty data), clears auth users and storage objects, then you run schema.sql.
-- Run in Supabase SQL editor. Cannot be undone.

drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;

delete from auth.users;
delete from storage.objects;
