import type { Atividade, ProgressoAtividade, Usuario } from '../types';
import { instante } from '../utils/instante';

export function mapUsuario(row: Record<string, any>): Usuario {
  return { uid: row.uid, nome: row.nome, email: row.email, tipo: row.tipo, turma: row.turma || '', turmas: row.turmas || [], ativo: row.ativo, trocarSenha: row.trocar_senha, criadoEm: instante(row.criado_em) };
}
export function mapAtividade(row: Record<string, any>): Atividade {
  return { id: row.id, titulo: row.titulo, materia: row.materia, tipo: row.tipo, descricao: row.descricao, prioridade: row.prioridade, turma: row.turma, professorId: row.professor_id, professorNome: row.professor_nome, dataEntrega: instante(row.data_entrega), criadoEm: instante(row.criado_em), atualizadoEm: row.atualizado_em ? instante(row.atualizado_em) : undefined };
}
export function mapProgresso(row: Record<string, any>): ProgressoAtividade {
  return { id: `${row.usuario_id}_${row.atividade_id}`, usuarioId: row.usuario_id, atividadeId: row.atividade_id, concluida: row.concluida, favorita: row.favorita, atualizadoEm: instante(row.atualizado_em) };
}
