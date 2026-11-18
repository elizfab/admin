import "server-only";

// API pública do módulo Financeiro — SOMENTE servidor (acessa o banco).
// Importar este arquivo num Client Component gera erro de build.
export * from "./services/transaction.service";
