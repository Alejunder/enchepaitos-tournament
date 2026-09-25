-- Escudos de equipo: caché de TheSportsDB + columnas en participantes

create table if not exists public.teams (
    provider_id text primary key,
    name text not null,
    logo_url text,
    country text,
    updated_at timestamptz not null default now()
);

create index if not exists teams_name_idx on public.teams (name);

alter table public.teams enable row level security;

create policy "Public Teams Read"
    on public.teams for select
    using (true);

alter table public.tournament_participants
    add column if not exists team_logo_url text,
    add column if not exists team_provider_id text;
