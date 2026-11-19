# Dashboard: regras validadas

> Cards (atalhos) do Dashboard, guardados no banco (T-0007).

| ID | Regra | Por quê | Protegida por |
|---|---|---|---|
| DASH-R01 | O Dashboard lista só os cards da usuária da sessão, do mais antigo para o mais novo | Isolamento (R1) e ordem estável | `tests/integration/dashboard-module.repository.test.ts › lista só os cards da dona…` |
| DASH-R02 | Card: identificador 2–40 (minúsculas, números, hífen), título 2–60, descrição 2–160, link `/…` ou `https://` (recusa `//host`, `http:`, `javascript:`, espaços), ícone da lista, status padrão "Disponível" só na criação | Contrato da entrada (R6/R7) | `tests/unit/modules/dashboard/dashboard-module.schema.test.ts` |
| DASH-R03 | Identificador único por dona → 409 "Já existe um card com este identificador."; donas diferentes podem repetir | Sem duplicados confusos | `dashboard-module.service.test.ts`, `dashboard-module.repository.test.ts` |
| DASH-R04 | Card de outra usuária → 404 (ler, alterar, excluir; tela e API) | Isolamento sem revelar existência | `tests/e2e/isolation.spec.ts › Dashboard: …` |
| DASH-R05 | Cadastrar/editar pelo modal: salvou → modal fecha e o card aparece; erro → mensagens por campo e o texto digitado continua | Fluxo sem recarregar | `tests/unit/modules/dashboard/ModuleFormDialog.test.tsx`, `tests/e2e/dashboard.spec.ts` |
| DASH-R06 | Excluir pede confirmação ("Excluir card?") | Ação irreversível | `DeleteModuleButton.test.tsx`, `dashboard.spec.ts › edita o título e exclui…` |
| DASH-R07 | Status mostrado em português: AVAILABLE "Disponível", EXTERNAL "Aplicação externa", SOON "Em breve" (`dashboardModuleStatusLabel`) | Banco/API em inglês; tela em português | `ModuleCard.test.tsx` |
| DASH-R08 | Link `https://` abre em nova aba (`noopener noreferrer`) com aviso ao leitor de tela; link interno navega no portal | Segurança e WCAG | `ModuleCard.test.tsx` |
| DASH-R09 | Toda conta tem os 3 cards iniciais: as antigas pela migration `add_dashboard_modules`, as novas pelo seed | Dashboard nunca vazio após o deploy | `dashboard-module.schema.test.ts › defaultDashboardModules`, `dashboard.spec.ts › mostra os 3 cards iniciais…` |
| DASH-R10 | Modal sem violações do axe, nos dois temas | WCAG AA | `tests/e2e/accessibility.spec.ts › modal "Novo card"…` |
