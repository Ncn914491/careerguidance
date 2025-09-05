'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { 
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleProfile = () => {
    if (isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-20 bg-glass backdrop-blur-md border-b border-glass shadow-glass-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-lg bg-glass-dark hover:bg-glass-light transition-all duration-300 text-white"
              aria-label="Toggle mobile menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            
            <h1 className="text-lg font-semibold text-white hidden sm:block">
              Career Guidance
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-3 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    isAdmin 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {isAdmin ? 'Admin' : 'Student'}
                  </span>
                </div>
                
                <Button
                  onClick={handleProfile}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-glass-dark"
                >
                  Dashboard
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-glass-dark"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
                Login / Signup
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}