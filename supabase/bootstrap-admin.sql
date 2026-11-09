-- Execute DEPOIS de criar a conta em Authentication > Users no Supabase.
-- Não reutilize o UID do Firebase: o ID agora vem de auth.users do Supabase.
do $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email)='enriquefelez32@gmail.com';
  if admin_id is null then raise exception 'Crie primeiro enriquefelez32@gmail.com em Authentication > Users no Supabase.'; end if;
  insert into public.usuarios(uid,nome,email,tipo,ativo,trocar_senha,turma,turmas)
    values(admin_id,'Administrador','enriquefelez32@gmail.com','admin',true,false,null,'{}')
    on conflict(uid) do update set tipo='admin',ativo=true,trocar_senha=false,email=excluded.email,turma=null,turmas='{}';
end $$;
