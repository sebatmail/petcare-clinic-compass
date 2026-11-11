import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  CalendarDays,
  FileHeart,
  BellRing,
  CreditCard,
  Stethoscope,
  ShieldAlert,
  Database,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "General",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Clínica Veterinaria",
    items: [
      { title: "Tutores / Dueños", url: "/tutores", icon: Users },
      { title: "Mascotas / Pacientes", url: "/mascotas", icon: PawPrint },
      { title: "Agenda Médica", url: "/agenda", icon: CalendarDays },
      { title: "Profesionales", url: "/profesionales", icon: Stethoscope },
      { title: "Fichas Clínicas", url: "/fichas", icon: FileHeart },
    ],
  },
  {
    label: "Operación & Cobros",
    items: [
      { title: "Recordatorios Vacunas", url: "/recordatorios", icon: BellRing },
      { title: "Pasarelas de Pago", url: "/pagos", icon: CreditCard },
    ],
  },
  {
    label: "Backend & Evaluación",
    items: [
      { title: "Django Admin (Profe)", url: "/admin/", icon: ShieldAlert, external: true },
      { title: "API RESTful (DRF)", url: "/api/mascotas/", icon: Database, external: true },
      {
        title: "Evidencia IA (4+1)",
        url: "https://github.com/sebatmail/petcare-clinic-compass/blob/main/prompts_ia.md",
        icon: Sparkles,
        external: true,
      },
    ],
  },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <PawPrint className="size-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-display text-lg font-semibold leading-none text-sidebar-accent-foreground">
              PetCare
            </p>
            <p className="text-xs text-sidebar-foreground/70">Gestión clínica INACAP</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((i) => (
                  <SidebarMenuItem key={i.url}>
                    {"external" in i && i.external ? (
                      <SidebarMenuButton asChild tooltip={i.title}>
                        <a href={i.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <i.icon className="size-4 text-primary" />
                            <span>{i.title}</span>
                          </span>
                          <ExternalLink className="size-3 text-muted-foreground ml-auto opacity-70" />
                        </a>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                        <Link to={i.url}>
                          <i.icon />
                          <span>{i.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 text-[11px] text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden space-y-1">
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">● PostgreSQL 18 Activo</p>
          <p className="text-muted-foreground">AWS EC2 44.193.33.51</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
