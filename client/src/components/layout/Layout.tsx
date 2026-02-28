import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItems = [
    { path: '/app', label: 'Scenes', icon: ScenesIcon },
    { path: '/app/subscription', label: 'Plan', icon: PlanIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-700 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/app" className="text-xl font-bold text-gradient">
            AR01
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">
              {user?.name}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary-600/20 text-primary-400 capitalize">
              {user?.subscription}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="border-t border-slate-700 safe-area-bottom md:hidden">
        <div className="flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors
                  ${isActive ? 'text-primary-400' : 'text-slate-400'}`}
              >
                <item.icon active={isActive} />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ScenesIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-primary-400' : 'text-slate-400'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-primary-400' : 'text-slate-400'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
