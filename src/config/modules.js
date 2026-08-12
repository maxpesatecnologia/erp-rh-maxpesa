// Mapa central de módulos do Maxpesa | ERP RH.
// Cada módulo define quais perfis (roles) podem acessá-lo.
// Perfis: admin | rh | gestor | colaborador

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
        icon: "📊",
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
        icon: "🧑‍💼",
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/portal",
        label: "Portal do Colaborador",
        icon: "🪪",
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
      {
        path: "/recrutamento",
        label: "Recrutamento & Seleção",
        icon: "🎯",
        roles: ["admin", "rh"],
      },
      {
        path: "/admissao",
        label: "Admissão Digital",
        icon: "📝",
        roles: ["admin", "rh"],
      },
      {
        path: "/treinamentos",
        label: "Treinamentos",
        icon: "🎓",
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
    ],
  },
  {
    title: "Operação Maxpesa",
    items: [
      {
        path: "/operadores",
        label: "Operadores de Equipamentos",
        icon: "🏗️",
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/seguranca",
        label: "Segurança do Trabalho",
        icon: "🦺",
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/medicina",
        label: "Medicina Ocupacional",
        icon: "🩺",
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/epis",
        label: "Gestão de EPIs",
        icon: "🧰",
        roles: ["admin", "rh", "gestor"],
      },
      {
        path: "/equipes",
        label: "Gestão de Equipes",
        icon: "👷",
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
        icon: "📣",
        roles: ["admin", "rh", "gestor", "colaborador"],
      },
      {
        path: "/ia",
        label: "IA Corporativa",
        icon: "🤖",
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
