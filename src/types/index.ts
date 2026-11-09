import type { Instante } from '../utils/instante';

export type TipoUsuario = 'aluno' | 'professor' | 'admin';
export type TipoAtividade = 'Atividade' | 'Trabalho' | 'Prova' | 'Projeto' | 'Seminário';
export type Prioridade = 'Baixa' | 'Média' | 'Alta';

export interface Usuario {
  uid: string; nome: string; email: string; tipo: TipoUsuario; turma?: string; turmas?: string[]; ativo?: boolean; trocarSenha?: boolean; criadoEm: Instante;
}

export interface Atividade {
  id: string; titulo?: string; materia: string; tipo: TipoAtividade; descricao: string; prioridade?: Prioridade; dataEntrega: Instante;
  turma: string; professorId: string; professorNome: string; criadoEm: Instante; atualizadoEm?: Instante;
}

export interface ProgressoAtividade {
  id: string; usuarioId: string; atividadeId: string; concluida: boolean; favorita?: boolean; atualizadoEm: Instante;
}

export const TURMAS = [
  '1 ano', '2 ano', '3 ano',
];
export const TIPOS_ATIVIDADE: TipoAtividade[] = ['Atividade', 'Trabalho', 'Prova', 'Projeto', 'Seminário'];
export const PRIORIDADES: Prioridade[] = ['Baixa', 'Média', 'Alta'];
export const MATERIAS = [
  'Arte',
  'Biologia',
  'Educação Física',
  'Filosofia',
  'Física',
  'Geografia',
  'História',
  'Língua Inglesa',
  'Língua Portuguesa',
  'Matemática',
  'Química',
  'Sociologia',
];
