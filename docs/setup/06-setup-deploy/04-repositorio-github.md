# Passo 04 — Repositório no GitHub

> **Fase:** 06 — Deploy\
> **Tempo estimado:** 30 min\
> **Depende de:** [Passo 03](03-preparar-para-vercel.md)

## Objetivo

Publicar o repositório local (com **todo** o histórico desde a Fase 00) como
repositório **privado** na organização `elizfab`, depois de conferir que
nenhum segredo foi versionado.

## 💡 Por que conferir segredos antes do primeiro push

Depois que um segredo chega ao GitHub, **apagar o arquivo não resolve**: ele
continua no histórico, e a única saída segura é trocar o segredo. 💡 Antes
de enviar a mudança, confere-se se nenhuma chave ficou dentro da caixa.

## Pré-requisitos

- Passo 03 concluído; `git status` limpo.
- Acesso de criação de repositórios na organização `elizfab`.

## Passo a passo

### 1. Auditoria de segredos no histórico

```bash
# 1) Algum arquivo .env (exceto o .env.example) já foi commitado?
git log --all --name-only --format="" | grep -E '(^|/)\.env' | grep -v '\.env\.example$' | sort -u

# 2) Algum valor sensível aparece no histórico do código? (docs/ fica de fora)
git log --all -p -- . ':(exclude)docs' | grep -nE 'BETTER_AUTH_SECRET="[^"]+"|SEED_ADMIN_PASSWORD="[^"]+"|supabase\.co|pooler\.supabase\.com' | head
```

Esperado: **nenhuma saída** nos dois comandos (validado num repositório com
a mesma estrutura).

> **Por que excluir `docs/`:** os guias contêm **exemplos** desses padrões
> (como `BETTER_AUTH_SECRET="COLE-AQUI-O-VALOR-GERADO"` e
> `db.[REF].supabase.co`). Sem a exclusão, o comando acusa uns 17 falsos
> positivos. O `.env.example` tem `BETTER_AUTH_SECRET=""` (vazio), que não
> casa com o padrão.

⚠️ Se aparecer algo: **não faça o push**. Troque o segredo exposto (gere
outro) e peça ajuda para limpar o histórico antes de publicar.

### 2. Criar o repositório (escolha uma opção)

**Opção A: pelo site**

1. <https://github.com/organizations/elizfab/repositories/new>
2. **Repository name:** `admin`
3. **Private**
4. **Não** marque README, `.gitignore` nem licença: o repositório precisa
   nascer **vazio**, para receber o seu histórico.
5. **Create repository**

Depois, no terminal:

```bash
git remote add origin https://github.com/elizfab/admin.git
git push -u origin main
git push --tags
```

**Opção B: pela GitHub CLI** (se tiver o `gh` instalado e autenticado)

```bash
gh repo create elizfab/admin --private --source=. --remote=origin --push
git push --tags
```

### 3. Conferir

Abra o repositório no navegador e confira:

- os commits desde `docs: adiciona mapa de implementação…` (Fase 00);
- as tags `fase-01-frontend` … `fase-05-testes`, se você as criou;
- a ausência de `.env.local`, `node_modules/`, `src/generated/`, `playwright/.auth/` e `backups/`.

### 4. Atualizar o mapa

No [`docs/README.md`](../../README.md), troque “criado ao final” pelo link do
repositório.

## Arquivos criados ou alterados

| Arquivo          | Ação     | Descrição           |
| ---------------- | -------- | ------------------- |
| `.git/config`    | Alterado | Remoto `origin`     |
| `docs/README.md` | Alterado | Link do repositório |

## ✅ Como testar

| #   | Teste                          | Resultado esperado                                                                                                   |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Auditoria do item 1            | Nenhuma saída                                                                                                        |
| 2   | `git remote -v`                | `origin https://github.com/elizfab/admin.git`                                                                        |
| 3   | `git status`                   | `Your branch is up to date with 'origin/main'`                                                                       |
| 4   | Aba **Actions** do repositório | O workflow **CI** começou a rodar (ele é configurado no passo 05; se o `ci.yml` ainda não existir, a aba fica vazia) |

**Critério de aceite:** os testes 1 a 3 passam.

## ⚠️ Problemas comuns

| Sintoma                                   | Causa provável                              | Solução                                                          |
| ----------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `remote: Repository not found`            | Sem permissão na organização ou nome errado | Conferir o acesso à `elizfab` e a URL                            |
| `! [rejected] main -> main (fetch first)` | O repositório foi criado **com** README     | Apague-o e recrie vazio, ou faça `git pull --rebase origin main` |
| Pede usuário e senha                      | O GitHub não aceita senha no HTTPS          | Usar `gh auth login`, um _Personal Access Token_ ou SSH          |

## Commit sugerido

```bash
git add docs/README.md
git commit -m "docs: adiciona link do repositório remoto"
git push
```

## Referências

- [GitHub — Adding a local repository](https://docs.github.com/pt/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub CLI — gh repo create](https://cli.github.com/manual/gh_repo_create)
- [GitHub — Removing sensitive data](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- ARCHITECTURE.md, seção 3.3

---

← [Passo anterior](03-preparar-para-vercel.md) · [Índice da fase](README.md) · [Próximo passo](05-ci-github-actions.md) →
