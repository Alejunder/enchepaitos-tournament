-- SPEC-002: Motor de torneos, temáticas, elección de equipo y calendario

create type public.tournament_status as enum ('draft', 'active', 'finished');

create table public.tournaments (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    theme text not null,
    entry_fee numeric(6, 2) not null default 5.00,
    status public.tournament_status not null default 'draft',
    created_at timestamp with time zone default now()
);

create table public.tournament_participants (
    tournament_id uuid references public.tournaments (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete cascade,
    team_name text not null,
    primary key (tournament_id, user_id)
);

create table public.matches (
    id uuid primary key default gen_random_uuid(),
    tournament_id uuid references public.tournaments (id) on delete cascade,
    jornada int not null,
    player1_id uuid references public.profiles (id) on delete cascade,
    player2_id uuid references public.profiles (id) on delete cascade,
    goals_p1 int default null,
    goals_p2 int default null,
    played boolean generated always as (
        goals_p1 is not null and goals_p2 is not null
    ) stored,
    updated_at timestamp with time zone default now()
);

create index matches_tournament_jornada_idx
    on public.matches (tournament_id, jornada);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger matches_touch_updated_at
    before update on public.matches
    for each row execute function public.touch_updated_at();

-- RLS -------------------------------------------------------------------------

alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.matches enable row level security;

-- Torneos: lectura pública, escritura solo admin.
create policy "Public Tournaments Read"
    on public.tournaments for select using (true);

create policy "Admin Manage Tournaments"
    on public.tournaments for all
    using (public.is_admin()) with check (public.is_admin());

-- Inscripciones: lectura pública; alta del propio usuario aprobado.
create policy "Public Participants Read"
    on public.tournament_participants for select using (true);

create policy "Approved User Enroll"
    on public.tournament_participants for insert
    with check (auth.uid() = user_id and public.is_approved());

create policy "Admin Manage Participants"
    on public.tournament_participants for all
    using (public.is_admin()) with check (public.is_admin());

-- Partidos: lectura pública, escritura solo admin.
create policy "Public Matches Read"
    on public.matches for select using (true);

create policy "Admin Manage Matches"
    on public.matches for all
    using (public.is_admin()) with check (public.is_admin());
