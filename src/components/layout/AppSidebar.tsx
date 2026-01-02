import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  FileText, 
  Receipt, 
  Truck, 
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'inventory', 'accountant'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'inventory'] },
  { name: 'Inventory', href: '/inventory', icon: Warehouse, roles: ['admin', 'inventory'] },
  { name: 'Quotations', href: '/quotations', icon: FileText, roles: ['admin', 'sales'] },
  { name: 'Billing', href: '/billing', icon: Receipt, roles: ['admin', 'sales'] },
  { name: 'Deliveries', href: '/deliveries', icon: Truck, roles: ['admin', 'sales', 'inventory'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'accountant'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export const AppSidebar = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.roles as any[])
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <aside 
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg">IT Shop</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {user ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};
