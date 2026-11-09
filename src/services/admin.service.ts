import { supabase } from '../supabase';
import { mapUsuario } from './supabase-mappers';
import { recarregarPerfil } from './auth.service';

export interface ContaAdministrada {nome:string;email:string;tipo:'aluno'|'professor';turma:string;turmas:string[];senha:string;}
async function executar(body:Record<string,unknown>){
  const {data,error}=await supabase.functions.invoke('admin-usuarios',{body});
  if(error){
    const response=(error as {context?:Response}).context;
    let detail:string|undefined;
    if(response instanceof Response){try{const payload=await response.json();detail=payload.error||payload.message;}catch{}}
    throw new Error(detail||'O navegador não conseguiu conectar à administração. Confira sua conexão e publique a versão atualizada da função no Supabase.');
  }
  if(data?.error) throw new Error(data.error);
  return data;
}
export const criarConta=(dados:ContaAdministrada)=>executar({acao:'criar',dados});
export const editarConta=(uid:string,dados:Omit<ContaAdministrada,'senha'>)=>executar({acao:'editar',uid,dados});
export const excluirConta=(uid:string)=>executar({acao:'excluir',uid});
export async function alterarSenha(novaSenha:string){
  const {error}=await supabase.auth.updateUser({password:novaSenha});
  if(error) throw error;
  await recarregarPerfil();
}
export async function listarContas(){
  const {data,error}=await supabase.from('usuarios').select('*').order('nome');
  if(error) throw error;return (data||[]).map(mapUsuario);
}
