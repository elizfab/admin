/**
 * Validação das variáveis de ambiente obrigatórias para um build de produção.
 * Sem ela, um deploy sem BETTER_AUTH_SECRET terminaria "com sucesso" e o
 * login só quebraria quando alguém tentasse entrar (validado).
 */

type Env = Record<string, string | undefined>;

export function findEnvProblems(env: Env): string[] {
  const problems: string[] = [];

  if (!env.DATABASE_URL) {
    problems.push("DATABASE_URL não definida.");
  }

  if (!env.BETTER_AUTH_SECRET) {
    problems.push("BETTER_AUTH_SECRET não definida.");
  } else if (env.BETTER_AUTH_SECRET.length < 32) {
    problems.push("BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  }

  if (!env.BETTER_AUTH_URL && !env.BETTER_AUTH_ALLOWED_HOSTS) {
    problems.push("Defina BETTER_AUTH_URL (URL fixa) ou BETTER_AUTH_ALLOWED_HOSTS (previews).");
  }

  return problems;
}

export function assertProductionEnv(env: Env) {
  const problems = findEnvProblems(env);

  if (problems.length > 0) {
    throw new Error(
      `Build interrompido — variáveis de ambiente inválidas:\n- ${problems.join("\n- ")}`,
    );
  }
}
