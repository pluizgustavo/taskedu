<template>
  <ion-page><ion-content><main class="auth-shell"><section class="auth-panel">
    <h1>Confirme seu e-mail</h1>
    <p>Para acessar o TaskEdu, abra o link de confirmação enviado para <strong>{{ email }}</strong>.</p>
    <p>Confira também a pasta de spam. Depois de clicar no link, volte aqui e toque em “Já confirmei meu e-mail”.</p>
    <p v-if="mensagem" role="status">{{ mensagem }}</p>
    <p v-if="erro" class="error" role="alert">{{ erro }}</p>
    <ion-button expand="block" :disabled="ocupado" @click="confirmar">Já confirmei meu e-mail</ion-button>
    <ion-button expand="block" fill="outline" :disabled="ocupado || espera > 0" @click="reenviar">{{ espera > 0 ? `Reenviar em ${espera}s` : 'Reenviar confirmação' }}</ion-button>
    <ion-button expand="block" fill="clear" :disabled="ocupado" @click="sair">Sair e usar outra conta</ion-button>
  </section></main></ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButton, IonContent, IonPage } from '@ionic/vue';
import { mensagemAuth, destinoDaConta, confirmarVerificacaoEmail, emailDaConta, enviarVerificacaoEmail, getUsuarioAtual, logout } from '../services/auth.service';

const route = useRoute(), router = useRouter();
const usuarioAtual = getUsuarioAtual();
const email = computed(() => usuarioAtual.value?.email ?? emailDaConta());
const ocupado = ref(false), erro = ref('');
const mensagem = ref(route.query.enviado === '1' ? 'E-mail de confirmação enviado!' : route.query.enviado === '0' ? 'Sua conta foi criada, mas não conseguimos enviar a confirmação. Toque em “Reenviar confirmação”.' : 'Seu e-mail ainda não foi confirmado. Se precisar, solicite um novo link abaixo.');
const espera = ref(route.query.enviado === '1' ? 60 : 0);
const timer = setInterval(() => { if (espera.value > 0) espera.value--; }, 1000);
onUnmounted(() => clearInterval(timer));

function mensagemErro(e: unknown) {
  return mensagemAuth(e);
}
async function reenviar() {
  ocupado.value = true; erro.value = ''; mensagem.value = '';
  try { await enviarVerificacaoEmail(); mensagem.value = 'Novo link enviado! Confira sua caixa de entrada e o spam.'; espera.value = 60; }
  catch (e) { erro.value = mensagemErro(e); }
  finally { ocupado.value = false; }
}
async function confirmar() {
  ocupado.value = true; erro.value = ''; mensagem.value = '';
  try {
    if (!await confirmarVerificacaoEmail()) { erro.value = 'Seu e-mail ainda não foi confirmado. Abra o link recebido e tente novamente.'; return; }
    const usuario = getUsuarioAtual().value;
    if (!usuario) { erro.value = 'Seu perfil não foi encontrado. Saia e entre novamente.'; return; }
    await router.replace(destinoDaConta());
  } catch (e) { erro.value = mensagemErro(e); }
  finally { ocupado.value = false; }
}
async function sair() {
  ocupado.value = true; erro.value = '';
  try { await logout(); await router.replace('/login'); }
  catch (e) { erro.value = mensagemErro(e); }
  finally { ocupado.value = false; }
}
</script>
