-- =========================
-- FLUJO DE APROBACIÓN DE CUENTAS ADMIN
-- =========================

-- Agregar email al perfil administrativo
alter table public.profiles
add column if not exists email text;

-- Agregar estado de aprobación
alter table public.profiles
add column if not exists approval_status text not null default 'pending';

-- Restricción para estados válidos
alter table public.profiles
drop constraint if exists profiles_approval_status_check;

alter table public.profiles
add constraint profiles_approval_status_check
check (approval_status in ('pending', 'approved', 'rejected'));

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
-- TRIGGER: crear profile pendiente al registrarse
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
    approval_status,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario pendiente'),
    'editor',
    'pending',
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.handle_new_admin_signup();