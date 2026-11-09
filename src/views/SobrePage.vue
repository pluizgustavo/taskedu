<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button :default-href="`/${usuario?.tipo || 'aluno'}/perfil`" /></ion-buttons>
        <ion-title><span class="toolbar-page-title">Sobre nós</span><span class="toolbar-brand-right">Task<span>Edu</span></span></ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="page-container about-page">
        <header class="page-heading">
          <div><p>CONHEÇA O TASKEDU</p><h1>Mais organização para aprender.</h1></div>
        </header>
        <section class="profile-card">
          <h2>Quem somos</h2>
          <p>O TaskEdu é um projeto acadêmico criado para aproximar alunos e professores e facilitar a organização da rotina escolar.</p>
          <h2>Nosso objetivo</h2>
          <p>Reunir atividades, trabalhos e provas em um só lugar, ajudando os alunos a acompanhar os prazos e os professores a compartilhar os compromissos de cada turma.</p>
          <h2>Como ajudamos</h2>
          <ul>
            <li>Publicação e organização de atividades por turma e matéria.</li>
            <li>Calendário para acompanhar as datas de entrega.</li>
            <li>Favoritos e acompanhamento das atividades concluídas.</li>
          </ul>
          <p class="about-signature">TaskEdu · Organização que acompanha seus estudos.</p>
        </section>
        <section class="team-section" aria-labelledby="team-title">
          <div class="section-title"><div><p class="section-kicker">QUEM FAZ ACONTECER</p><h2 id="team-title">Nossa equipe</h2></div></div>
          <div class="team-grid">
            <article class="profile-card team-member">
              <img :src="fotoEnrique" alt="Enrique Felez, responsável pelo frontend e pela organização do TaskEdu e do grupo" class="member-photo" loading="lazy" width="594" height="800" />
              <div class="member-details">
                <h3>Enrique Felez</h3>
                <span class="member-role">Frontend e organização</span>
                <p>Responsável pelo desenvolvimento do frontend e pela organização do aplicativo e do grupo.</p>
              </div>
            </article>
            <article class="profile-card team-member">
              <img :src="fotoKaua" alt="Kauã Buzzi, responsável pela documentação do TaskEdu" class="member-photo" loading="lazy" />
              <div class="member-details">
                <h3>Kauã Buzzi</h3>
                <span class="member-role">Documentação</span>
                <p>Responsável pela documentação do projeto TaskEdu.</p>
              </div>
            </article>
            <article class="profile-card team-member">
              <img :src="fotoLuiz" alt="Luiz Gustavo, responsável pelos wireframes e colaborador no banco de dados do TaskEdu" class="member-photo" loading="lazy" />
              <div class="member-details">
                <h3>Luiz Gustavo</h3>
                <span class="member-role">Wireframes e banco de dados</span>
                <p>Responsável pela criação dos wireframes e pelo apoio no desenvolvimento do banco de dados.</p>
              </div>
            </article>
            <article class="profile-card team-member">
              <img :src="fotoMiguel" alt="Miguel Soares, responsável pelo backend do TaskEdu" class="member-photo" loading="lazy" />
              <div class="member-details">
                <h3>Miguel Soares</h3>
                <span class="member-role">Backend</span>
                <p>Responsável pelo desenvolvimento do backend do TaskEdu.</p>
              </div>
            </article>
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getUsuarioAtual } from '../services/auth.service';
const usuario = getUsuarioAtual();
const fotoEnrique = `${import.meta.env.BASE_URL}equipe/Image.jpg`;
const fotoKaua = `${import.meta.env.BASE_URL}equipe/Kau%C3%A3.png`;
const fotoLuiz = `${import.meta.env.BASE_URL}equipe/Nuclear%20Evolution.png`;
const fotoMiguel = `${import.meta.env.BASE_URL}equipe/Miguel.jpg`;
</script>

<style scoped>
.about-page { max-width: 820px; }
.profile-card h2 { margin-top: 1.75rem; }
.profile-card h2:first-child { margin-top: 0; }
.profile-card p, .profile-card li { line-height: 1.7; }
.profile-card ul { padding-left: 1.25rem; }
.about-signature { margin-top: 2rem; color: var(--ion-color-primary); font-weight: 600; }
.team-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.team-member { padding: 0; overflow: hidden; }
.member-photo { display: block; width: 100%; height: auto; aspect-ratio: 4 / 5; object-fit: cover; object-position: center 35%; }
.member-details { padding: 24px; }
.member-details h3 { margin: 0 0 8px; color: var(--ink); font-size: 1.3rem; }
.member-role { color: var(--brand); font-weight: 700; font-size: .85rem; }
.member-details p { margin-bottom: 0; color: var(--muted); }
@media (max-width: 620px) { .team-grid { grid-template-columns: 1fr; } }
</style>
