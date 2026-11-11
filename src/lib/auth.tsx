import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type Role = "superadmin" | "admin" | "vet" | "tutor" | "guest";

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  roleName: string;
  badge: string;
  badgeColor: string;
  avatar: string;
  email: string;
}

export const PRESET_USERS: Record<string, UserProfile> = {
  profe: {
    id: "profe",
    name: "Prof. Marcelo Alvarado",
    role: "superadmin",
    roleName: "Docente Evaluador (Superadmin)",
    badge: "Superadmin / Docente",
    badgeColor: "bg-red-600 text-white",
    avatar: "👨‍🏫",
    email: "marcelo.alvarado@inacap.cl",
  },
  admin: {
    id: "admin",
    name: "Sebastián Torres Zamorano",
    role: "admin",
    roleName: "Administrador General de Clínica",
    badge: "Administrador",
    badgeColor: "bg-amber-600 text-white",
    avatar: "👑",
    email: "seba.torres@petcare.cl",
  },
  vet: {
    id: "vet",
    name: "Dra. Valentina Soto",
    role: "vet",
    roleName: "Médico Veterinario Especialista",
    badge: "Veterinario",
    badgeColor: "bg-emerald-600 text-white",
    avatar: "👩‍⚕️",
    email: "v.soto@petcare.cl",
  },
  tutor: {
    id: "tutor",
    name: "Camila Rojas",
    role: "tutor",
    roleName: "Tutora Responsable (Cliente)",
    badge: "Tutor / Cliente",
    badgeColor: "bg-blue-600 text-white",
    avatar: "👤",
    email: "camila.rojas@mail.cl",
  },
};

export type Permission =
  | "create_pet"
  | "delete_pet"
  | "create_vet"
  | "delete_vet"
  | "create_tutor"
  | "delete_tutor"
  | "create_ficha"
  | "create_cita"
  | "process_pago"
  | "access_admin";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    "create_pet",
    "delete_pet",
    "create_vet",
    "delete_vet",
    "create_tutor",
    "delete_tutor",
    "create_ficha",
    "create_cita",
    "process_pago",
    "access_admin",
  ],
  admin: [
    "create_pet",
    "delete_pet",
    "create_vet",
    "delete_vet",
    "create_tutor",
    "delete_tutor",
    "create_ficha",
    "create_cita",
    "process_pago",
    "access_admin",
  ],
  vet: [
    "create_pet",
    "delete_pet",
    "create_ficha",
    "create_cita",
    "process_pago",
  ],
  tutor: [
    "create_cita",
    "process_pago",
  ],
  guest: [],
};

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isAuthenticated: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
  can: (perm: Permission) => boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  requireAuth: (perm: Permission, onGranted: () => void) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "petcare_auth_session_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== "guest") {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setLoginModalOpen(false);
    toast.success(`Bienvenido/a, ${profile.name} (${profile.roleName})`);
  };

  const logout = () => {
    setUser(null);
    localStorage.setItem(STORAGE_KEY, "guest");
    toast.info("Sesión cerrada. Sistema en modo Solo Lectura");
  };

  const role: Role = user?.role ?? "guest";

  const can = (perm: Permission): boolean => {
    return ROLE_PERMISSIONS[role].includes(perm);
  };

  const requireAuth = (perm: Permission, onGranted: () => void): boolean => {
    if (!user) {
      toast.error("Acceso restringido: Debes iniciar sesión para realizar esta operación clínica");
      setLoginModalOpen(true);
      return false;
    }
    if (!can(perm)) {
      toast.error(`Permiso denegado: Tu perfil actual (${user.roleName}) no tiene permisos para esta acción`);
      return false;
    }
    onGranted();
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        logout,
        can,
        loginModalOpen,
        setLoginModalOpen,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
