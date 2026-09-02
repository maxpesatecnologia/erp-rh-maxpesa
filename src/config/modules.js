// Mapa central de módulos do Maxpesa | ERP RH.
// Cada módulo define quais perfis (roles) podem acessá-lo.
// Perfis: admin | rh | gestor | colaborador
import {
  LayoutDashboard,
  Users,
  IdCard,
  Target,
  FolderOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  UserMinus,
  Truck,
  ShieldCheck,
  Stethoscope,
  HardHat,
  Users2,
  Megaphone,
  Bot,
} from "lucide-react";

export const ROLE_LABELS = {
  admin: "Administrador",
  rh: "RH",
  gestor: "Gestor",
  colaborador: "Colaborador",
};

export const NAV_SECTIONS = [
  {
    title: "Gestão Estratégica",
    items: [
      {
        path: "/",
        label: "Dashboard Executivo",
        icon: LayoutDashboard,
        roles: ["admin", "rh", "gestor"],
      },
    ],
  },
  {
    title: "Pessoas",
    items: [
      {
        path: "/colaboradores",
        label: "Cadastro de Colaboradores",
        icon: Users,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/portal",
        label: "Portal do Colaborador",
        icon: IdCard,
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
      {
        path: "/recrutamento",
        label: "Recrutamento & Seleção",
        icon: Target,
        roles: ["admin", "rh"],
      },
      {
        path: "/recrutamento/banco-curriculos",
        label: "Banco de Currículos",
        icon: FolderOpen,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/admissao",
        label: "Admissão Digital",
        icon: FileText,
        roles: ["admin", "rh"],
      },
      {
        path: "/desligamento",
        label: "Desligamento Digital",
        icon: UserMinus,
        roles: ["admin", "rh"],
      },
      {
        path: "/treinamentos",
        label: "Treinamentos",
        icon: GraduationCap,
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
      {
        path: "/avaliacao-desempenho",
        label: "Avaliação de Desempenho",
        icon: TrendingUp,
        roles: ["admin", "rh", "gestor"],
      },
    ],
  },
  {
    title: "Operação Maxpesa",
    items: [
      {
        path: "/operadores",
        label: "Operadores de Equipamentos",
        icon: Truck,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/seguranca",
        label: "Segurança do Trabalho",
        icon: ShieldCheck,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/medicina",
        label: "Medicina Ocupacional",
        icon: Stethoscope,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/epis",
        label: "Gestão de EPIs",
        icon: HardHat,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/equipes",
        label: "Gestão de Equipes",
        icon: Users2,
        roles: ["admin", "rh", "gestor"],
      },
    ],
  },
  {
    title: "Comunicação & IA",
    items: [
      {
        path: "/comunicacao",
        label: "Comunicação Interna",
        icon: Megaphone,
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
      {
        path: "/ia",
        label: "IA Corporativa",
        icon: Bot,
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
    ],
  },
];

// Lista plana de todos os módulos, útil para checagem de rota/permissão.
export const ALL_MODULES = NAV_SECTIONS.flatMap((section) => section.items);

export function canAccess(path, role) {
  const module = ALL_MODULES.find((m) => m.path === path);
  if (!module) return true; // rota sem módulo mapeado (ex: not-found)
  return module.roles.includes(role);
}
