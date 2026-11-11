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
  ShieldCheck,
  Database,
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

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Clínica",
    items: [
      { title: "Tutores", url: "/tutores", icon: Users },
      { title: "Mascotas", url: "/mascotas", icon: PawPrint },
      { title: "Agenda", url: "/agenda", icon: CalendarDays },
      { title: "Profesionales", url: "/profesionales", icon: Stethoscope },
      { title: "Fichas médicas", url: "/fichas", icon: FileHeart },
    ],
  },
  {
    label: "Operación",
    items: [
      { title: "Recordatorios", url: "/recordatorios", icon: BellRing },
      { title: "Pagos", url: "/pagos", icon: CreditCard },
    ],
  },
  {
    label: "Backend & Evaluación",
    items: [
      { title: "Django Admin", url: "http://localhost:8000/admin/", icon: ShieldCheck, external: true },
      { title: "API REST DRF", url: "http://localhost:8000/api/", icon: Database, external: true },
    ],
  },
];

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
            <p className="font-display text-lg font-semibold leading-none text-sidebar-accent-foreground">PetCare</p>
            <p className="text-xs text-sidebar-foreground/70">Gestión clínica</p>
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
                    {i.external ? (
                      <SidebarMenuButton asChild tooltip={i.title}>
                        <a href={i.url} target="_blank" rel="noreferrer" className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <i.icon className="size-4" />
                            <span>{i.title}</span>
                          </span>
                          <ExternalLink className="size-3 opacity-60" />
                        </a>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                        <Link to={i.url}>
                          <i.icon className="size-4" />
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

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="space-y-1.5 text-xs group-data-[collapsible=icon]:hidden">
          <div className="font-semibold text-sidebar-foreground">Sebastián Torres</div>
          <div className="text-[11px] text-muted-foreground">Evaluación 3 · Marcelo Alvarado</div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500"></span>
            PostgreSQL · Transbank Webpay
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
