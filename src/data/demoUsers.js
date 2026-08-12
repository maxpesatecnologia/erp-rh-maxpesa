// Usuários de demonstração — usados SOMENTE quando o projeto ainda não tem
// um Supabase configurado (.env vazio). Servem para você navegar pelo
// sistema e testar o controle de acesso por perfil antes de ligar o backend
// real. Remova este arquivo (e o "modo demo" no AuthContext) quando o
// Supabase estiver em produção.

export const DEMO_USERS = [
  {
    email: "admin@maxpesa.com.br",
    password: "demo123",
    nome: "Admin Maxpesa",
    role: "admin",
    filial: "Matriz",
  },
  {
    email: "rh@maxpesa.com.br",
    password: "demo123",
    nome: "Ana Ribeiro",
    role: "rh",
    filial: "Matriz",
  },
  {
    email: "gestor@maxpesa.com.br",
    password: "demo123",
    nome: "Carlos Menezes",
    role: "gestor",
    filial: "Matriz",
  },
  {
    email: "colaborador@maxpesa.com.br",
    password: "demo123",
    nome: "João Pereira",
    role: "colaborador",
    filial: "Matriz",
  },
];
