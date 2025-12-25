import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Activity } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleName = (role) => {
    const names = {
      student: 'Student',
      doctor: 'Doctor',
      hospital_admin: 'Hospital Admin',
      mess_admin: 'Mess Admin'
    };
    return names[role] || role;
  };

  return (
    <nav className="bg-white shadow-md border-b border-sky-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-sky-500" />
            <span className="ml-2 text-xl font-bold text-sky-600">IIIT Health</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <span className="text-gray-600">
                  Welcome, <span className="font-semibold text-sky-600">{user.name}</span>
                </span>
                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">
                  {getRoleName(user.role)}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-sky-600 hover:text-sky-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-sky-100">
          <div className="px-4 py-3 space-y-3">
            {user && (
              <>
                <div className="text-gray-600">
                  Welcome, <span className="font-semibold text-sky-600">{user.name}</span>
                </div>
                <div className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm inline-block">
                  {getRoleName(user.role)}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
