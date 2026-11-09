<template>
  <nav class="bottom-nav" aria-label="Navegação principal">
    <router-link :to="`/${tipo}/home`"><ion-icon :icon="homeOutline" /><span>Início</span></router-link>
    <router-link v-if="tipo==='aluno'" to="/aluno/calendario"><ion-icon :icon="calendarOutline" /><span>Calendário</span></router-link>
    <router-link v-if="tipo!=='admin'" :to="`/${tipo}/atividades`"><ion-icon :icon="listOutline" /><span>Atividades</span></router-link>
    <router-link v-if="tipo==='professor'" class="nav-create" to="/professor/nova-atividade"><ion-icon :icon="addOutline" /><span>Nova</span></router-link>
    <router-link :to="`/${tipo}/perfil`"><ion-icon :icon="personOutline" /><span>Perfil</span></router-link>
  </nav>
</template>
<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { addOutline, calendarOutline, homeOutline, listOutline, personOutline } from 'ionicons/icons';
import type { TipoUsuario } from '../types';
defineProps<{ tipo: TipoUsuario }>();
</script>
