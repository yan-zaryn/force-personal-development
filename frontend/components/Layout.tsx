import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Settings,
  LogOut
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import LanguageSelector from './LanguageSelector';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'nav.home', href: '/', icon: User, protected: false },
  { name: 'nav.roleProfile', href: '/role-profile', icon: Target, protected: true },
  { name: 'nav.skills', href: '/skill-assessment', icon: BarChart3, protected: true },
  { name: 'nav.growthPlan', href: '/growth-plan', icon: TrendingUp, protected: true },
  { name: 'nav.progress', href: '/progress', icon: Settings, protected: true },
  { name: 'nav.mentalModels', href: '/mental-models', icon: Brain, protected: true },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
                {navigation
                  .filter(item => !item.protected || isAuthenticated)
                  .map((item) => {
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
                        {t(item.name)}
                      </Link>
                    );
                  })}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <LanguageSelector />
              
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className={cn(
                      'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors',
                      location.pathname === '/profile'
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <User className="w-4 h-4 mr-1" />
                    )}
                    {user.name}
                  </Link>
                  
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-1" />
                  {t('nav.profile')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
