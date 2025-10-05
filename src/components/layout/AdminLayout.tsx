
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  Settings, 
  BarChart3, 
  ChevronRight,
  Home,
  Shield,
  LogOut,
  Zap,
  ChevronDown,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navigationItems = [
    {
      title: 'Overview',
      href: '/admin',
      icon: Home,
      description: 'System overview and metrics'
    },
    {
      title: 'AI Prompts',
      href: '/admin/prompts',
      icon: Brain,
      description: 'Manage AI coaching prompts',
      badge: 'Active'
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage users and invites'
    },
    {
      title: 'Vault Security',
      href: '/admin/vault-monitoring',
      icon: Lock,
      description: 'Monitor credential security',
      badge: 'New'
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Usage analytics and insights',
      badge: 'Soon',
      disabled: true
    },
    {
      title: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Configure system preferences',
      disabled: true
    }
  ];

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    if (pathSegments.length === 1) {
      breadcrumbs.push({ label: 'Admin Overview', href: '/admin' });
    } else if (pathSegments.length === 2) {
      breadcrumbs.push({ label: 'Admin Overview', href: '/admin' });
      
      if (pathSegments[1] === 'prompts') {
        breadcrumbs.push({ label: 'AI Prompt Management', href: '/admin/prompts' });
      } else if (pathSegments[1] === 'users') {
        breadcrumbs.push({ label: 'User Management', href: '/admin/users' });
      } else if (pathSegments[1] === 'vault-monitoring') {
        breadcrumbs.push({ label: 'Vault Security', href: '/admin/vault-monitoring' });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Sales Whisperer</h1>
              <p className="text-sm text-gray-500">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            const content = (
              <div className={`
                flex items-center justify-between p-3 rounded-lg transition-colors w-full
                ${active 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}>
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-700' : item.disabled ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <Badge 
                      variant={item.badge === 'Active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {!item.disabled && (
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
            );

            return item.disabled ? (
              <div key={item.href}>{content}</div>
            ) : (
              <Link key={item.href} to={item.href}>
                {content}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* System Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">System Online</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>

          {/* User Info with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{user?.email}</div>
                    <Badge variant="outline" className="text-xs">Admin</Badge>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center space-x-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Link
                  to={breadcrumb.href}
                  className={`
                    ${index === breadcrumbs.length - 1
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {breadcrumb.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
