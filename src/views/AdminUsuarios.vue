<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title><span class="toolbar-page-title">Administração</span><span class="toolbar-brand-right">Task<span>Edu</span></span></ion-title></ion-toolbar></ion-header>
    <ion-content><main class="page-container admin-page">
      <header class="page-heading"><div><p>PAINEL DO ADMINISTRADOR</p><h1>Contas e turmas</h1><span class="hero-support">Cadastre os usuários e defina o acesso de cada pessoa.</span></div></header>
      <section class="metric-grid"><article><span>Alunos</span><strong>{{ alunos }}</strong><small>cadastrados</small></article><article><span>Professores</span><strong>{{ professores }}</strong><small>cadastrados</small></article><article><span>Turmas</span><strong>{{ TURMAS.length }}</strong><small>disponíveis</small></article></section>
      <div class="admin-layout">
        <section class="profile-card">
          <div class="section-title"><h2>{{ editando ? 'Editar conta' : 'Criar conta' }}</h2></div>
          <form @submit.prevent="salvar">
            <ion-input v-model="form.nome" label="Nome completo" label-placement="stacked" fill="outline" :maxlength="120" required/>
            <ion-input v-model="form.email" type="email" label="E-mail" label-placement="stacked" fill="outline" :readonly="!!editando" required/>
            <ion-select v-model="form.tipo" label="Perfil de acesso" label-placement="stacked" fill="outline"><ion-select-option value="aluno">Aluno</ion-select-option><ion-select-option value="professor">Professor</ion-select-option></ion-select>
            <ion-select v-if="form.tipo==='aluno'" v-model="form.turma" :interface-options="{ cssClass: 'admin-class-select' }" :multiple="false" label="Turma do aluno" label-placement="stacked" fill="outline" placeholder="Selecione uma turma"><ion-select-option v-for="t in TURMAS" :key="t" :value="t">{{ t }}</ion-select-option></ion-select>
            <ion-select v-else v-model="form.turmas" :interface-options="{ cssClass: 'admin-class-select' }" :multiple="true" label="Turmas do professor" label-placement="stacked" fill="outline" placeholder="Selecione uma ou mais turmas" cancel-text="Cancelar" ok-text="Confirmar"><ion-select-option v-for="t in TURMAS" :key="t" :value="t">{{ t }}</ion-select-option></ion-select>
            <template v-if="!editando">
              <ion-input v-model="form.senha" :type="mostrarSenha?'text':'password'" label="Senha temporária" label-placement="stacked" fill="outline" autocomplete="new-password" :minlength="8" :maxlength="128" required/>
              <ion-button type="button" fill="clear" size="small" @click="mostrarSenha=!mostrarSenha">{{ mostrarSenha ? 'Ocultar senha' : 'Mostrar senha' }}</ion-button>
              <ion-button type="button" fill="outline" size="small" @click="gerarSenha">Gerar senha temporária</ion-button>
              <p class="admin-help">Entregue o e-mail e a senha temporária ao usuário. No primeiro acesso, ele confirmará o e-mail e escolherá uma nova senha.</p>
            </template>
            <p v-if="erroForm" class="error" role="alert">{{ erroForm }}</p>
            <p v-if="sucesso" role="status">{{ sucesso }}</p>
            <ion-button type="submit" expand="block" :disabled="salvando || !!excluindo">{{ salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar conta' }}</ion-button>
            <ion-button v-if="editando" type="button" fill="clear" :disabled="salvando" @click="limpar">Cancelar edição</ion-button>
          </form>
        </section>
        <section class="profile-card">
          <div class="section-title"><h2>Contas cadastradas</h2><ion-button size="small" fill="outline" :disabled="carregando" @click="carregar">Atualizar</ion-button></div>
          <ion-searchbar v-model="busca" placeholder="Buscar nome ou e-mail"/>
          <p v-if="erroLista" class="error" role="alert">{{ erroLista }}</p>
          <p v-if="carregando" role="status">Carregando contas...</p>
          <p v-else-if="!filtradas.length" class="admin-help">Nenhuma conta encontrada.</p>
          <ul class="accounts-list"><li v-for="conta in filtradas" :key="conta.uid">
            <div><strong>{{ conta.nome }}</strong><p>{{ conta.email }}</p><span class="role-badge">{{ conta.tipo === 'admin' ? 'Administrador' : conta.tipo }}</span><p>{{ conta.tipo==='aluno' ? conta.turma || 'Sem turma' : conta.tipo==='professor' ? conta.turmas?.join(', ') || 'Sem turmas' : 'Administração do site' }}</p><small v-if="conta.trocarSenha">Troca de senha pendente</small></div>
            <div v-if="conta.tipo!=='admin'" class="account-actions">
              <ion-button fill="outline" size="small" :disabled="salvando || !!excluindo" @click="editar(conta)">Editar</ion-button>
              <ion-button fill="outline" color="danger" size="small" :disabled="salvando || !!excluindo" @click="excluir(conta)">{{ excluindo===conta.uid ? 'Excluindo...' : 'Excluir' }}</ion-button>
            </div>
          </li></ul>
        </section>
      </div>
    </main></ion-content><BottomNav tipo="admin"/>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { alertController, IonButton, IonContent, IonHeader, IonInput, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import BottomNav from '../components/BottomNav.vue';
import { TURMAS, type Usuario } from '../types';
import { criarConta, editarConta, excluirConta, listarContas, type ContaAdministrada } from '../services/admin.service';
import { mensagemAuth } from '../services/auth.service';

const contas=ref<Usuario[]>([]),busca=ref(''),editando=ref(''),carregando=ref(false),salvando=ref(false),erroForm=ref(''),erroLista=ref(''),sucesso=ref(''),mostrarSenha=ref(false);
const excluindo=ref('');

const vazio=():ContaAdministrada=>({nome:'',email:'',tipo:'aluno',turma:'',turmas:[],senha:''});
const form=reactive<ContaAdministrada>(vazio());
const alunos=computed(()=>contas.value.filter(c=>c.tipo==='aluno').length);
const professores=computed(()=>contas.value.filter(c=>c.tipo==='professor').length);
const filtradas=computed(()=>contas.value.filter(c=>`${c.nome} ${c.email}`.toLowerCase().includes(busca.value.toLowerCase())));
async function carregar(){carregando.value=true;erroLista.value='';try{contas.value=await listarContas();}catch(e){erroLista.value=mensagemAuth(e);}finally{carregando.value=false;}}
onIonViewWillEnter(carregar);
function limpar(){Object.assign(form,vazio());editando.value='';erroForm.value='';mostrarSenha.value=false;}
function editar(conta:Usuario){limpar();sucesso.value='';editando.value=conta.uid;Object.assign(form,{nome:conta.nome,email:conta.email,tipo:conta.tipo,turma:conta.turma||'',turmas:[...(conta.turmas||[])]});}
function gerarSenha(){const bytes=crypto.getRandomValues(new Uint8Array(12));form.senha='Te9!'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');mostrarSenha.value=true;}
async function salvar(){
  if(excluindo.value) return;
  erroForm.value='';sucesso.value='';
  if(form.nome.trim().length<3){erroForm.value='Informe o nome completo.';return;}
  if(form.tipo==='aluno'&&!TURMAS.includes(form.turma)){erroForm.value='Selecione a turma do aluno.';return;}
  if(form.tipo==='professor'&&!form.turmas.length){erroForm.value='Selecione as turmas do professor.';return;}
  if(!editando.value&&(form.senha.length<8||!/[A-Za-z]/.test(form.senha)||!/[0-9]/.test(form.senha))){erroForm.value='Use uma senha temporária com pelo menos 8 caracteres, letras e números.';return;}
  salvando.value=true;
  try{
    const email=form.email.trim();
    if(editando.value){const {senha,...dados}=form;await editarConta(editando.value,dados);sucesso.value='Conta atualizada.';}
    else{await criarConta({...form});sucesso.value=`Conta criada para ${email}. Entregue a senha temporária ao usuário.`;}
    limpar();await carregar();
  }catch(e){erroForm.value=mensagemAuth(e);}
  finally{salvando.value=false;}
}
async function excluir(conta:Usuario){
  if(salvando.value||excluindo.value||conta.tipo==='admin') return;
  excluindo.value=conta.uid;erroLista.value='';sucesso.value='';
  try{
    const alerta=await alertController.create({header:'Excluir esta conta?',subHeader:conta.email,message:'O login, o perfil e os progressos pessoais serão apagados. Esta ação não pode ser desfeita.',buttons:[{text:'Cancelar',role:'cancel'},{text:'Excluir conta',role:'destructive'}]});
    await alerta.present();
    if((await alerta.onDidDismiss()).role!=='destructive') return;
    await excluirConta(conta.uid);
    if(editando.value===conta.uid) limpar();
    sucesso.value='Conta excluída.';await carregar();
  }catch(e){erroLista.value=mensagemAuth(e);}
  finally{excluindo.value='';}
}
</script>
<style scoped>
.account-actions{display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}
.admin-layout{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(0,1.15fr);gap:24px;align-items:start;margin-top:30px}.admin-layout .profile-card{width:100%;margin:0}.admin-layout .section-title{margin:0 0 20px;gap:12px}.admin-help,.accounts-list p,.accounts-list small{color:var(--muted);font-size:.88rem;line-height:1.5}.accounts-list{list-style:none;padding:0;margin:12px 0}.accounts-list li{display:flex;justify-content:space-between;gap:12px;align-items:start;padding:20px 0;border-bottom:1px solid var(--line)}.accounts-list li>div{min-width:0;overflow-wrap:anywhere}.accounts-list p{margin:6px 0}.accounts-list strong{color:var(--ink)}@media(max-width:850px){.admin-layout{grid-template-columns:1fr}}
</style>
