import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, History, Bug, BookOpen, GitBranch } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/relatorios", label: "Relatórios", icon: History },
    { to: "/logs", label: "Logs", icon: Bug },
    { to: "/docs", label: "Docs", icon: BookOpen },
    { to: "/maps", label: "Maps", icon: GitBranch },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md">
      {/* Logo */}
      <Link to="/" className="brain-logo text-xl font-bold tracking-wider text-cyan-400">
        BrainLex Sentinel
      </Link>

      {/* Hamburger */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="text-cyan-400/60 hover:text-cyan-400 hover:bg-white/5 w-12 h-12"
        >
          {open ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </Button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-11 right-0 glass-strong rounded-lg shadow-glass-lg overflow-hidden min-w-[150px]"
            >
              {links.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-foreground/70 hover:text-cyan-400 hover:bg-white/5"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
