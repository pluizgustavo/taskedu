<template><div class="skeleton-grid"><div v-for="item in 4" :key="item" class="skeleton-card"><ion-skeleton-text animated class="sk-title"/><ion-skeleton-text animated/><ion-skeleton-text animated/><ion-skeleton-text animated class="sk-short"/></div></div></template>
<script setup lang="ts">import { IonSkeletonText } from '@ionic/vue';</script>
