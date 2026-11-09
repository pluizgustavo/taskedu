import { beforeEach, expect, test, vi } from 'vitest';
const mocks=vi.hoisted(()=>{
  const storage=new Map<string,string>();
  const store={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
  Object.defineProperty(globalThis,'sessionStorage',{value:store,configurable:true});
  Object.defineProperty(globalThis,'window',{value:{location:{origin:'http://localhost:5173'}},configurable:true});
  return {getSession:vi.fn().mockResolvedValue({data:{session:null},error:null}),onAuthStateChange:vi.fn(),signIn:vi.fn(),signOut:vi.fn().mockResolvedValue({error:null}),getUser:vi.fn(),resend:vi.fn().mockResolvedValue({error:null}),reset:vi.fn().mockResolvedValue({error:null}),profile:vi.fn(),storage};
});
vi.mock('../../src/supabase',()=>({supabaseConfigurado:true,supabase:{
  auth:{getSession:mocks.getSession,onAuthStateChange:mocks.onAuthStateChange,signInWithPassword:mocks.signIn,signOut:mocks.signOut,getUser:mocks.getUser,resend:mocks.resend,resetPasswordForEmail:mocks.reset},
  from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.profile})})}),
}}));
import {login,logout,aguardarAutenticacao,destinoDaConta,getUsuarioAtual,enviarVerificacaoEmail,confirmarVerificacaoEmail,recuperarSenha,temEmailPendente,marcarRecuperacao,mensagemAuth} from '../../src/services/auth.service';
const user={id:'uid',email:'aluno@example.invalid',email_confirmed_at:'2026-01-01'};
test.each(['recovery','confirmation'])('falha de envio de %s orienta verificar SMTP',kind=>{
  expect(mensagemAuth({code:'unexpected_failure',message:`Error sending ${kind} email`})).toContain('SMTP');
});
const profile=(tipo='aluno',trocar_senha=false)=>({uid:'uid',nome:'Nome Teste',email:user.email,tipo,ativo:true,trocar_senha,criado_em:'2026-01-01T00:00:00Z'});
beforeEach(async()=>{
  await aguardarAutenticacao();await logout();vi.clearAllMocks();
  mocks.signIn.mockResolvedValue({data:{user},error:null});
  mocks.profile.mockResolvedValue({data:profile(),error:null});
});
test.each(['aluno','professor','admin'])('identifica automaticamente o perfil %s',async tipo=>{
  mocks.profile.mockResolvedValue({data:profile(tipo),error:null});
  await login(user.email,'Senha1234');expect(destinoDaConta()).toBe(`/${tipo}/home`);
});
test('conta com senha temporária não acessa a agenda',async()=>{
  mocks.profile.mockResolvedValue({data:profile('aluno',true),error:null});
  await login(user.email,'Senha1234');expect(destinoDaConta()).toBe('/alterar-senha');
});
test('usuário sem perfil não ganha acesso pelo Auth',async()=>{
  mocks.profile.mockResolvedValue({data:null,error:null});
  await expect(login(user.email,'Senha1234')).rejects.toThrow('não foi liberada');expect(getUsuarioAtual().value).toBeNull();
});
test('e-mail não confirmado permite pedir reenvio sem sessão',async()=>{
  mocks.signIn.mockResolvedValue({data:{user:null},error:{code:'email_not_confirmed'}});
  await expect(login(user.email,'Senha1234')).rejects.toMatchObject({code:'email_not_confirmed'});
  expect(temEmailPendente()).toBe(true);
  await enviarVerificacaoEmail();
  expect(mocks.resend).toHaveBeenCalledWith({type:'signup',email:user.email,options:{emailRedirectTo:'http://localhost:5173/auth/retorno'}});
});
test('confirmação consulta o Auth e recuperação direciona à troca de senha',async()=>{
  mocks.getUser.mockResolvedValue({data:{user},error:null});
  expect(await confirmarVerificacaoEmail()).toBe(true);
  marcarRecuperacao();expect(destinoDaConta()).toBe('/alterar-senha');
});
test('recuperação usa callback próprio',async()=>{
  await recuperarSenha(user.email);
  expect(mocks.reset).toHaveBeenCalledWith(user.email,{redirectTo:'http://localhost:5173/auth/retorno?recuperacao=1'});
});
