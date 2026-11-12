import { redirect } from "next/navigation";

// Fase de frontend: sempre envia para o dashboard.
// Na fase de autenticação, este redirecionamento passará a depender da sessão.
export default function HomePage() {
  redirect("/dashboard");
}
