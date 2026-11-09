<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title><span class="toolbar-page-title">Atividades</span><span class="toolbar-brand-right">Task<span>Edu</span></span></ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="page-container">
        <header class="page-heading activities-heading">
          <div>
            <p>Rotina acadêmica</p>
            <h1>Minhas atividades</h1>
            <span class="hero-support">Acompanhe seus compromissos e mantenha tudo em dia.</span>
          </div>
          <div v-if="usuario?.turma" class="profile-chip">{{ usuario?.turma }}</div>
        </header>

        <div class="section-title activities-title">
          <div>
            <p class="section-kicker">LISTA DE COMPROMISSOS</p>
            <h2>{{ filtradas.length }} atividade(s) encontrada(s)</h2>
          </div>
          <p>{{ concluidas }} concluída(s)</p>
        </div>

        <div class="filters-panel">
          <ion-searchbar v-model="busca" placeholder="Buscar matéria, título ou professor" :debounce="200" />
          <div class="filter-chips">
            <button v-for="item in filtros" :key="item" :class="{ active: filtro === item }" @click="filtro = item">
              {{ item }}
            </button>
          </div>
        </div>

        <LoadingGrid v-if="carregando" />
        <div v-else class="activity-grid">
          <div v-if="!filtradas.length" class="empty-state full-width">
            <ion-icon :icon="calendarClearOutline" />
            <h3>Nenhuma atividade encontrada</h3>
            <p>Tente buscar outro termo ou selecionar outro filtro.</p>
          </div>
          <AtividadeCard
            v-for="item in filtradas"
            :key="item.id"
            :atividade="item"
            modo-aluno
            :concluida="estado(item.id).concluida"
            :favorita="estado(item.id).favorita"
            @concluir="alternarConclusao"
            @favoritar="alternarFavorito"
          />
        </div>
      </main>
    </ion-content>
    <BottomNav tipo="aluno" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onIonViewWillEnter, IonContent, IonHeader, IonIcon, IonPage, IonSearchbar, IonTitle, IonToolbar, toastController } from '@ionic/vue';
import { calendarClearOutline } from 'ionicons/icons';
import AtividadeCard from '../components/AtividadeCard.vue';
import BottomNav from '../components/BottomNav.vue';
import LoadingGrid from '../components/LoadingGrid.vue';
import { getUsuarioAtual } from '../services/auth.service';
import { listarAtividadesPorTurma, listarProgressos, salvarProgresso } from '../services/atividades.service';
import type { Atividade, ProgressoAtividade } from '../types';
import { diferencaDias, estaSemana } from '../utils/datas';

const usuario = getUsuarioAtual();
const atividades = ref<Atividade[]>([]);
const progressos = ref<ProgressoAtividade[]>([]);
const carregando = ref(true);
const busca = ref('');
const filtro = ref('Todas');
const filtros = ['Todas', 'Hoje', 'Esta semana', 'Provas', 'Trabalhos', 'Atividades', 'Favoritas', 'Concluídas'];

const estado = (id: string) => progressos.value.find((item) => item.atividadeId === id) || { concluida: false, favorita: false };
const concluidas = computed(() => atividades.value.filter((item) => estado(item.id).concluida).length);
const filtradas = computed(() => atividades.value.filter((item) => {
  const texto = `${item.materia} ${item.titulo || ''} ${item.descricao} ${item.professorNome}`.toLowerCase();
  if (!texto.includes(busca.value.toLowerCase())) return false;
  const dias = diferencaDias(item.dataEntrega.toDate());
  if (filtro.value === 'Hoje') return dias === 0;
  if (filtro.value === 'Esta semana') return estaSemana(item.dataEntrega.toDate());
  if (filtro.value === 'Provas') return item.tipo === 'Prova';
  if (filtro.value === 'Trabalhos') return item.tipo === 'Trabalho';
  if (filtro.value === 'Atividades') return item.tipo === 'Atividade';
  if (filtro.value === 'Favoritas') return estado(item.id).favorita;
  if (filtro.value === 'Concluídas') return estado(item.id).concluida;
  return true;
}).sort((a, b) => a.dataEntrega.toMillis() - b.dataEntrega.toMillis()));

onIonViewWillEnter(async () => {
  if (usuario.value?.turma) {
    [atividades.value, progressos.value] = await Promise.all([
      listarAtividadesPorTurma(usuario.value.turma),
      listarProgressos(usuario.value.uid),
    ]);
  }
  carregando.value = false;
});

async function alterar(id: string, tipo: 'concluida' | 'favorita') {
  if (!usuario.value) return;
  const atual = estado(id);
  await salvarProgresso(usuario.value.uid, id, { [tipo]: !atual[tipo] });
  progressos.value = await listarProgressos(usuario.value.uid);
  const toast = await toastController.create({ message: tipo === 'concluida' ? 'Progresso atualizado!' : 'Favoritos atualizados!', duration: 1400, color: 'success', position: 'top' });
  await toast.present();
}

const alternarConclusao = (id: string) => alterar(id, 'concluida');
const alternarFavorito = (id: string) => alterar(id, 'favorita');
</script>

<style scoped>
.activities-heading { min-height: 170px; }
.activities-title { margin-top: 34px; }
@media (max-width: 620px) {
  .activities-heading { min-height: 150px; }
  .activities-title { margin-top: 26px; }
}
</style>
