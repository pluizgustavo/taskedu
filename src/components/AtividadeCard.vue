<template>
  <ion-card class="task-card" :class="[prazo.nivel,{concluida}]">
    <ion-card-header>
      <div class="card-heading"><span class="type-chip" :data-type="atividade.tipo">{{ atividade.tipo }}</span><ion-badge :color="badgeColor">{{ concluida ? 'Concluída' : prazo.texto }}</ion-badge></div>
      <ion-card-subtitle>{{ atividade.materia }} · {{ atividade.turma }}</ion-card-subtitle>
      <ion-card-title>{{ atividade.titulo || atividade.descricao }}</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <p v-if="atividade.titulo" class="description">{{ atividade.descricao }}</p>
      <div class="delivery"><ion-icon :icon="calendarOutline"/><div><span>Entrega</span><strong>{{ formatarData(atividade.dataEntrega.toDate()) }}</strong></div></div>
      <div class="card-meta"><span>Prof. {{ atividade.professorNome }}</span><span v-if="atividade.prioridade" class="priority" :data-priority="atividade.prioridade">{{ atividade.prioridade }}</span></div>
      <div class="card-actions">
        <ion-button v-if="modoAluno" fill="clear" size="small" @click="$emit('favoritar',atividade.id)"><ion-icon slot="icon-only" :icon="favorita?star:starOutline" :aria-label="favorita?'Remover favorito':'Favoritar'"/></ion-button>
        <ion-button v-if="modoAluno" fill="outline" size="small" @click="$emit('concluir',atividade.id)"><ion-icon slot="start" :icon="concluida?refreshOutline:checkmarkOutline"/>{{ concluida?'Reabrir':'Concluir' }}</ion-button>
        <ion-button v-if="podeEditar" fill="clear" size="small" :router-link="`/professor/atividade/${atividade.id}/editar`"><ion-icon slot="start" :icon="createOutline"/>Editar</ion-button>
        <ion-button v-if="podeExcluir" fill="clear" color="danger" size="small" @click="$emit('excluir',atividade.id)"><ion-icon slot="start" :icon="trashOutline"/>Excluir</ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { IonBadge,IonButton,IonCard,IonCardContent,IonCardHeader,IonCardSubtitle,IonCardTitle,IonIcon } from '@ionic/vue';
import { calendarOutline,checkmarkOutline,createOutline,refreshOutline,star,starOutline,trashOutline } from 'ionicons/icons';
import type { Atividade } from '../types';
import { formatarData,statusPrazo } from '../utils/datas';
const props=defineProps<{atividade:Atividade;podeExcluir?:boolean;podeEditar?:boolean;modoAluno?:boolean;concluida?:boolean;favorita?:boolean}>();
defineEmits<{excluir:[id:string];concluir:[id:string];favoritar:[id:string]}>();
const prazo=computed(()=>statusPrazo(props.atividade));
const badgeColor=computed(()=>props.concluida?'success':prazo.value.nivel==='atrasada'?'danger':prazo.value.nivel==='hoje'||prazo.value.nivel==='amanha'?'warning':'primary');
</script>
