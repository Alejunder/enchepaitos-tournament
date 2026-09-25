-- Limpieza de políticas RLS: una política permisiva por acción y rol.
-- Evita "multiple_permissive_policies" separando admin por comando y
-- fusionando las políticas solapadas.

-- profiles --------------------------------------------------------------------
drop policy if exists "User Self Update" on public.profiles;
drop policy if exists "Admin Full Access" on public.profiles;

create policy "Profiles Update"
    on public.profiles for update
    using ((select auth.uid()) = id or (select private.is_admin()))
    with check ((select auth.uid()) = id or (select private.is_admin()));

create policy "Admin Delete Profiles"
    on public.profiles for delete
    using ((select private.is_admin()));

-- tournaments -----------------------------------------------------------------
drop policy if exists "Admin Manage Tournaments" on public.tournaments;

create policy "Admin Insert Tournaments"
    on public.tournaments for insert
    with check ((select private.is_admin()));
create policy "Admin Update Tournaments"
    on public.tournaments for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Tournaments"
    on public.tournaments for delete
    using ((select private.is_admin()));

-- tournament_participants -----------------------------------------------------
drop policy if exists "Approved User Enroll" on public.tournament_participants;
drop policy if exists "Admin Manage Participants" on public.tournament_participants;

create policy "Participants Insert"
    on public.tournament_participants for insert
    with check (
        ((select auth.uid()) = user_id and (select private.is_approved()))
        or (select private.is_admin())
    );
create policy "Admin Update Participants"
    on public.tournament_participants for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Participants"
    on public.tournament_participants for delete
    using ((select private.is_admin()));

-- matches ---------------------------------------------------------------------
drop policy if exists "Admin Manage Matches" on public.matches;

create policy "Admin Insert Matches"
    on public.matches for insert
    with check ((select private.is_admin()));
create policy "Admin Update Matches"
    on public.matches for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Matches"
    on public.matches for delete
    using ((select private.is_admin()));

-- award_definitions -----------------------------------------------------------
drop policy if exists "Admin Manage Award Definitions" on public.award_definitions;

create policy "Admin Insert Award Definitions"
    on public.award_definitions for insert
    with check ((select private.is_admin()));
create policy "Admin Update Award Definitions"
    on public.award_definitions for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Award Definitions"
    on public.award_definitions for delete
    using ((select private.is_admin()));

-- tournament_awards -----------------------------------------------------------
drop policy if exists "Admin Manage Tournament Awards" on public.tournament_awards;

create policy "Admin Insert Tournament Awards"
    on public.tournament_awards for insert
    with check ((select private.is_admin()));
create policy "Admin Update Tournament Awards"
    on public.tournament_awards for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Tournament Awards"
    on public.tournament_awards for delete
    using ((select private.is_admin()));

-- puskas_nominations ----------------------------------------------------------
drop policy if exists "Approved User Nominate Puskas" on public.puskas_nominations;
drop policy if exists "Admin Manage Puskas Nominations" on public.puskas_nominations;

create policy "Nominations Insert"
    on public.puskas_nominations for insert
    with check (
        ((select auth.uid()) = user_id and (select private.is_approved()))
        or (select private.is_admin())
    );
create policy "Admin Update Nominations"
    on public.puskas_nominations for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Nominations"
    on public.puskas_nominations for delete
    using ((select private.is_admin()));

-- puskas_votes ----------------------------------------------------------------
drop policy if exists "Approved User Vote Puskas" on public.puskas_votes;
drop policy if exists "Admin Manage Puskas Votes" on public.puskas_votes;

create policy "Votes Insert"
    on public.puskas_votes for insert
    with check (
        ((select auth.uid()) = voter_id and (select private.is_approved()))
        or (select private.is_admin())
    );
create policy "Admin Update Votes"
    on public.puskas_votes for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Votes"
    on public.puskas_votes for delete
    using ((select private.is_admin()));

-- beer_debts ------------------------------------------------------------------
drop policy if exists "Admin Manage Beer Debts" on public.beer_debts;

create policy "Admin Insert Beer Debts"
    on public.beer_debts for insert
    with check ((select private.is_admin()));
create policy "Admin Update Beer Debts"
    on public.beer_debts for update
    using ((select private.is_admin()))
    with check ((select private.is_admin()));
create policy "Admin Delete Beer Debts"
    on public.beer_debts for delete
    using ((select private.is_admin()));

-- storage.objects (bucket puskas-videos) --------------------------------------
drop policy if exists "Approved User Upload Puskas Video" on storage.objects;
drop policy if exists "Admin Manage Puskas Videos" on storage.objects;

create policy "Puskas Videos Insert"
    on storage.objects for insert
    with check (
        bucket_id = 'puskas-videos'
        and ((select private.is_approved()) or (select private.is_admin()))
    );
create policy "Admin Update Puskas Videos"
    on storage.objects for update
    using (bucket_id = 'puskas-videos' and (select private.is_admin()))
    with check (bucket_id = 'puskas-videos' and (select private.is_admin()));
create policy "Admin Delete Puskas Videos"
    on storage.objects for delete
    using (bucket_id = 'puskas-videos' and (select private.is_admin()));
