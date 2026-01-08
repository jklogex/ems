'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wrench,
  Users,
  ClipboardList,
  Package,
  BarChart3,
  Smartphone,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Equipos', href: '/equipment', icon: Wrench },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Órdenes de Trabajo', href: '/work-orders', icon: ClipboardList },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Móvil', href: '/mobile', icon: Smartphone },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-16">
        <h1 className="text-lg font-bold">LogeX-EMS</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

