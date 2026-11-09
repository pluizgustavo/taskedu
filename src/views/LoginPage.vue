<template>
  <ion-page><ion-content><main class="auth-shell"><section class="auth-panel">
    <div class="role-badge">TaskEdu</div><h1>Entre na sua conta</h1>
    <p>Acesse com o e-mail e a senha fornecidos pelo administrador.</p>
    <form @submit.prevent="entrar">
      <ion-input v-model="email" label="E-mail" label-placement="stacked" type="email" fill="outline" autocomplete="email" required/>
      <div class="password-field"><ion-input v-model="senha" label="Senha" label-placement="stacked" :type="mostrarSenha?'text':'password'" fill="outline" autocomplete="current-password" required/><ion-button type="button" fill="clear" :aria-label="mostrarSenha?'Ocultar senha':'Mostrar senha'" @click="mostrarSenha=!mostrarSenha"><ion-icon slot="icon-only" :icon="mostrarSenha?eyeOffOutline:eyeOutline"/></ion-button></div>
      <router-link class="forgot-link" to="/recuperar-senha">Esqueci minha senha</router-link>
      <p v-if="erro" class="error" role="alert">{{erro}}</p>
      <ion-button type="submit" expand="block" size="large" :disabled="carregando"><ion-spinner v-if="carregando"/><span v-else>Entrar</span></ion-button>
    </form>
    <p class="auth-link">Precisa de uma conta ou de outra turma? Procure o administrador.</p>
  </section></main></ion-content></ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import { IonButton,IonContent,IonIcon,IonInput,IonPage,IonSpinner } from '@ionic/vue';
import { eyeOffOutline,eyeOutline } from 'ionicons/icons';
import { login,destinoDaConta,mensagemAuth } from '../services/auth.service';
const route=useRoute(),router=useRouter(),email=ref(''),senha=ref(''),erro=ref(route.query.erro==='link'?'O link expirou. Solicite um novo e-mail.':''),carregando=ref(false),mostrarSenha=ref(false);
async function entrar(){
  erro.value='';carregando.value=true;
  try{await login(email.value,senha.value);await router.replace(destinoDaConta());}
  catch(e){if((e as {code?:string})?.code==='email_not_confirmed'){await router.replace('/verificar-email');return;}erro.value=mensagemAuth(e);}
  finally{carregando.value=false;}
}
</script>
