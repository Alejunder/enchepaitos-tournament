-- SPEC-006: fechas, portada y sistema de fases eliminatorias

-- Fecha/hora del torneo (deadline de inscripción) y portada
alter table public.tournaments
    add column if not exists starts_at timestamptz,
    add column if not exists cover_image_url text;

update public.tournaments set starts_at = created_at where starts_at is null;
alter table public.tournaments alter column starts_at set not null;

-- Nuevo estado: eliminatorias en curso
alter type public.tournament_status add value if not exists 'knockout';

-- Fases de partido y slot de bracket para eliminatorias
alter table public.matches
    add column if not exists phase text not null default 'group'
        check (phase in ('group', 'playin', 'round16', 'quarter', 'semi', 'final')),
    add column if not exists bracket_slot integer;

-- Bucket de portadas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'tournament-covers', 'tournament-covers', true, 5242880,
       array['image/jpeg', 'image/png', 'image/webp']
where not exists (select 1 from storage.buckets where id = 'tournament-covers');

create policy "Public Covers Read"
    on storage.objects for select
    using (bucket_id = 'tournament-covers');

create policy "Admin Upload Cover"
    on storage.objects for insert
    with check (bucket_id = 'tournament-covers' and (select private.is_admin()));
