import { ref, type Ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigurado } from '../supabase';
import { mapUsuario } from './supabase-mappers';
import type { Usuario } from '../types';

const usuarioAtual=ref<Usuario|null>(null);
const identidade=ref<User|null>(null);
const pendingKey='taskedu-email-pendente';
const recoveryKey='taskedu-recuperacao';
const emailPendente=ref(sessionStorage.getItem(pendingKey)||'');
export const recuperandoSenha=ref(sessionStorage.getItem(recoveryKey)==='1');
let profileVersion=0;
let loginEmCurso=false;
export async function recarregarPerfil(){
  const version=++profileVersion;
  const uid=identidade.value?.id;
  if(!uid){usuarioAtual.value=null;return;}
  const {data,error}=await supabase.from('usuarios').select('*').eq('uid',uid).maybeSingle();
  if(version!==profileVersion||identidade.value?.id!==uid) return;
  if(error){usuarioAtual.value=null;throw error;}
  usuarioAtual.value=data?mapUsuario(data):null;
}
supabase.auth.onAuthStateChange((event,session)=>{
  identidade.value=session?.user||null;
  if(event==='PASSWORD_RECOVERY'){recuperandoSenha.value=true;sessionStorage.setItem(recoveryKey,'1');}
  if(event==='SIGNED_OUT'){profileVersion++;usuarioAtual.value=null;recuperandoSenha.value=false;sessionStorage.removeItem(recoveryKey);}
  // Não aguardar outras chamadas Supabase dentro do callback do Auth (lock de sessão).
  if(event!=='INITIAL_SESSION'&&session&&!loginEmCurso) setTimeout(()=>{void recarregarPerfil().catch(()=>{});},0);
});
const inicializacao=(async()=>{
  if(!supabaseConfigurado) return;
  const {data,error}=await supabase.auth.getSession();
  if(error){usuarioAtual.value=null;return;}
  identidade.value=data.session?.user||null;
  try{await recarregarPerfil();}catch{usuarioAtual.value=null;}
})();
export const aguardarAutenticacao=()=>inicializacao;
export const getUsuarioAtual=():Ref<Usuario|null>=>usuarioAtual;
export const emailEstaVerificado=()=>Boolean(identidade.value?.email_confirmed_at);
export const emailDaConta=()=>identidade.value?.email||emailPendente.value;
export const temEmailPendente=()=>Boolean(emailPendente.value);
export const sessaoAtiva=()=>Boolean(identidade.value);
export function marcarRecuperacao(){recuperandoSenha.value=true;sessionStorage.setItem(recoveryKey,'1');}
export function destinoDaConta(){
  if(recuperandoSenha.value&&identidade.value) return '/alterar-senha';
  if(!usuarioAtual.value) return '/login';
  if(!emailEstaVerificado()) return '/verificar-email';
  if(usuarioAtual.value.trocarSenha) return '/alterar-senha';
  return `/${usuarioAtual.value.tipo}/home`;
}
export function mensagemAuth(e:unknown):string{
  const value=e as {code?:string;message?:string};
  if(/error sending (recovery|confirmation) email/i.test(value?.message||'')) {
    return 'Não foi possível enviar o e-mail. O administrador precisa verificar o serviço de envio (SMTP) e os registros de autenticação no Supabase.';
  }
  const messages:Record<string,string>={
    invalid_credentials:'E-mail ou senha incorretos.',
    email_not_confirmed:'Confirme seu e-mail antes de entrar.',
    over_request_rate_limit:'Muitas tentativas. Aguarde alguns minutos.',
    over_email_send_rate_limit:'Aguarde antes de solicitar outro e-mail.',
    email_address_not_authorized:'O envio para este e-mail ainda não está habilitado. O administrador precisa configurar o serviço de e-mails (SMTP) no Supabase.',
    email_provider_disabled:'O envio de e-mails está desativado. O administrador precisa revisar a configuração de e-mail no Supabase.',
    same_password:'Escolha uma senha diferente da senha atual.',
    weak_password:'Use pelo menos 8 caracteres, com letras e números.',
    otp_expired:'O link expirou. Solicite um novo e-mail.',
    user_banned:'Conta desativada. Procure o administrador.',
    '42P01':'O banco do Supabase ainda precisa ser configurado. Execute o script da migração.',
    PGRST205:'O banco do Supabase ainda precisa ser configurado. Execute o script da migração.',
    '42501':'Sua conta não tem permissão para realizar esta ação.',
  };
  return messages[value?.code||'']||value?.message||'Não foi possível concluir. Confira sua conexão e tente novamente.';
}
export async function login(email:string,senha:string){
  if(!supabaseConfigurado) throw new Error('Configure o Supabase no arquivo .env.local.');
  loginEmCurso=true;
  try{
  recuperandoSenha.value=false;sessionStorage.removeItem(recoveryKey);
  const normalized=email.trim().toLowerCase();
  const {data,error}=await supabase.auth.signInWithPassword({email:normalized,password:senha});
  if(error){
    if(error.code==='email_not_confirmed'){emailPendente.value=normalized;sessionStorage.setItem(pendingKey,normalized);}
    throw error;
  }
  identidade.value=data.user;
  await recarregarPerfil();
  if(!usuarioAtual.value||!usuarioAtual.value.ativo){await logout();throw new Error('Sua conta ainda não foi liberada. Procure o administrador.');}
  emailPendente.value='';sessionStorage.removeItem(pendingKey);
  return usuarioAtual.value;
  }finally{loginEmCurso=false;}
}
export async function recuperarSenha(email:string){
  const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/auth/retorno?recuperacao=1`});
  if(error) throw error;
}
export async function atualizarPerfil(dados:{nome:string}){
  if(!usuarioAtual.value) throw new Error('Entre na sua conta.');
  const nome=dados.nome.trim();
  if(nome.length<3||nome.length>120) throw new Error('Informe seu nome completo.');
  const {error}=await supabase.from('usuarios').update({nome}).eq('uid',usuarioAtual.value.uid);
  if(error) throw error;
  await recarregarPerfil();
}
export async function logout(){
  const {error}=await supabase.auth.signOut();if(error) throw error;
  profileVersion++;identidade.value=null;usuarioAtual.value=null;emailPendente.value='';recuperandoSenha.value=false;
  sessionStorage.removeItem(pendingKey);sessionStorage.removeItem(recoveryKey);
}
export async function enviarVerificacaoEmail(){
  const email=emailDaConta();if(!email) throw new Error('Informe o e-mail na tela de login.');
  const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}/auth/retorno`}});
  if(error) throw error;
}
export async function confirmarVerificacaoEmail(){
  const {data,error}=await supabase.auth.getUser();
  if(error||!data.user) throw new Error('Se já confirmou o link, volte ao login e entre com seu e-mail e senha.');
  identidade.value=data.user;await recarregarPerfil();return emailEstaVerificado();
}
