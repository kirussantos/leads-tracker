import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link2, LayoutDashboard, Zap, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/links", label: "Links", icon: Link2 },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-green/10 border border-green/30 rounded-lg flex items-center justify-center animate-pulse-glow">
            <Zap size={14} className="text-green" />
          </div>
          <span className="font-mono font-bold text-sm text-slate-200 tracking-tight hidden sm:block">
            leads<span className="text-green">.</span>tracker
          </span>
        </Link>

        {/* Nav items — ícone+texto no desktop, só ícone no mobile */}
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all",
                pathname === to
                  ? "bg-green/10 text-green border border-green/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </div>

        {/* Direita: indicador live + botão sair */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live indicator — só desktop */}
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-slate-600">live</span>
          </span>

          {/* Botão Sair — sempre visível, maior no mobile */}
          {user && (
            <button
              onClick={handleLogout}
              title={`Sair (${user.email})`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-400 hover:text-red/80 bg-white/[0.03] hover:bg-red/5 border border-border hover:border-red/20 rounded-lg transition-all active:scale-95"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
