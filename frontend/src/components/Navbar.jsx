import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link2, LayoutDashboard, Zap, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/",      label: "Dashboard", icon: LayoutDashboard },
  { to: "/links", label: "Links",     icon: Link2 },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border/60">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-7 h-7 bg-green/10 border border-green/25 rounded-lg flex items-center justify-center animate-pulse-glow group-hover:border-green/50 transition-colors">
            <Zap size={13} className="text-green" />
          </div>
          <span className="font-mono font-bold text-sm text-slate-200 tracking-tight hidden sm:block">
            leads<span className="text-green">.</span>tracker
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all",
                  isActive
                    ? "bg-green/10 text-green border border-green/20 shadow-[0_0_12px_rgba(34,197,94,0.08)]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent",
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: live + logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green/[0.04] border border-green/10">
            <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-dot" />
            <span className="text-[10px] font-mono text-green/60 tracking-wider">LIVE</span>
          </div>

          {/* Logout */}
          {user && (
            <button
              onClick={handleLogout}
              title={`Sair — ${user.email}`}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg",
                "text-slate-500 hover:text-red border border-border hover:border-red/25",
                "bg-white/[0.02] hover:bg-red/[0.04] transition-all active:scale-95",
              )}
            >
              <LogOut size={12} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
