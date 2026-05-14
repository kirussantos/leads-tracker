import { Link, useLocation } from "react-router-dom";
import { Link2, LayoutDashboard, Zap } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/links", label: "Links", icon: Link2 },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-green/10 border border-green/30 rounded-lg flex items-center justify-center animate-pulse-glow">
            <Zap size={14} className="text-green" />
          </div>
          <span className="font-mono font-bold text-sm text-slate-200 tracking-tight">
            leads<span className="text-green">.</span>tracker
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all",
                pathname === to
                  ? "bg-green/10 text-green border border-green/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
          <span className="text-xs font-mono text-slate-600">live</span>
        </div>
      </div>
    </nav>
  );
}
