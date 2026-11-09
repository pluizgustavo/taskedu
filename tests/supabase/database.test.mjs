import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

let db;
const ids={admin:'00000000-0000-4000-8000-000000000001',teacher:'00000000-0000-4000-8000-000000000002',student:'00000000-0000-4000-8000-000000000003',other:'00000000-0000-4000-8000-000000000004',pending:'00000000-0000-4000-8000-000000000005',unverified:'00000000-0000-4000-8000-000000000006'};
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
  await db.exec(await readFile('supabase/migrations/202611040001_taskedu.sql','utf8'));
  for(const [name,id] of Object.entries(ids)){
    const email=name==='admin'?'enriquefelez32@gmail.com':`${name}@example.invalid`;
    await db.query('insert into auth.users values($1,$2,$3,$4)',[id,email,name==='unverified'?null:new Date().toISOString(),'old-hash']);
    const tipo=name==='admin'?'admin':name==='teacher'?'professor':'aluno';
    await db.query('insert into public.usuarios(uid,nome,email,tipo,turma,turmas,trocar_senha) values($1,$2,$3,$4,$5,$6,$7)',[id,`Nome ${name}`,email,tipo,tipo==='aluno'?(name==='other'?'2 ano':'1 ano'):null,tipo==='professor'?['1 ano']:[],name==='pending']);
  }
  await db.query(`insert into atividades(id,materia,tipo,descricao,turma,professor_id,professor_nome,data_entrega) values('a1','Arte','Atividade','Descrição','1 ano',$1,'Nome teacher',now()+interval '1 day')`,[ids.teacher]);
});
after(async()=>{if(db) await db.close();});
async function asUser(name,sql){
  await db.exec('begin');
  try{
    await db.exec('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[name]]);
    const result=await db.query(sql);
    await db.exec('commit');return result;
  }catch(e){await db.exec('rollback');throw e;}
}
test('script SQL e bootstrap do administrador executam sem erros',async()=>{
  await db.exec(await readFile('supabase/bootstrap-admin.sql','utf8'));
  assert.equal((await asUser('admin','select * from usuarios')).rows.length,6);
});
test('aluno e professor não listam perfis de outras pessoas',async()=>{
  for(const actor of ['teacher','student']) assert.equal((await asUser(actor,'select * from usuarios')).rows.length,1);
});
test('perfis e vínculos não podem ser criados ou alterados pelo navegador',async()=>{
  await assert.rejects(asUser('student',"update usuarios set tipo='admin'"));
  await assert.rejects(asUser('student',"update usuarios set turma='2 ano'"));
  await assert.rejects(asUser('pending','update usuarios set trocar_senha=false'));
  await assert.rejects(asUser('admin',"update usuarios set tipo='professor'"));
  await assert.rejects(asUser('student',"insert into usuarios(uid,nome,email,tipo) values(gen_random_uuid(),'Intruso','x@example.invalid','admin')"));
});
test('nome pessoal pode ser editado sem mudar permissões',async()=>{
  assert.equal((await asUser('student',"update usuarios set nome='Novo Nome' returning nome")).rows[0].nome,'Novo Nome');
});

test('acesso anônimo e conta desativada ficam bloqueados',async()=>{
  await db.exec('begin;set local role anon');
  try{await assert.rejects(db.query('select * from public.usuarios'));}finally{await db.exec('rollback');}
  await db.query('update usuarios set ativo=false where uid=$1',[ids.student]);
  assert.equal((await asUser('student','select * from atividades')).rows.length,0);
  await db.query('update usuarios set ativo=true where uid=$1',[ids.student]);
});
test('atividades só aparecem para o aluno da turma e seu professor',async()=>{
  for(const actor of ['student','teacher']) assert.equal((await asUser(actor,'select * from atividades')).rows.length,1);
  for(const actor of ['other','pending','unverified']) assert.equal((await asUser(actor,'select * from atividades')).rows.length,0);
});
test('professor publica apenas nas turmas atribuídas',async()=>{
  const insert=(turma)=>`insert into atividades(id,materia,tipo,descricao,turma,professor_id,professor_nome,data_entrega) values('a2','Arte','Atividade','Descrição','${turma}','${ids.teacher}','Nome teacher',now())`;
  await assert.rejects(asUser('teacher',insert('2 ano')));
  await asUser('teacher',insert('1 ano'));
  await asUser('teacher',"update atividades set titulo='Título' where id='a2'");
  await assert.rejects(asUser('teacher',"update atividades set turma='2 ano' where id='a2'"));
  await assert.rejects(asUser('teacher',`update atividades set professor_id='${ids.other}' where id='a2'`));
  await asUser('teacher',"delete from atividades where id='a2'");
});
test('progresso é pessoal e exige atividade da turma',async()=>{
  await asUser('student',`insert into progressos(usuario_id,atividade_id,concluida) values('${ids.student}','a1',true)`);
  await asUser('student',"update progressos set favorita=true where atividade_id='a1'");
  assert.equal((await asUser('student','select * from progressos')).rows.length,1);
  assert.equal((await asUser('other','select * from progressos')).rows.length,0);
  await assert.rejects(asUser('other',`insert into progressos(usuario_id,atividade_id) values('${ids.other}','a1')`));
  await assert.rejects(asUser('teacher',`insert into progressos(usuario_id,atividade_id) values('${ids.teacher}','a1')`));
});
test('troca inicial só é liberada após alteração real da senha no Auth',async()=>{
  await db.query('update auth.users set encrypted_password=$1 where id=$2',['old-hash',ids.pending]);
  assert.equal((await db.query('select trocar_senha from usuarios where uid=$1',[ids.pending])).rows[0].trocar_senha,true);
  await db.query('update auth.users set encrypted_password=$1 where id=$2',['new-hash',ids.pending]);
  assert.equal((await db.query('select trocar_senha from usuarios where uid=$1',[ids.pending])).rows[0].trocar_senha,false);
  assert.equal((await asUser('pending','select * from atividades')).rows.length,1);
});

test('exclusão no Auth remove perfil e progressos, preservando as atividades',async()=>{
  const uid='00000000-0000-4000-8000-000000000099';
  await db.query('insert into auth.users(id,email) values($1,$2)',[uid,'delete@example.invalid']);
  await db.query("insert into usuarios(uid,nome,email,tipo,turma) values($1,'Conta Teste','delete@example.invalid','aluno','1 ano')",[uid]);
  await db.query("insert into progressos(usuario_id,atividade_id) values($1,'a1')",[uid]);
  await db.query('delete from auth.users where id=$1',[uid]);
  assert.equal((await db.query('select * from usuarios where uid=$1',[uid])).rows.length,0);
  assert.equal((await db.query('select * from progressos where usuario_id=$1',[uid])).rows.length,0);
  assert.equal((await db.query("select * from atividades where id='a1'")).rows.length,1);
});
