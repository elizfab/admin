import "server-only";

// API pública do módulo Projetos — SOMENTE servidor (acessa o banco).
// Importar este arquivo num Client Component gera erro de build.
export * from "./services/project.service";
