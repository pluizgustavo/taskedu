import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { aguardarAutenticacao, getUsuarioAtual, destinoDaConta, temEmailPendente, recuperandoSenha, sessaoAtiva, marcarRecuperacao } from '../services/auth.service';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/auth/retorno', component: () => import('../views/LoginPage.vue') },
  { path: '/login', component: () => import('../views/LoginPage.vue') },
  { path: '/escolha', redirect: '/login' },
  { path: '/login/:tipo', redirect: '/login' },
  { path: '/cadastro/:tipo', redirect: '/login' },
  { path: '/recuperar-senha', component: () => import('../views/RecuperarSenha.vue') },
  { path: '/recuperar-senha/:tipo', redirect: '/recuperar-senha' },
  { path: '/verificar-email', component: () => import('../views/VerificarEmail.vue'), meta: { autenticado: true } },
  { path: '/alterar-senha', component: () => import('../views/AlterarSenha.vue'), meta: { autenticado: true } },
  { path: '/sobre', component: () => import('../views/SobrePage.vue'), meta: { autenticado: true } },
  { path: '/admin/home', component: () => import('../views/AdminUsuarios.vue'), meta: { autenticado: true, tipo: 'admin' } },
  { path: '/admin/perfil', component: () => import('../views/PerfilTaskEdu.vue'), meta: { autenticado: true, tipo: 'admin' } },
  { path: '/aluno/home', component: () => import('../views/HomeAluno.vue'), meta: { autenticado: true, tipo: 'aluno' } },
  { path: '/aluno/atividades', component: () => import('../views/AtividadesAluno.vue'), meta: { autenticado: true, tipo: 'aluno' } },
  { path: '/aluno/calendario', component: () => import('../views/CalendarioAluno.vue'), meta: { autenticado: true, tipo: 'aluno' } },
  { path: '/aluno/perfil', component: () => import('../views/PerfilTaskEdu.vue'), meta: { autenticado: true, tipo: 'aluno' } },
  { path: '/professor/home', component: () => import('../views/HomeProfessor.vue'), meta: { autenticado: true, tipo: 'professor' } },
  { path: '/professor/atividades', component: () => import('../views/HomeProfessor.vue'), props: { paginaAtividades: true }, meta: { autenticado: true, tipo: 'professor' } },
  { path: '/professor/perfil', component: () => import('../views/PerfilTaskEdu.vue'), meta: { autenticado: true, tipo: 'professor' } },
  { path: '/professor/nova-atividade', component: () => import('../views/NovaAtividade.vue'), meta: { autenticado: true, tipo: 'professor' } },
  { path: '/professor/atividade/:id/editar', component: () => import('../views/EditarAtividade.vue'), meta: { autenticado: true, tipo: 'professor' } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];
const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });
router.beforeEach(async to => {
  await aguardarAutenticacao();
  if(to.path==='/auth/retorno') {
    if(to.query.recuperacao==='1'&&sessaoAtiva()) marcarRecuperacao();
    return sessaoAtiva()?destinoDaConta():{path:'/login',query:{erro:'link'}};
  }
  if(to.path==='/verificar-email'&&temEmailPendente()) return true;
  if(recuperandoSenha.value&&sessaoAtiva()) return to.path==='/alterar-senha'?true:'/alterar-senha';
  const usuario = getUsuarioAtual().value;
  if (!usuario || usuario.ativo !== true) return to.meta.autenticado ? '/login' : true;
  const destino = destinoDaConta();
  if (destino === '/verificar-email' || (destino === '/alterar-senha' && usuario.trocarSenha)) return to.path === destino ? true : destino;
  if (to.path === '/verificar-email' || to.path === '/login' || to.path === '/recuperar-senha') return destino;
  if (to.meta.tipo && to.meta.tipo !== usuario.tipo) return destino;
});
export default router;
