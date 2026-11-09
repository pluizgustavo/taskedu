# Migração do TaskEdu para Supabase

O visual, os componentes e a navegação foram mantidos. Login, banco e administração agora usam Supabase. A integração está configurada localmente em `.env.local` com a URL e a chave **publicável** fornecidas. Não existe chave secreta no frontend. O Firebase não foi apagado nem alterado remotamente.

Projeto Supabase: `pawtuylsumdxoojjkwsj`.

## 1. Criar as tabelas e permissões

No painel Supabase, abra **SQL Editor > New query**. No computador, abra:

```powershell
notepad C:\Users\enrique.souza\PI\supabase\migrations\202611040001_taskedu.sql
```

Copie **todo o arquivo**, cole na consulta e clique em **Run**. Execute uma vez, em um banco novo. Se apresentar erro, não substitua o script por permissões abertas: confira a mensagem.

O script cria `usuarios`, `turmas`, `atividades` e `progressos`; habilita RLS; concede explicitamente as permissões da Data API; protege papéis, turmas e flags administrativas; e libera a troca inicial somente após o Auth alterar a senha. As turmas são `1 ano`, `2 ano` e `3 ano`.

## 2. Criar o administrador no Supabase

1. Abra **Authentication > Users > Add user > Create new user**.
2. Informe `enriquefelez32@gmail.com` e uma senha pessoal forte. Não envie a senha pelo chat.
3. Selecione a confirmação automática **somente para sua própria conta administrativa**, desde que você controle essa caixa de e-mail. Para os alunos e professores, o sistema mantém confirmação por e-mail.
4. Volte ao **SQL Editor > New query**, copie e execute este arquivo:

```powershell
notepad C:\Users\enrique.souza\PI\supabase\bootstrap-admin.sql
```

O script localiza a conta pelo e-mail e usa o **novo UID do Supabase**, sem reutilizar o UID do Firebase. Ele cria o perfil protegido do administrador.

Depois, entre no app com a conta administrativa e crie as outras contas pelo painel **Usuários**:

- Professor: `luca.professor001@gmail.com`.
- Alunos: `joao.aluno001@gmail.com` e `renat.adm001@gmail.com`.
- Defina a turma de cada aluno e as turmas do professor no painel. Cadastre nomes e senhas temporárias diretamente no app; não envie senhas pelo chat.

## 3. Configurar URLs de confirmação e recuperação

Em **Authentication > URL Configuration**:

- **Site URL:** use o endereço em que o site está rodando, por exemplo `http://localhost:5173`.
- **Redirect URLs:** adicione `http://localhost:5173/auth/retorno` e `http://localhost:5173/auth/retorno?recuperacao=1`.
- Se estiver usando a porta `8100`, adicione também `http://localhost:8100/auth/retorno` e `http://localhost:8100/auth/retorno?recuperacao=1`.
- Ao publicar o site, adicione os equivalentes no domínio HTTPS real e atualize a Site URL.

Mantenha os links padrão dos modelos de e-mail (`{{ .ConfirmationURL }}`); o cliente usa o fluxo implicit com detecção de sessão no retorno. Tokens não são gravados em logs.

Em **Authentication > Sign In / Providers > Email**, mantenha a confirmação de e-mail habilitada, configure a política de senha com pelo menos oito caracteres, letras e números e **desabilite novos cadastros públicos** (Allow new users to sign up). O Admin SDK da Edge Function cria as contas, sem cadastro público.

## 4. Configurar envio de e-mail (SMTP)

O envio padrão do Supabase só entrega mensagens aos membros da organização do projeto. Para confirmar e-mails e recuperar senhas de alunos/professores, configure um provedor SMTP em **Authentication > Email > SMTP Settings** (a posição pode variar no painel).

Use os dados fornecidos pelo seu provedor: host, porta, usuário, senha SMTP e remetente autorizado. Não use a senha do Gmail ou a senha do banco no lugar dessas credenciais. Não envie credenciais SMTP pelo chat nem as coloque em variáveis `VITE_`.

O provedor pode exigir domínio verificado e ter seus próprios limites/custos. Até configurar SMTP, o recebimento de e-mails de usuários fora da equipe não está pronto para validação. Não desabilite a confirmação para contornar essa etapa.

## 5. Publicar a administração (Edge Function)

No PowerShell, dentro de `C:\Users\enrique.souza\PI`, execute um comando por vez:

```powershell
npx supabase login
npx supabase link --project-ref pawtuylsumdxoojjkwsj
npx supabase functions deploy admin-usuarios --project-ref pawtuylsumdxoojjkwsj
```

Use a conta que possui acesso ao projeto Supabase. O CLI pode solicitar sua senha do banco para vincular o projeto: digite no próprio terminal, sem compartilhar.

O arquivo `supabase/config.toml` desativa a verificação JWT antiga do gateway para essa função. O handler **valida explicitamente o JWT com `auth.getUser(token)`** e verifica o perfil administrativo protegido, e-mail confirmado e conta ativa antes de qualquer operação. A chave de servidor é a variável integrada `SUPABASE_SERVICE_ROLE_KEY`, disponível somente no ambiente das Edge Functions; nunca use essa chave no navegador.

Por padrão, a função aceita as origens locais `http://localhost:5173`, `http://localhost:8100` e as equivalentes em `127.0.0.1`. Para um site publicado, configure `ALLOWED_ORIGINS` nos secrets da função, com as origens permitidas separadas por vírgula, incluindo protocolo e porta quando houver. Não coloque caminhos de página nessa lista.

## 6. Iniciar e testar o site

Pare o servidor antigo com Ctrl+C no terminal em que ele roda e execute:

```powershell
npm run dev
```

Abra o endereço informado pelo terminal e atualize com Ctrl+Shift+R. Entre com o administrador **criado no Supabase**, usando a senha desse cadastro.

No painel:

1. Crie um professor, atribua uma ou mais turmas e defina a senha temporária.
2. Crie um aluno com uma única turma correspondente.
3. Use janelas anônimas separadas para testar os logins.
4. Confirme o e-mail de cada titular. No primeiro acesso, escolha uma nova senha e entre novamente.
5. Como professor, publique uma atividade para uma turma atribuída.
6. Como aluno dessa turma, confira Atividades e Calendário; outro aluno de outra turma não deve vê-la.
7. Teste Esqueci minha senha: o link volta para a tela existente de Alterar senha.

O administrador pode excluir alunos e professores pelo painel, com confirmacao. Contas com atividades publicadas precisam remover essas atividades antes da exclusao. O login, o perfil e os progressos pessoais sao removidos; a conta do administrador fica protegida.

## Validação local

`npm run build`, `npm run test:auth`, `npm run test:supabase` e `npx deno check supabase/functions/admin-usuarios/index.ts`.

Os testes de SQL usam PostgreSQL em memória (PGlite) com papéis, RLS e um esquema Auth simulado. Eles não substituem o teste dos e-mails e da Edge Function publicada. Nenhuma tabela, conta ou função foi publicada remotamente por esta implementação.

Os componentes antigos foram retirados do aplicativo ativo e arquivados em `.tmp/legado-removido`. Nenhum projeto remoto foi excluido.

Referências: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Admin Auth](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Recuperação de senha](https://supabase.com/docs/guides/auth/passwords), [Autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth).
