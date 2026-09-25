-- SPEC-003: Motor dinámico de premios, subida de vídeo y cervezómetro

create type public.award_category as enum ('stat_derived', 'voting_derived');

create table public.award_definitions (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    name text not null,
    description text,
    icon text not null,
    category public.award_category not null,
    penalty_payer_rule text default null,
    active boolean default true
);

create table public.tournament_awards (
    id uuid primary key default gen_random_uuid(),
    tournament_id uuid references public.tournaments (id) on delete cascade,
    award_definition_id uuid references public.award_definitions (id) on delete cascade,
    winner_id uuid references public.profiles (id) on delete cascade,
    sponsor_id uuid references public.profiles (id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique (tournament_id, award_definition_id)
);

create table public.puskas_nominations (
    id uuid primary key default gen_random_uuid(),
    tournament_id uuid references public.tournaments (id) on delete cascade,
    match_id uuid references public.matches (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete cascade,
    video_url text not null,
    created_at timestamp with time zone default now()
);

create table public.puskas_votes (
    id uuid primary key default gen_random_uuid(),
    tournament_id uuid references public.tournaments (id) on delete cascade,
    nomination_id uuid references public.puskas_nominations (id) on delete cascade,
    voter_id uuid references public.profiles (id) on delete cascade,
    unique (tournament_id, voter_id)
);

create table public.beer_debts (
    id uuid primary key default gen_random_uuid(),
    tournament_id uuid references public.tournaments (id) on delete cascade,
    debtor_id uuid references public.profiles (id) on delete cascade,
    creditor_id uuid references public.profiles (id) on delete cascade,
    status text check (status in ('pending', 'settled')) default 'pending',
    created_at timestamp with time zone default now(),
    unique (tournament_id)
);

-- RLS -------------------------------------------------------------------------

alter table public.award_definitions enable row level security;
alter table public.tournament_awards enable row level security;
alter table public.puskas_nominations enable row level security;
alter table public.puskas_votes enable row level security;
alter table public.beer_debts enable row level security;

create policy "Public Award Definitions Read"
    on public.award_definitions for select using (true);
create policy "Admin Manage Award Definitions"
    on public.award_definitions for all
    using (public.is_admin()) with check (public.is_admin());

create policy "Public Tournament Awards Read"
    on public.tournament_awards for select using (true);
create policy "Admin Manage Tournament Awards"
    on public.tournament_awards for all
    using (public.is_admin()) with check (public.is_admin());

create policy "Public Puskas Nominations Read"
    on public.puskas_nominations for select using (true);
create policy "Approved User Nominate Puskas"
    on public.puskas_nominations for insert
    with check (auth.uid() = user_id and public.is_approved());
create policy "Admin Manage Puskas Nominations"
    on public.puskas_nominations for all
    using (public.is_admin()) with check (public.is_admin());

create policy "Public Puskas Votes Read"
    on public.puskas_votes for select using (true);
create policy "Approved User Vote Puskas"
    on public.puskas_votes for insert
    with check (auth.uid() = voter_id and public.is_approved());
create policy "Admin Manage Puskas Votes"
    on public.puskas_votes for all
    using (public.is_admin()) with check (public.is_admin());

create policy "Public Beer Debts Read"
    on public.beer_debts for select using (true);
create policy "Admin Manage Beer Debts"
    on public.beer_debts for all
    using (public.is_admin()) with check (public.is_admin());

-- Storage: bucket de vídeos Puskas -------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'puskas-videos',
    'puskas-videos',
    true,
    52428800,
    array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

create policy "Public Puskas Videos Read"
    on storage.objects for select
    using (bucket_id = 'puskas-videos');

create policy "Approved User Upload Puskas Video"
    on storage.objects for insert
    with check (bucket_id = 'puskas-videos' and public.is_approved());

create policy "Admin Manage Puskas Videos"
    on storage.objects for all
    using (bucket_id = 'puskas-videos' and public.is_admin())
    with check (bucket_id = 'puskas-videos' and public.is_admin());
