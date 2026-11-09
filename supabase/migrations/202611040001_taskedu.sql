begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.turmas (
  id text primary key check (id in ('1 ano', '2 ano', '3 ano'))
);
insert into public.turmas(id) values ('1 ano'),('2 ano'),('3 ano');

create table public.usuarios (
  uid uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 3 and 120),
  email text not null unique,
  tipo text not null check (tipo in ('admin','aluno','professor')),
  turma text references public.turmas(id),
  turmas text[] not null default '{}',
  ativo boolean not null default true,
  trocar_senha boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (turmas <@ array['1 ano','2 ano','3 ano']::text[]),
  check ((tipo='aluno' and turma is not null and cardinality(turmas)=0)
    or (tipo='professor' and turma is null and cardinality(turmas)>0)
    or (tipo='admin' and turma is null and cardinality(turmas)=0)),
  check (tipo <> 'admin' or email = 'enriquefelez32@gmail.com')
);

create table public.atividades (
  id text primary key default gen_random_uuid()::text,
  titulo text not null default '' check (length(titulo)<=80),
  materia text not null,
  tipo text not null check (tipo in ('Atividade','Trabalho','Prova','Projeto','Seminário')),
  descricao text not null check (length(trim(descricao)) between 1 and 500),
  prioridade text not null default 'Média' check (prioridade in ('Baixa','Média','Alta')),
  turma text not null references public.turmas(id),
  professor_id uuid not null references public.usuarios(uid),
  professor_nome text not null,
  data_entrega timestamptz not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index atividades_turma_idx on public.atividades(turma, data_entrega);
create index atividades_professor_idx on public.atividades(professor_id, data_entrega);

create table public.progressos (
  usuario_id uuid not null references public.usuarios(uid) on delete cascade,
  atividade_id text not null references public.atividades(id) on delete cascade,
  concluida boolean not null default false,
  favorita boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id,atividade_id)
);

-- Helpers sem recursão de RLS; não consultam metadados editáveis pelo usuário.
create function private.ready() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.usuarios p join auth.users a on a.id=p.uid
    where p.uid=auth.uid() and p.ativo and not p.trocar_senha and a.email_confirmed_at is not null);
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select private.ready() and exists(select 1 from public.usuarios p join auth.users a on a.id=p.uid
    where p.uid=auth.uid() and p.tipo='admin' and p.email='enriquefelez32@gmail.com' and a.email='enriquefelez32@gmail.com');
$$;
create function private.is_teacher() returns boolean language sql stable security definer set search_path='' as $$
  select private.ready() and exists(select 1 from public.usuarios where uid=auth.uid() and tipo='professor');
$$;
create function private.student_class() returns text language sql stable security definer set search_path='' as $$
  select turma from public.usuarios where uid=auth.uid() and tipo='aluno' and private.ready();
$$;
create function private.teacher_class(value text) returns boolean language sql stable security definer set search_path='' as $$
  select private.is_teacher() and exists(select 1 from public.usuarios where uid=auth.uid() and value=any(turmas));
$$;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;

create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.atualizado_em=now(); return new; end;
$$;
create trigger usuarios_updated before update on public.usuarios for each row execute function private.touch_updated_at();
create trigger atividades_updated before update on public.atividades for each row execute function private.touch_updated_at();
create trigger progressos_updated before update on public.progressos for each row execute function private.touch_updated_at();

-- A flag só é liberada após mudança real da senha no Auth, nunca pelo navegador.
create function private.password_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.usuarios set trocar_senha=false where uid=new.id;
  end if;
  return new;
end;
$$;
create trigger taskedu_password_changed after update of encrypted_password on auth.users
  for each row execute function private.password_changed();
revoke all on function private.password_changed() from public,anon,authenticated;
revoke all on function private.touch_updated_at() from public,anon,authenticated;

alter table public.turmas enable row level security;
alter table public.usuarios enable row level security;
alter table public.atividades enable row level security;
alter table public.progressos enable row level security;

revoke all on public.turmas,public.usuarios,public.atividades,public.progressos from anon,authenticated;
grant usage on schema public to authenticated,service_role;
grant select on public.turmas,public.usuarios to authenticated;
grant update(nome) on public.usuarios to authenticated;
grant select,insert,delete on public.atividades to authenticated;
grant update(titulo,materia,tipo,descricao,prioridade,turma,data_entrega) on public.atividades to authenticated;
grant select,insert,delete on public.progressos to authenticated;
grant update(concluida,favorita) on public.progressos to authenticated;
grant all on public.turmas,public.usuarios,public.atividades,public.progressos to service_role;

create policy turmas_read on public.turmas for select to authenticated using (private.ready());
create policy usuarios_read on public.usuarios for select to authenticated using (uid=auth.uid() or private.is_admin());
create policy usuarios_nome on public.usuarios for update to authenticated using (uid=auth.uid() and private.ready()) with check (uid=auth.uid() and private.ready());
create policy atividades_read on public.atividades for select to authenticated using (
  (private.is_teacher() and professor_id=auth.uid()) or turma=private.student_class());
create policy atividades_insert on public.atividades for insert to authenticated with check (
  professor_id=auth.uid() and private.teacher_class(turma)
  and professor_nome=(select nome from public.usuarios where uid=auth.uid()));
create policy atividades_update on public.atividades for update to authenticated
  using (private.is_teacher() and professor_id=auth.uid())
  with check (professor_id=auth.uid() and private.teacher_class(turma));
create policy atividades_delete on public.atividades for delete to authenticated using (private.is_teacher() and professor_id=auth.uid());
create policy progressos_read on public.progressos for select to authenticated using (usuario_id=auth.uid() and private.ready() and private.student_class() is not null);
create policy progressos_insert on public.progressos for insert to authenticated with check (
  usuario_id=auth.uid() and exists(select 1 from public.atividades a where a.id=atividade_id and a.turma=private.student_class()));
create policy progressos_update on public.progressos for update to authenticated
  using (usuario_id=auth.uid() and private.ready() and private.student_class() is not null)
  with check (usuario_id=auth.uid() and exists(select 1 from public.atividades a where a.id=atividade_id and a.turma=private.student_class()));
create policy progressos_delete on public.progressos for delete to authenticated using (usuario_id=auth.uid() and private.ready() and private.student_class() is not null);

commit;
