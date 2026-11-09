// Mantém o contrato das telas enquanto o banco armazena datas ISO (timestamptz).
export interface Instante { toDate(): Date; toMillis(): number; }
export function instante(value: string | Date): Instante {
  const millis = new Date(value).getTime();
  if (!Number.isFinite(millis)) throw new Error('Data inválida recebida do banco.');
  return { toDate: () => new Date(millis), toMillis: () => millis };
}
