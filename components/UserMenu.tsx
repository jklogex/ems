'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Shield, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Get role display text
  const getRoleDisplay = (role?: string): string => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      technician: 'Técnico',
      viewer: 'Visualizador',
    };
    return roleMap[role || ''] || role || 'Usuario';
  };

  const user = session?.user;
  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = user?.email || '';
  const displayRole = getRoleDisplay(user?.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 w-full rounded-lg p-2 text-left transition-colors hover:bg-accent"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{displayName}</span>
            </div>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Rol: {displayRole}</span>
          </div>
          {user?.region && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Región: {user.region}</span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} destructive>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
