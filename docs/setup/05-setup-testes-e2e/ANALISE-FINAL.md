Análise do PR #2 — Passo 05/03 e próximos passos
14 de nov. de 2026 · @Liza
Veredito
A correção do commit 31e4992 está certa e resolve a lacuna; testada a partir de um banco inexistente, o banco foi criado, o servidor subiu e os testes passaram.
O erro estava no guia: no passo 05/03 o Playwright sobe o webServer antes de rodar o globalSetup. O servidor esperava o health check dar 200, mas recebia 503 porque o admin_test não existia, e o globalSetup, que criaria o banco, nunca chegava a rodar.
Analogia: o porteiro (webServer) só abre o prédio quando a sala de reunião está pronta, mas quem monta a sala (globalSetup) só chega depois que o prédio abre. A correção colocou a montagem da sala antes do porteiro, com o prepare-database.ts no comando do webServer.
Por que o desenho é bom:
• Uma só lógica: createDatabaseIfMissing fica num arquivo compartilhado, usado pelo script e pelo globalSetup.
• Pode rodar várias vezes: se o banco já existe, o script não faz nada.
• Protege o banco errado: assertTestDatabase roda antes de qualquer criação.
• Funciona no CI: lá o Postgres já cria o admin_test via POSTGRES_DB, então o script só confirma que ele existe.
O que documentar no passo 05/03
Cinco ajustes deixam o guia fiel ao código que funciona.

1.  Por que o banco é criado no webServer: explicar a ordem do Playwright (primeiro o webServer, depois o globalSetup) e mostrar o deadlock no formato sintoma → causa → correção.
2.  Os dois arquivos novos: test-database.ts e prepare-database.ts, e o global-setup.ts importando a função compartilhada.
3.  Passo 02: atualizar o bloco do playwright.config.ts com o novo command.
4.  README.md da Fase 05: trocar "o banco é criado automaticamente" por "criado pelo prepare-database.ts antes do servidor subir".
5.  Problemas comuns: acrescentar "timeout no webServer com health 503 → banco de teste inexistente".
    O que falta nos passos 04 a 10 da Fase 05
    Rodando os specs dos guias contra o código do repositório, 16 de 20 testes passaram; as 4 falhas e duas lacunas abaixo mostram onde os guias precisam se adaptar.
    Item
    Situação no repositório
    O que mudar
    Navegação
    Guia espera 4 cards e 5 links; o projeto tem 2 cards (/documentation, /finance) e 3 links
    Adaptar o navigation.spec à navegação real e incluir /documentation
    Contraste (tema claro)
    Item ativo da sidebar: #644ac9 sobre #cfcfde = 4.05:1 (mínimo WCAG AA: 4.5:1)
    Novo token, ex. --accent-on-selection, nos dois temas; #5a43b5 dá 4.69:1, #553fab dá 5.08:1
    Tema escuro
    O axe testa só o tema claro
    Rodar o axe também no escuro (colorScheme: 'dark' ou valor do ThemeToggle)
    Script typecheck
    tsc --noEmit falha num clone novo: 3 erros (LayoutProps, PageProps, RouteContext)
    Usar next typegen && tsc --noEmit
    Projetos
    /projects fora da navigation.ts e do matcher do proxy.ts
    Decidir se entra no menu; em todo caso, acrescentar "/projects/:path\*" ao matcher
    Aviso do Prisma
    CLI sugere npm i prisma@latest (versão 8, RC)
    Nota no guia: ignorar, a versão fica fixada em @7
    Scripts do package.json
    Faltam test:integration, engines e vercel-build
    Acrescentar; sem vercel-build o deploy não roda as migrations
    Por que o typecheck quebra: LayoutProps, PageProps e RouteContext são gerados pelo Next a partir das rotas. Sem a pasta .next, o TypeScript procura tipos que ainda não existem.
    Por que o proxy importa: a rota /projects continua segura, porque o layout privado verifica a sessão. Mas o proxy é a primeira barreira; sem ele, a página começa a renderizar antes de redirecionar.
    Impacto na Fase 06 e próximos passos
    Os guias de CI continuam compatíveis com a correção, mas dependem de três pontos.
    • O CI depende do typecheck corrigido (next typegen && tsc --noEmit).
    • A CSP com nonce precisa liberar o script inline do tema no layout.tsx; senão o tema pisca ou não aplica.
    • No repositório as docs estão na v4 e a arquitetura na revisão 1.3; a Fase 06 e a revisão 1.5 estão no pacote admin-docs-v5, ainda não copiado.
    Nada foi commitado nem enviado ao repositório; os arquivos temporários do teste foram apagados do clone.
    [ ] Documentar a correção no passo 05/03
    [ ] Corrigir o contraste com token nos dois temas
    [ ] Atualizar o script typecheck
    [ ] Acrescentar /projects ao matcher do proxy
    [ ] Copiar o pacote admin-docs-v5 para o repositório
    [ ] Gerar a v6 da documentação com estas correções
