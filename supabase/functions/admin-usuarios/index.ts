import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { accountInput, authorizedAdmin, ADMIN_EMAIL, deletionTarget } from './policy.mjs';
import { allowedOrigin } from './origins.mjs';

const allowedOrigins=(Deno.env.get('ALLOWED_ORIGINS')||'http://localhost:5173,http://localhost:8100,http://127.0.0.1:5173,http://127.0.0.1:8100').split(',').map(s=>s.trim());
Deno.serve(async (request:Request)=>{
  const origin=request.headers.get('origin')||'';
  const allowed=allowedOrigin(origin,allowedOrigins);
  const headers={...corsHeaders,'Content-Type':'application/json','Access-Control-Allow-Origin':allowed&&origin?origin:allowedOrigins[0],'Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
  if(!allowed) return reply(403,{error:'Origem não autorizada.'});
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(request.method!=='POST') return reply(405,{error:'Método não permitido.'});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token) return reply(401,{error:'Entre na sua conta.'});
  // A chave privilegiada existe somente no servidor e nunca é enviada ao site.
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const {data:{user},error:authError}=await admin.auth.getUser(token);
    if(authError||!user) return reply(401,{error:'Sua sessão terminou. Entre novamente.'});
    const {data:profile,error:profileError}=await admin.from('usuarios').select('*').eq('uid',user.id).single();
    if(profileError||!authorizedAdmin(user,profile)) return reply(403,{error:'Apenas o administrador pode realizar esta ação.'});
    let body;
    try{body=await request.json();}catch{return reply(400,{error:'Dados inválidos.'});}
    if(!['criar','editar','excluir'].includes(body?.acao)) return reply(400,{error:'Ação inválida.'});
    let input;
    if(body.acao!=='excluir'){
      try{input=accountInput(body.dados,body.acao==='criar');}catch(e){return reply(400,{error:(e as Error).message});}
    }
    if(body.acao==='criar'){
      const {senha,...fields}=input!;
      const {data:created,error:createError}=await admin.auth.admin.createUser({email:fields.email,password:senha,email_confirm:false,user_metadata:{nome:fields.nome}});
      if(createError||!created.user) return reply(400,{error:createError?.code==='email_exists'?'Já existe uma conta com esse e-mail.':createError?.message||'Não foi possível criar a conta.'});
      const {error:insertError}=await admin.from('usuarios').insert({...fields,uid:created.user.id,ativo:true,trocar_senha:true});
      if(insertError){
        const {error:rollbackError}=await admin.auth.admin.deleteUser(created.user.id);
        return reply(500,{error:rollbackError?'O perfil não foi criado. Revise a conta em Authentication antes de tentar novamente.':'Não foi possível criar o perfil. Confira se o script do banco foi executado.'});
      }
      return reply(200,{uid:created.user.id});
    }
    const uid=body.uid;
    if(typeof uid!=='string'||!/^[0-9a-f-]{36}$/i.test(uid)||uid===user.id) return reply(400,{error:'Selecione um aluno ou professor.'});
    const {data:target,error:targetError}=await admin.from('usuarios').select('uid,tipo,email').eq('uid',uid).single();
    if(targetError||!target||!['aluno','professor'].includes(target.tipo)||target.email===ADMIN_EMAIL) return reply(403,{error:'Conta indisponível para edição.'});
    if(body.acao==='excluir'){
      try{deletionTarget(uid,user.id,target);}catch(e){return reply(403,{error:(e as Error).message});}
      // Preserva publicações que ainda são usadas pelos alunos.
      const {count,error:countError}=await admin.from('atividades').select('id',{count:'exact',head:true}).eq('professor_id',uid);
      if(countError) return reply(500,{error:'Não foi possível verificar as atividades desta conta.'});
      if(count) return reply(409,{error:'Esta conta tem atividades publicadas. Remova essas atividades antes de excluir a conta.'});
      const {error:blockError}=await admin.from('usuarios').update({ativo:false}).eq('uid',uid).in('tipo',['aluno','professor']);
      if(blockError) return reply(500,{error:'Não foi possível bloquear a conta para exclusão.'});
      const {error:deleteError}=await admin.auth.admin.deleteUser(uid);
      if(deleteError) return reply(500,{error:'A conta foi bloqueada, mas a exclusão não terminou. Tente excluir novamente.'});
      // A FK remove o perfil e os progressos na mesma exclusão do usuário do Auth.
      return reply(200,{ok:true});
    }
    const {error}=await admin.from('usuarios').update(input!).eq('uid',uid).in('tipo',['aluno','professor']);
    if(error) return reply(500,{error:'Não foi possível atualizar a conta.'});
    return reply(200,{ok:true});
  }catch{return reply(500,{error:'Não foi possível concluir. Tente novamente em instantes.'});}
});
