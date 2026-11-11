import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  User,
  LogIn,
  LogOut,
  Shield,
  ChevronDown,
  Database,
  Server,
  KeyRound,
  CheckCircle2,
  Lock,
} from "lucide-react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { StoreProvider } from "@/lib/store";
import { AuthProvider, useAuth, PRESET_USERS, type UserProfile } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function UserSessionBar() {
  const auth = useAuth();
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUser.trim().toLowerCase();
    if (u === "profe") {
      auth.login(PRESET_USERS.profe!);
    } else if (u === "admin" || u === "seba") {
      auth.login(PRESET_USERS.admin!);
    } else if (u.includes("vet") || u.includes("vale")) {
      auth.login(PRESET_USERS.vet!);
    } else if (u.includes("tutor") || u.includes("camila")) {
      auth.login(PRESET_USERS.tutor!);
    } else {
      const custom: UserProfile = {
        id: "custom-" + Date.now(),
        name: loginUser.trim() || "Usuario Invitado",
        role: "vet",
        roleName: "Personal Clínico",
        badge: "Clínico",
        badgeColor: "bg-primary text-primary-foreground",
        avatar: "👤",
        email: `${u}@petcare.cl`,
      };
      auth.login(custom);
    }
  };

  return (
    <div className="flex items-center gap-2 ml-auto">
      {/* Badges de Infraestructura en Producción */}
      <div className="hidden xl:flex items-center gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          <Database className="size-3" /> PostgreSQL 18
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
          <Server className="size-3" /> AWS EC2
        </span>
        <a
          href="/admin/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition"
        >
          <Shield className="size-3" /> Django Admin
        </a>
      </div>

      {/* Control de Usuario / Sesión Activa */}
      {auth.user ? (
        <button
          type="button"
          onClick={() => auth.setLoginModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1 text-left text-xs shadow-xs hover:bg-accent transition cursor-pointer"
        >
          <span className="text-base">{auth.user.avatar}</span>
          <div className="hidden sm:block leading-tight">
            <p className="font-semibold">{auth.user.name}</p>
            <p className="text-[10px] text-muted-foreground">{auth.user.roleName}</p>
          </div>
          <ChevronDown className="size-3 text-muted-foreground ml-1" />
        </button>
      ) : (
        <Button
          size="sm"
          className="h-8 text-xs font-semibold shadow-xs cursor-pointer"
          onClick={() => auth.setLoginModalOpen(true)}
        >
          <LogIn className="size-3.5 mr-1" /> Iniciar Sesión
        </Button>
      )}

      {/* Modal Central de Login / Cambio de Rol */}
      <Dialog open={auth.loginModalOpen} onOpenChange={auth.setLoginModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {auth.user ? <User className="size-5 text-primary" /> : <KeyRound className="size-5 text-primary" />}
              {auth.user ? "Perfil y Cambio de Rol (RBAC)" : "Acceso y Roles Clínicos PetCare"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {auth.user ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/40">
                <div className="grid size-12 place-items-center rounded-xl bg-background text-2xl shadow-xs">
                  {auth.user.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{auth.user.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${auth.user.badgeColor}`}>
                      {auth.user.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{auth.user.email}</p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3" /> Sesión Activa con Permisos Asignados
                  </p>
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Selecciona un perfil y rol para probar permisos:
              </p>
              <div className="grid gap-2">
                {Object.values(PRESET_USERS).map((p) => {
                  const isSelected = auth.user?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => auth.login(p)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "hover:bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.avatar}</span>
                        <div>
                          <p className="text-xs font-semibold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.roleName}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!auth.user && (
              <form onSubmit={handleManualLogin} className="space-y-3 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium">O ingresa manualmente:</label>
                  <Input
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Usuario (profe, admin, vet...)"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Contraseña (123456 / admin123)"
                    className="mt-1 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs">
                  Ingresar
                </Button>
              </form>
            )}

            {auth.user && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={auth.logout}
                  className="text-xs"
                >
                  <LogOut className="size-3.5 mr-1" /> Cerrar Sesión
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => auth.setLoginModalOpen(false)}
                  className="text-xs"
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuestBanner() {
  const auth = useAuth();
  if (auth.isAuthenticated) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-amber-800 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-amber-600 shrink-0" />
        <span>
          <strong>Modo Solo Lectura (Sin Sesión):</strong> Estás explorando el catálogo clínico. Para registrar o eliminar pacientes, médicos, citas o procesar cobros, debes iniciar sesión.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-amber-500/30 bg-background hover:bg-amber-500/10"
        onClick={() => auth.setLoginModalOpen(true)}
      >
        <LogIn className="size-3 mr-1" /> Iniciar Sesión para Habilitar Acciones
      </Button>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => router.invalidate()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PetCare · Gestión clínica veterinaria" },
      {
        name: "description",
        content: "Agenda, fichas médicas, recordatorios y pagos para la clínica veterinaria PetCare.",
      },
      { property: "og:title", content: "PetCare · Gestión clínica veterinaria" },
      { property: "og:description", content: "Agenda, fichas médicas, recordatorios y pagos para PetCare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
                  <SidebarTrigger />
                  <span className="font-display font-semibold text-sm hidden md:inline text-foreground/80">
                    🐾 PetCare Clinic Compass
                  </span>
                  <UserSessionBar />
                </header>
                <GuestBanner />
                <main className="flex-1 p-6 lg:p-8">
                  <Outlet />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster richColors />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
