# Passo 02 — Projeto no Supabase

> **Fase:** 02 — Banco e Prisma\
> **Tempo estimado:** 20 min\
> **Depende de:** [Passo 01](01-postgres-local-docker.md)

## Objetivo

Criar o projeto no Supabase **com a Data API desativada**, e guardar com
segurança a senha e as strings de conexão que serão usadas no deploy
(Fase 06).

## 💡 Por que criar agora, se o dia a dia é local

Criar agora permite descobrir problemas cedo (região, rede IPv6, senha com
caracteres especiais) com calma, e não no dia do deploy. O projeto fica
pronto, esperando.

### ⚠️ Por que desativar a Data API (o ponto mais importante deste passo)

O Supabase gera **automaticamente** uma API REST/GraphQL para as tabelas do
schema `public`, que é exatamente onde o Prisma cria as tabelas. A
documentação do Supabase avisa que qualquer tabela do `public` **sem RLS**
pode ficar acessível publicamente pela chave `anon`.

Nas próximas fases, o `public` terá as tabelas `account` (hash de senha) e
`session` (tokens de sessão). 💡 Deixar a Data API ligada seria como instalar
uma portaria caprichada (Better Auth) e deixar **uma janela aberta nos fundos**.

Este projeto **não usa** o `supabase-js` nem a API REST do Supabase: todo
acesso passa pelo servidor Next.js via Prisma. A recomendação oficial para
esse caso é **desativar a Data API**.

## Pré-requisitos

- Conta no Supabase (<https://supabase.com/dashboard>).
- Um gerenciador de senhas para guardar a senha do banco.

## Passo a passo

### 1. Criar o projeto

1. Acesse <https://supabase.com/dashboard> e clique em **New project**.
2. Preencha:
   - **Name:** `painel-admin`
   - **Database password:** clique em **Generate a password** e **salve no gerenciador de senhas** antes de continuar
   - **Region:** a mais próxima de você e da Vercel (ex.: South America — São Paulo, se disponível)
3. Se aparecer, nas opções de segurança da criação, a opção de **habilitar a
   Data API** ou de **expor automaticamente as tabelas do `public`**, deixe-a
   **desmarcada**.
4. Clique em **Create new project** e aguarde a criação.

💡 Para a senha, prefira letras e números. Caracteres como `@ # ? & /` têm
significado especial em URLs e precisariam ser codificados (`@` vira `%40`).

### 2. Desativar a Data API (se não foi feito na criação)

1. No projeto, abra **Project Settings → Data API** (em algumas versões do
   painel: **Integrations → Data API**).
2. Desligue **Enable Data API** e salve.

### 3. Copiar as strings de conexão

1. Clique em **Connect**, no topo do painel do projeto.
2. Copie as strings abaixo e guarde-as no gerenciador de senhas, junto com a
   senha do banco:

| Uso                                  | Tipo no painel         | Porta | Formato (ilustrativo)                                                               |
| ------------------------------------ | ---------------------- | ----- | ----------------------------------------------------------------------------------- |
| Aplicação na Vercel (`DATABASE_URL`) | **Transaction pooler** | 6543  | `postgresql://postgres.[REF]:[SENHA]@[HOST-DO-POOLER]:6543/postgres?pgbouncer=true` |
| Migrations (`DIRECT_URL`)            | **Direct connection**  | 5432  | `postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres`                  |
| Alternativa a migrations sem IPv6    | **Session pooler**     | 5432  | `postgresql://postgres.[REF]:[SENHA]@[HOST-DO-POOLER]:5432/postgres`                |

⚠️ **Copie do painel; não monte à mão.** O host do pooler não pode ser
deduzido pela região. Note também que o **usuário muda**: `postgres` na
conexão direta e `postgres.[REF]` no pooler.

| Detalhe                             | 💡 Por quê                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transaction pooler para a aplicação | Na Vercel, cada requisição pode abrir uma conexão nova. O pooler é uma **fila de caixas compartilhados**: muitas requisições usam poucas conexões reais |
| `?pgbouncer=true`                   | Recomendação do Supabase para Prisma no modo _transaction_. Validado: não atrapalha o driver `pg`                                                       |
| Conexão direta para migrations      | Migration é uma sessão única e longa; o pooler em modo _transaction_ não é adequado                                                                     |
| Conexão direta usa **IPv6**         | Se a sua rede não tiver IPv6, use o **Session pooler** como `DIRECT_URL`                                                                                |

### 4. (Opcional) Testar a conexão agora

Se tiver o `psql` instalado:

```bash
psql "COLE-AQUI-A-STRING-DO-SESSION-POOLER"
```

Esperado: o prompt `postgres=>`. Saia com `\q`.

⚠️ **Não** coloque as strings do Supabase no `.env.local` agora. O
desenvolvimento usa o banco local. As strings do Supabase serão configuradas
como variáveis da Vercel na Fase 06.

## Limites do plano Free (ARCHITECTURE.md, seção 12.4)

- Projetos podem ser **pausados** após um período sem atividade.
- Armazenamento e transferência têm limites; backup automático é limitado.
- Confira os valores atuais em <https://supabase.com/pricing> antes de
  colocar dados importantes.

## Arquivos criados ou alterados

Nenhum. As credenciais ficam **somente** no gerenciador de senhas.

## ✅ Como testar

| #   | Teste                 | Resultado esperado                                                                |
| --- | --------------------- | --------------------------------------------------------------------------------- |
| 1   | Painel → Data API     | “Enable Data API” **desligado**                                                   |
| 2   | Gerenciador de senhas | Senha do banco + strings _Transaction pooler_, _Direct_ e _Session pooler_ salvas |
| 3   | `git status`          | Nenhum arquivo novo (nada do Supabase foi para o projeto)                         |

**Critério de aceite:** os três testes passam.

## ⚠️ Problemas comuns

| Sintoma                                              | Causa provável                                                | Solução                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `password authentication failed`                     | Senha com caractere especial sem codificar, ou usuário errado | Codificar a senha (`@` → `%40`); conferir `postgres` × `postgres.[REF]` |
| `Network is unreachable` / timeout na conexão direta | Rede sem IPv6                                                 | Usar o Session pooler                                                   |
| Projeto “Paused”                                     | Inatividade no plano Free                                     | Restaurar pelo painel                                                   |

## Referências

- [Supabase — Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase — Hardening the Data API](https://supabase.com/docs/guides/api/hardening-data-api)
- [Supabase — Pricing](https://supabase.com/pricing)
- ARCHITECTURE.md, seção 12

---

← [Passo anterior](01-postgres-local-docker.md) · [Índice da fase](README.md) · [Próximo passo](03-modelagem-e-erd.md) →
