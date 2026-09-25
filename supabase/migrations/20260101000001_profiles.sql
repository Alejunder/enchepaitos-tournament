-- SPEC-001: Autenticación, control de acceso y perfiles

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'player');

create type public.user_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text unique not null,
    email text unique not null,
    role public.user_role not null default 'player',
    status public.user_status not null default 'pending',
    created_at timestamp with time zone default now(),
    constraint username_min_length check (char_length(username) >= 3),
    constraint username_max_length check (char_length(username) <= 20)
);

alter table public.profiles enable row level security;

-- Helpers SECURITY DEFINER: evitan la recursión infinita de las políticas que
-- consultan la propia tabla profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and status = 'approved'
    );
$$;

-- Lectura pública (autenticados y anónimos)
create policy "Public Profiles Read"
    on public.profiles for select
    using (true);

-- Edición exclusiva del propio usuario
create policy "User Self Update"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Control total para el Admin
create policy "Admin Full Access"
    on public.profiles for all
    using (public.is_admin())
    with check (public.is_admin());

-- Impide la escalada de privilegios: solo un admin puede cambiar role/status.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        if new.role is distinct from old.role
           or new.status is distinct from old.status then
            raise exception 'UNAUTHORIZED_PENDING_APPROVAL: no puedes modificar role/status';
        end if;
    end if;
    return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
    before update on public.profiles
    for each row execute function public.prevent_profile_privilege_escalation();

-- Crea automáticamente el perfil al registrarse en auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
