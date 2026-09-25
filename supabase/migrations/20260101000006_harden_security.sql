-- Hardening: security advisors + índices de claves foráneas

-- 1) Helpers SECURITY DEFINER en esquema privado (no expuesto por PostgREST) --
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    );
$$;

create or replace function private.is_approved()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and status = 'approved'
    );
$$;

revoke execute on function private.is_admin() from public;
revoke execute on function private.is_approved() from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.is_approved() to anon, authenticated, service_role;

-- 2) Recrear políticas usando helpers privados y (select auth.uid()) ----------
drop policy if exists "User Self Update" on public.profiles;
create policy "User Self Update"
    on public.profiles for update
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

drop policy if exists "Admin Full Access" on public.profiles;
create policy "Admin Full Access"
    on public.profiles for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Admin Manage Tournaments" on public.tournaments;
create policy "Admin Manage Tournaments"
    on public.tournaments for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Approved User Enroll" on public.tournament_participants;
create policy "Approved User Enroll"
    on public.tournament_participants for insert
    with check ((select auth.uid()) = user_id and (select private.is_approved()));

drop policy if exists "Admin Manage Participants" on public.tournament_participants;
create policy "Admin Manage Participants"
    on public.tournament_participants for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Admin Manage Matches" on public.matches;
create policy "Admin Manage Matches"
    on public.matches for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Admin Manage Award Definitions" on public.award_definitions;
create policy "Admin Manage Award Definitions"
    on public.award_definitions for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Admin Manage Tournament Awards" on public.tournament_awards;
create policy "Admin Manage Tournament Awards"
    on public.tournament_awards for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Approved User Nominate Puskas" on public.puskas_nominations;
create policy "Approved User Nominate Puskas"
    on public.puskas_nominations for insert
    with check ((select auth.uid()) = user_id and (select private.is_approved()));

drop policy if exists "Admin Manage Puskas Nominations" on public.puskas_nominations;
create policy "Admin Manage Puskas Nominations"
    on public.puskas_nominations for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Approved User Vote Puskas" on public.puskas_votes;
create policy "Approved User Vote Puskas"
    on public.puskas_votes for insert
    with check ((select auth.uid()) = voter_id and (select private.is_approved()));

drop policy if exists "Admin Manage Puskas Votes" on public.puskas_votes;
create policy "Admin Manage Puskas Votes"
    on public.puskas_votes for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

drop policy if exists "Admin Manage Beer Debts" on public.beer_debts;
create policy "Admin Manage Beer Debts"
    on public.beer_debts for all
    using ((select private.is_admin()))
    with check ((select private.is_admin()));

-- 3) Funciones de trigger en esquema privado y sin permisos públicos ---------
create or replace function private.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not (select private.is_admin()) then
        if new.role is distinct from old.role
           or new.status is distinct from old.status then
            raise exception 'UNAUTHORIZED: no puedes modificar role/status';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
    before update on public.profiles
    for each row execute function private.prevent_profile_privilege_escalation();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, username, email, status, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
        new.email,
        'pending',
        'player'
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function private.handle_new_user();

revoke execute on function private.prevent_profile_privilege_escalation() from public;
revoke execute on function private.handle_new_user() from public;

-- 4) search_path fijo en la función de updated_at ----------------------------
alter function public.touch_updated_at() set search_path = '';

-- 5) Storage: políticas con helpers privados ---------------------------------
drop policy if exists "Approved User Upload Puskas Video" on storage.objects;
create policy "Approved User Upload Puskas Video"
    on storage.objects for insert
    with check (bucket_id = 'puskas-videos' and (select private.is_approved()));

drop policy if exists "Admin Manage Puskas Videos" on storage.objects;
create policy "Admin Manage Puskas Videos"
    on storage.objects for all
    using (bucket_id = 'puskas-videos' and (select private.is_admin()))
    with check (bucket_id = 'puskas-videos' and (select private.is_admin()));

-- 6) Eliminar helpers antiguos expuestos en public ---------------------------
drop function if exists public.is_admin();
drop function if exists public.is_approved();
drop function if exists public.prevent_profile_privilege_escalation();
drop function if exists public.handle_new_user();

-- 7) Índices de claves foráneas ----------------------------------------------
create index if not exists profiles_status_idx
    on public.profiles (status);

create index if not exists tournament_participants_user_id_idx
    on public.tournament_participants (user_id);

create index if not exists matches_player1_id_idx on public.matches (player1_id);
create index if not exists matches_player2_id_idx on public.matches (player2_id);

create index if not exists tournament_awards_award_definition_id_idx
    on public.tournament_awards (award_definition_id);
create index if not exists tournament_awards_winner_id_idx
    on public.tournament_awards (winner_id);
create index if not exists tournament_awards_sponsor_id_idx
    on public.tournament_awards (sponsor_id);

create index if not exists puskas_nominations_tournament_id_idx
    on public.puskas_nominations (tournament_id);
create index if not exists puskas_nominations_match_id_idx
    on public.puskas_nominations (match_id);
create index if not exists puskas_nominations_user_id_idx
    on public.puskas_nominations (user_id);

create index if not exists puskas_votes_nomination_id_idx
    on public.puskas_votes (nomination_id);
create index if not exists puskas_votes_voter_id_idx
    on public.puskas_votes (voter_id);

create index if not exists beer_debts_debtor_id_idx
    on public.beer_debts (debtor_id);
create index if not exists beer_debts_creditor_id_idx
    on public.beer_debts (creditor_id);
