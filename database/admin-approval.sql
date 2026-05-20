-- =========================
-- FLUJO DE APROBACIÓN DE CUENTAS ADMIN
-- =========================

-- Agregar email al perfil administrativo
alter table public.profiles
add column if not exists email text;

-- Agregar estado de aprobación
alter table public.profiles
add column if not exists approval_status text not null default 'pending';

-- Asegurar nombre por defecto
alter table public.profiles
alter column full_name set default 'Usuario pendiente';

-- Permitir que role pueda ser NULL cuando el usuario sea rechazado
alter table public.profiles
alter column role drop not null;

-- Eliminar avatar_url si existía en versiones anteriores
alter table public.profiles
drop column if exists avatar_url;

-- Restricción para estados válidos
alter table public.profiles
drop constraint if exists profiles_approval_status_check;

alter table public.profiles
add constraint profiles_approval_status_check
check (approval_status in ('pending', 'approved', 'rejected'));

-- Rehacer la restricción de roles para aceptar admin, editor o NULL
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role is null or role in ('admin', 'editor'));

-- Copiar emails desde auth.users a profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

-- Aprobar usuarios administrativos existentes
update public.profiles
set approval_status = 'approved'
where role in ('admin', 'editor')
and approval_status = 'pending';

-- Índice único para email cuando exista
create unique index if not exists profiles_email_unique
on public.profiles(email)
where email is not null;

-- =========================
-- FUNCIÓN: normalizar estado del perfil
-- =========================

create or replace function public.normalize_profile_status()
returns trigger
language plpgsql
as $$
begin
  -- Si el usuario está rechazado, queda sin rol y con nombre claro
  if new.approval_status = 'rejected' then
    new.role := null;
    new.full_name := 'Usuario rechazado';
  end if;

  -- Si el usuario está pendiente, asegurar nombre de espera
  if new.approval_status = 'pending' then
    if new.full_name is null or btrim(new.full_name) = '' then
      new.full_name := 'Usuario pendiente';
    end if;
  end if;

  -- Si el usuario está aprobado como admin
  if new.approval_status = 'approved' and new.role = 'admin' then
    new.full_name := 'Administrador TechHub';
  end if;

  -- Si el usuario está aprobado como editor
  if new.approval_status = 'approved' and new.role = 'editor' then
    new.full_name := 'Editor TechHub';
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_profile_status on public.profiles;

create trigger normalize_profile_status
before insert or update on public.profiles
for each row
execute function public.normalize_profile_status();

-- Actualizar perfiles existentes para que pasen por el trigger
update public.profiles
set approval_status = approval_status;

-- =========================
-- FUNCIÓN: crear profile pendiente al registrarse
-- =========================

create or replace function public.handle_new_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    approval_status
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      'Usuario pendiente'
    ),
    'editor',
    'pending'
  )
  on conflict (id) do update
  set 
    email = coalesce(public.profiles.email, excluded.email),
    full_name = case
      when public.profiles.full_name is null or btrim(public.profiles.full_name) = ''
      then excluded.full_name
      else public.profiles.full_name
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.handle_new_admin_signup();