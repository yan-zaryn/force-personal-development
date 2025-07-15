import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  User, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Settings 
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Home', href: '/', icon: User },
  { name: 'Role Profile', href: '/role-profile', icon: Target },
  { name: 'Skills', href: '/skill-assessment', icon: BarChart3 },
  { name: 'Growth Plan', href: '/growth-plan', icon: TrendingUp },
  { name: 'Progress', href: '/progress', icon: Settings },
  { name: 'Mental Models', href: '/mental-models', icon: Brain },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-4 text-xl font-bold text-gray-900">
                Force
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                        location.pathname === item.href
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {userName && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {userName}</span>
                <Link
                  to="/profile"
                  className={cn(
                    'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors',
                    location.pathname === '/profile'
                      ? 'text-blue-700 bg-blue-100'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
