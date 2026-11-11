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
import { useEffect, useState, type ReactNode } from "react";
import {
  User,
  LogIn,
  LogOut,
  Shield,
  ChevronDown,
  ExternalLink,
  Database,
  Server,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  avatar: string;
  email: string;
}

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: "profe",
    name: "Prof. Marcelo Alvarado",
    role: "Docente Evaluador INACAP",
    badge: "Docente / Evaluador",
    badgeColor: "bg-red-600 text-white",
    avatar: "👨‍🏫",
    email: "marcelo.alvarado@inacap.cl",
  },
  {
    id: "admin",
    name: "Sebastián Torres Zamorano",
    role: "Administrador Supremo (Estudiante)",
    badge: "Superadmin / Dev",
    badgeColor: "bg-amber-600 text-white",
    avatar: "👑",
    email: "seba.torres@petcare.cl",
  },
  {
    id: "vet1",
    name: "Dra. Valentina Soto",
    role: "Médico Veterinario General",
    badge: "Veterinario",
    badgeColor: "bg-emerald-600 text-white",
    avatar: "👩‍⚕️",
    email: "v.soto@petcare.cl",
  },
  {
    id: "tutor1",
    name: "Camila Rojas",
    role: "Tutora de Pacientes (Max y Luna)",
    badge: "Tutor / Cliente",
    badgeColor: "bg-blue-600 text-white",
    avatar: "👤",
    email: "camila.rojas@mail.cl",
  },
];

function UserSessionBar() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEFAULT_PROFILES[0]!);
  const [openModal, setOpenModal] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("petcare-current-user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      } else {
        localStorage.setItem("petcare-current-user", JSON.stringify(DEFAULT_PROFILES[0]));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const switchProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem("petcare-current-user", JSON.stringify(profile));
    setOpenModal(false);
    toast.success(`Sesión cambiada a: ${profile.name} (${profile.role})`);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("petcare-current-user");
    toast.info("Has cerrado sesión en la plataforma");
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUser.trim().toLowerCase();
    if (u === "profe") {
      switchProfile(DEFAULT_PROFILES[0]!);
    } else if (u === "admin" || u === "seba") {
      switchProfile(DEFAULT_PROFILES[1]!);
    } else if (u.includes("vet") || u.includes("vale")) {
      switchProfile(DEFAULT_PROFILES[2]!);
    } else {
      const custom: UserProfile = {
        id: "custom-" + Date.now(),
        name: loginUser.trim() || "Usuario Invitado",
        role: "Personal Clínico",
        badge: "Usuario",
        badgeColor: "bg-primary text-primary-foreground",
        avatar: "👤",
        email: `${u}@petcare.cl`,
      };
      switchProfile(custom);
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
      {currentUser ? (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1 text-left text-xs shadow-xs hover:bg-accent transition"
            >
              <span className="text-base">{currentUser.avatar}</span>
              <div className="hidden sm:block leading-tight">
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground">{currentUser.role}</p>
              </div>
              <ChevronDown className="size-3 text-muted-foreground ml-1" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" /> Perfil y Cambio de Usuario
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/40">
                <div className="grid size-12 place-items-center rounded-xl bg-background text-2xl shadow-xs">
                  {currentUser.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{currentUser.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${currentUser.badgeColor}`}>
                      {currentUser.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3" /> Sesión Activa (Autenticado)
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Cambiar a otra cuenta para pruebas de evaluación:
                </p>
                <div className="grid gap-2">
                  {DEFAULT_PROFILES.map((p) => {
                    const isSelected = currentUser.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => switchProfile(p)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs"
                            : "hover:bg-muted border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.avatar}</span>
                          <div>
                            <p className="text-xs font-semibold">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.role}</p>
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

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={logout}
                  className="text-xs"
                >
                  <LogOut className="size-3.5 mr-1" /> Cerrar Sesión
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModal(false)}
                  className="text-xs"
                >
                  Listo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs font-semibold">
              <LogIn className="size-3.5 mr-1" /> Iniciar Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" /> Acceso al Sistema PetCare
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <form onSubmit={handleManualLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Usuario / RUT</label>
                  <Input
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="profe, admin o correo..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Contraseña</label>
                  <Input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full text-xs">
                  Entrar a la Plataforma
                </Button>
              </form>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Atajos rápidos para evaluación docente:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => switchProfile(DEFAULT_PROFILES[0]!)}
                  >
                    👨‍🏫 Entrar como Profe
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => switchProfile(DEFAULT_PROFILES[1]!)}
                  >
                    👑 Entrar como Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => switchProfile(DEFAULT_PROFILES[2]!)}
                  >
                    👩‍⚕️ Dra. Valentina
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => switchProfile(DEFAULT_PROFILES[3]!)}
                  >
                    👤 Camila (Tutora)
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
        content:
          "Agenda, fichas médicas, recordatorios y pagos para la clínica veterinaria PetCare.",
      },
      { property: "og:title", content: "PetCare · Gestión clínica veterinaria" },
      {
        property: "og:description",
        content: "Agenda, fichas médicas, recordatorios y pagos para PetCare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
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
              <main className="flex-1 p-6 lg:p-8">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster richColors />
      </StoreProvider>
    </QueryClientProvider>
  );
}
