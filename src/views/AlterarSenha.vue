<template>
  <ion-page><ion-content><main class="auth-shell"><section class="auth-panel">
    <div class="role-badge">Segurança da conta</div><h1>{{ usuario?.trocarSenha ? 'Escolha sua nova senha' : 'Alterar senha' }}</h1>
    <p v-if="usuario?.trocarSenha">Sua senha é temporária. Para acessar o TaskEdu, escolha uma senha pessoal diferente.</p>
    <p v-else>Use uma senha com pelo menos 8 caracteres, letras e números.</p>
    <form @submit.prevent="salvar">
      <ion-input v-model="senha" label="Nova senha" :type="mostrar?'text':'password'" autocomplete="new-password" label-placement="stacked" fill="outline" :minlength="8" :maxlength="128" required/>
      <ion-input v-model="confirmacao" label="Confirmar nova senha" :type="mostrar?'text':'password'" autocomplete="new-password" label-placement="stacked" fill="outline" required/>
      <ion-button type="button" fill="clear" @click="mostrar=!mostrar">{{ mostrar ? 'Ocultar senhas' : 'Mostrar senhas' }}</ion-button>
      <p v-if="erro" class="error" role="alert">{{erro}}</p>
      <ion-button type="submit" expand="block" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar nova senha' }}</ion-button>
    </form>
    <ion-button v-if="!usuario?.trocarSenha" expand="block" fill="clear" :disabled="salvando" @click="router.replace(destinoDaConta())">Voltar</ion-button>
    <ion-button expand="block" fill="clear" :disabled="salvando" @click="sair">Sair da conta</ion-button>
  </section></main></ion-content></ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton,IonContent,IonInput,IonPage,toastController } from '@ionic/vue';
import { alterarSenha } from '../services/admin.service';
import { getUsuarioAtual,logout,mensagemAuth,destinoDaConta } from '../services/auth.service';
const usuario=getUsuarioAtual(),router=useRouter(),senha=ref(''),confirmacao=ref(''),mostrar=ref(false),erro=ref(''),salvando=ref(false);
async function sair(){try{await logout();await router.replace('/login');}catch(e){erro.value=mensagemAuth(e);}}
async function salvar(){
  erro.value='';
  if(senha.value.length<8||!/[A-Za-z]/.test(senha.value)||!/[0-9]/.test(senha.value)){erro.value='Use pelo menos 8 caracteres, com letras e números.';return;}
  if(senha.value!==confirmacao.value){erro.value='As senhas não coincidem.';return;}
  salvando.value=true;
  try{await alterarSenha(senha.value);senha.value='';confirmacao.value='';await logout();await router.replace('/login');const toast=await toastController.create({message:'Senha alterada! Entre com sua nova senha.',duration:3500,color:'success'});await toast.present();}
  catch(e){erro.value=mensagemAuth(e);}finally{salvando.value=false;}
}
</script>
