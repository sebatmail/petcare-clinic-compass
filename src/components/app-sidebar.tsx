import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, PawPrint, CalendarDays, FileHeart, BellRing, CreditCard, Stethoscope } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const groups = [
  { label: "General", items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }] },
  { label: "Clínica", items: [
    { title: "Tutores", url: "/tutores", icon: Users },
    { title: "Mascotas", url: "/mascotas", icon: PawPrint },
    { title: "Agenda", url: "/agenda", icon: CalendarDays },
    { title: "Profesionales", url: "/profesionales", icon: Stethoscope },
    { title: "Fichas médicas", url: "/fichas", icon: FileHeart },
  ] },
  { label: "Operación", items: [
    { title: "Recordatorios", url: "/recordatorios", icon: BellRing },
    { title: "Pagos", url: "/pagos", icon: CreditCard },
  ] },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><PawPrint className="size-5" /></div>
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
                    <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                      <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter><p className="px-2 pb-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">Modo pruebas · pagos sandbox</p></SidebarFooter>
    </Sidebar>
  );
}
