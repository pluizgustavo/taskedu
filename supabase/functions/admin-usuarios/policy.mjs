export const ADMIN_EMAIL='enriquefelez32@gmail.com';
export const CLASSES=['1 ano','2 ano','3 ano'];
export function deletionTarget(uid,actorUid,profile) {
  if(typeof uid!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)||uid===actorUid) throw new Error('Selecione um aluno ou professor.');
  if(!profile||!['aluno','professor'].includes(profile.tipo)||profile.email?.toLowerCase()===ADMIN_EMAIL) throw new Error('A conta do administrador não pode ser excluída.');
}
export function authorizedAdmin(user, profile) {
  return Boolean(user?.id && user.email===ADMIN_EMAIL && user.email_confirmed_at && profile?.uid===user.id && profile.tipo==='admin' && profile.email===ADMIN_EMAIL && profile.ativo===true && profile.trocar_senha===false);
}
export function accountInput(value, creating=true) {
  if(!value || typeof value.nome!=='string' || value.nome.trim().length<3 || value.nome.length>120) throw new Error('Informe o nome completo.');
  if(!['aluno','professor'].includes(value.tipo)) throw new Error('Selecione aluno ou professor.');
  /** @type {{nome:string,tipo:'aluno'|'professor',turma:string|null,turmas:string[],email?:string,senha?:string}} */
  const result={nome:value.nome.trim(),tipo:value.tipo,turma:null,turmas:[]};
  if(value.tipo==='aluno') {
    if(!CLASSES.includes(value.turma)) throw new Error('Selecione uma turma para o aluno.');
    result.turma=value.turma;
  }else{
    if(!Array.isArray(value.turmas)||!value.turmas.length||value.turmas.some(t=>!CLASSES.includes(t))) throw new Error('Selecione as turmas do professor.');
    result.turmas=[...new Set(value.turmas)];
  }
  if(creating){
    if(typeof value.email!=='string'||value.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new Error('Informe um e-mail válido.');
    result.email=value.email.trim().toLowerCase();
    if(result.email===ADMIN_EMAIL) throw new Error('A conta do administrador está protegida.');
    if(typeof value.senha!=='string'||value.senha.length<8||value.senha.length>128||!/[A-Za-z]/.test(value.senha)||!/[0-9]/.test(value.senha)) throw new Error('Use 8 a 128 caracteres, com letras e números.');
    result.senha=value.senha;
  }
  return result;
}
