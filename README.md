# TaskEdu

Agenda acadêmica com Ionic 8, Vue 3, TypeScript, Capacitor e Supabase.

O administrador cadastra alunos/professores e atribui turmas. Professores publicam atividades para suas turmas; alunos acessam apenas a turma atribuída. O primeiro acesso exige confirmação de e-mail e troca da senha temporária.

## Configuração

1. Configure `.env.local` conforme `.env.example`, usando somente a URL e a chave **publicável** do Supabase.
2. Execute o SQL de tabelas/permissões e configure o administrador, URLs e SMTP seguindo [o guia completo](docs/migracao-supabase.md).
3. Publique a Edge Function `admin-usuarios` conforme o guia.
4. Execute `npm install` e `npm run dev`.

As tabelas, permissões e configurações do projeto estão documentadas no guia. Chaves secretas e `service_role` devem ficar apenas no servidor.

## Validação

```powershell
npm run build
npm run test:auth
npm run test:supabase
```

Para Android: `npm run build` e `npx cap sync android`.

O site usa os serviços de `src/services/` conectados ao Supabase. As funções de servidor ficam em `supabase/functions/`. Nunca coloque chaves secretas ou `service_role` em variáveis `VITE_`.

Arquivos antigos retirados do projeto ativo estão arquivados localmente em `.tmp/legado-removido`, ignorada pelo Git. A subpasta `PI/` contém um repositório Git independente e não participa da execução deste aplicativo.
