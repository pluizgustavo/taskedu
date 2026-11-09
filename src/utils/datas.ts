import type { Atividade } from '../types';
const inicioDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate());
export const diferencaDias = (data: Date) => Math.round((inicioDia(data).getTime() - inicioDia(new Date()).getTime()) / 86400000);
export const mesmoDia = (a: Date, b: Date) => inicioDia(a).getTime() === inicioDia(b).getTime();
export const estaSemana = (data: Date) => { const dias = diferencaDias(data); return dias >= 0 && dias <= 7; };
export const saudacao = () => { const hora = new Date().getHours(); return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'; };
export const formatarData = (data: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(data).replace(' às ', ' · ');
export const formatarISO = (data: Date) => `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
export function statusPrazo(atividade: Atividade) {
  const dias = diferencaDias(atividade.dataEntrega.toDate());
  if (dias < 0) return { texto: 'Atrasada', nivel: 'atrasada' };
  if (dias === 0) return { texto: 'Hoje', nivel: 'hoje' };
  if (dias === 1) return { texto: 'Amanhã', nivel: 'amanha' };
  if (dias <= 7) return { texto: `Faltam ${dias} dias`, nivel: 'semana' };
  if (dias <= 14) return { texto: 'Próxima semana', nivel: 'normal' };
  return { texto: `${dias} dias`, nivel: 'normal' };
}
