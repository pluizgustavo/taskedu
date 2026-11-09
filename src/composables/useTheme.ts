import { ref } from 'vue';

const escuro = ref(false);
const chave = 'taskedu-tema';

function aplicar() {
  document.documentElement.classList.toggle('tema-escuro', escuro.value);
  document.documentElement.style.colorScheme = escuro.value ? 'dark' : 'light';
}

export function iniciarTema() {
  let salvo: string | null = null;
  try { salvo = localStorage.getItem(chave); } catch { /* Usa a preferência do sistema. */ }
  escuro.value = salvo ? salvo === 'escuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  aplicar();
}

export function useTheme() {
  function alternarTema() {
    escuro.value = !escuro.value;
    aplicar();
    try { localStorage.setItem(chave, escuro.value ? 'escuro' : 'claro'); } catch { /* Mantém o tema nesta sessão. */ }
  }
  return { escuro, alternarTema };
}
