import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizedAdmin,accountInput,ADMIN_EMAIL,deletionTarget } from '../../supabase/functions/admin-usuarios/policy.mjs';
import { allowedOrigin } from '../../supabase/functions/admin-usuarios/origins.mjs';
const user={id:'uid',email:ADMIN_EMAIL,email_confirmed_at:'2026-01-01'};
const profile={uid:'uid',tipo:'admin',email:ADMIN_EMAIL,ativo:true,trocar_senha:false};
test('admin exige identidade verificada e perfil protegido correspondente',()=>{
  assert.equal(authorizedAdmin(user,profile),true);
  for(const value of [null,{...user,email:'outro@example.invalid'},{...user,email_confirmed_at:null}]) assert.equal(authorizedAdmin(value,profile),false);
  for(const value of [null,{...profile,uid:'outro'},{...profile,tipo:'aluno'},{...profile,ativo:false},{...profile,trocar_senha:true}]) assert.equal(authorizedAdmin(user,value),false);
});
const student={nome:'Aluno Teste',email:'aluno@example.invalid',tipo:'aluno',turma:'1 ano',senha:'Senha12345'};
test('exclusão bloqueia administrador, autoexclusão, UID inválido e perfil ausente',()=>{
  const uid='00000000-0000-4000-8000-000000000099';
  for(const id of ['',null,'usuarios/aluno','0000-0000']) assert.throws(()=>deletionTarget(id,'admin',student));
  assert.throws(()=>deletionTarget(uid,uid,student));
  for(const target of [null,{tipo:'admin'}, {...student,email:ADMIN_EMAIL}]) assert.throws(()=>deletionTarget(uid,'admin',target));
  assert.doesNotThrow(()=>deletionTarget(uid,'admin',student));
  assert.doesNotThrow(()=>deletionTarget(uid,'admin',{...student,tipo:'professor'}));
});
test('origens locais aceitam portas dinâmicas sem liberar sites externos',()=>{
  for(const origin of ['http://localhost:8100','http://localhost:8101','http://localhost:5174','http://127.0.0.1:8102','http://[::1]:5173']) assert.equal(allowedOrigin(origin,[]),true);
  for(const origin of ['https://localhost.attacker.example','https://attacker.example','null','http://localhost:8100/path','https://localhost@attacker.example']) assert.equal(allowedOrigin(origin,[]),false);
  assert.equal(allowedOrigin('https://taskedu.example',['https://taskedu.example']),true);
});
test('aluno usa uma turma e professor pode usar várias',()=>{
  assert.deepEqual(accountInput(student).turmas,[]);
  assert.deepEqual(accountInput({...student,tipo:'professor',turmas:['1 ano','2 ano','1 ano']}).turmas,['1 ano','2 ano']);
  for(const value of [{...student,turma:['1 ano','2 ano']},{...student,tipo:'professor',turmas:[]},{...student,tipo:'professor',turmas:['Outra']}]) assert.throws(()=>accountInput(value));
});
test('cadastro não aceita promoção, conta admin nem senha inválida',()=>{
  for(const value of [{...student,tipo:'admin'},{...student,email:ADMIN_EMAIL},{...student,senha:'12345678'},{...student,email:'invalido'}]) assert.throws(()=>accountInput(value));
  const input=accountInput({...student,ativo:false,trocar_senha:false});
  assert.equal(input.ativo,undefined);assert.equal(input.trocar_senha,undefined);
});
