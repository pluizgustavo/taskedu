import { supabase } from '../supabase';
import { mapAtividade, mapProgresso } from './supabase-mappers';
import type { Prioridade, TipoAtividade } from '../types';

export interface NovaAtividade { titulo:string;materia:string;tipo:TipoAtividade;descricao:string;prioridade?:Prioridade;dataEntrega:Date;turma:string;professorId:string;professorNome:string; }
function fields(dados:Omit<NovaAtividade,'professorId'|'professorNome'>){
  return {titulo:dados.titulo,materia:dados.materia,tipo:dados.tipo,descricao:dados.descricao,prioridade:dados.prioridade||'Média',turma:dados.turma,data_entrega:dados.dataEntrega.toISOString()};
}
export async function criarAtividade(dados:NovaAtividade){
  const {data,error}=await supabase.from('atividades').insert({...fields(dados),professor_id:dados.professorId,professor_nome:dados.professorNome}).select('id').single();
  if(error) throw error;return data;
}
export async function atualizarAtividade(id:string,dados:Omit<NovaAtividade,'professorId'|'professorNome'>){
  const {data,error}=await supabase.from('atividades').update(fields(dados)).eq('id',id).select('id').single();
  if(error) throw error;return data;
}
export async function buscarAtividade(id:string){
  const {data,error}=await supabase.from('atividades').select('*').eq('id',id).maybeSingle();
  if(error) throw error;return data?mapAtividade(data):null;
}
async function listar(campo:'turma'|'professor_id',valor:string){
  const {data,error}=await supabase.from('atividades').select('*').eq(campo,valor).order('data_entrega');
  if(error) throw error;return (data||[]).map(mapAtividade);
}
export const listarAtividadesPorTurma=(turma:string)=>listar('turma',turma);
export const listarAtividadesPorProfessor=(id:string)=>listar('professor_id',id);
export async function excluirAtividade(id:string){const {error}=await supabase.from('atividades').delete().eq('id',id);if(error) throw error;}
export async function listarProgressos(usuarioId:string){
  const {data,error}=await supabase.from('progressos').select('*').eq('usuario_id',usuarioId);
  if(error) throw error;return (data||[]).map(mapProgresso);
}
export async function salvarProgresso(usuarioId:string,atividadeId:string,alteracao:{concluida?:boolean;favorita?:boolean}){
  const {data,error}=await supabase.from('progressos').select('atividade_id').eq('usuario_id',usuarioId).eq('atividade_id',atividadeId).maybeSingle();
  if(error) throw error;
  const changes={...(alteracao.concluida!==undefined?{concluida:alteracao.concluida}:{}),...(alteracao.favorita!==undefined?{favorita:alteracao.favorita}:{})};
  const update=()=>supabase.from('progressos').update(changes).eq('usuario_id',usuarioId).eq('atividade_id',atividadeId);
  let result=data?await update():await supabase.from('progressos').insert({usuario_id:usuarioId,atividade_id:atividadeId,...changes});
  if(result.error?.code==='23505') result=await update();
  if(result.error) throw result.error;
}
