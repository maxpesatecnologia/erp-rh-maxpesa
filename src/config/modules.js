// Mapa central de módulos do Maxpesa | ERP RH.
// Cada módulo define quais perfis (roles) podem acessá-lo.
// Perfis: admin | rh | gestor | colaborador
import {
  LayoutDashboard,
  Users,
  IdCard,
  Target,
  FileText,
  GraduationCap,
  TrendingUp,
  UserMinus,
  FolderOpen,
  Truck,
  ShieldCheck,
  Stethoscope,
  HardHat,
  Users2,
  Megaphone,
  Bot,
  Palmtree,
  ClipboardList,
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
      {
        path: "/portal",
        label: "Acesso Rápido",
        icon: IdCard,
        roles: ["admin", "rh", "gestor", "colaborador"],
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
        path: "/recrutamento",
        label: "Recrutamento & Seleção",
        icon: Target,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/admissao",
        label: "Admissão Digital",
        icon: FileText,
        roles: ["admin", "rh"],
      },
      {
        path: "/documentos",
        label: "Documentos",
        icon: FolderOpen,
        roles: ["admin", "rh"],
      },
      {
        path: "/desligamento",
        label: "Desligamento Digital",
        icon: UserMinus,
        roles: ["admin", "rh"],
      },
      {
        path: "/ferias",
        label: "Gestão de Férias",
        icon: Palmtree,
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
      {
        path: "/operadores",
        label: "Competências",
        icon: Truck,
        roles: ["admin", "rh", "gestor"],
      },
    ],
  },
  {
    title: "Operação Maxpesa",
    items: [
      {
        path: "/seguranca",
        label: "Segurança do Trabalho",
        icon: ShieldCheck,
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/medicina",
        label: "Gestão de ASOs",
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
  {
    title: "Administração",
    items: [
      {
        path: "/auditoria",
        label: "Logs de Auditoria",
        icon: ClipboardList,
        roles: ["admin"],
        // Diferente dos demais módulos (que aparecem cinza/cadeado pra quem não
        // tem permissão), este some do menu por completo pra quem não é admin —
        // decisão deliberada por ser uma tela sensível (ver README).
        hiddenIfNoAccess: true,
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
