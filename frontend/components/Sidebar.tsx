"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Activity, 
  Radio, 
  Compass, 
  BellRing, 
  Settings2, 
  LogOut, 
  MessageSquare, 
  Swords, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",   icon: Activity },
  { href: "/simulation", label: "Forecast",    icon: Radio },
  { href: "/insights",   label: "Diagnosis",   icon: Compass },
  { href: "/alerts",     label: "Alerts",      icon: BellRing, hasBadge: true },
  { href: "/arena",      label: "Model Arena", icon: Swords, highlight: true },
  { href: "/chat",       label: "AI Chat",     icon: MessageSquare, highlight: true },
  { href: "/settings",   label: "Settings",    icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  // Load state from localStorage on mount and fetch alerts
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }

    const userId = sessionStorage.getItem("darpan_user_id") ?? "user_demo_001";
    api.getAlerts(userId)
      .then(data => {
        setAlertCount(data.alerts.length);
      })
      .catch(err => console.error("Error loading alerts for sidebar badge", err));
  }, [pathname]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 68 : 220 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="h-[100dvh] border-r border-border-main bg-[#0D0F15] flex flex-col shrink-0 z-20 relative shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
    >
      {/* Header Logotype */}
      <div className="h-16 flex items-center justify-between px-4 overflow-hidden border-b border-border-main/40">
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm flex-shrink-0 group-hover:shadow-md transition-shadow">
            <img src="/image.png" alt="DARPAN.AI" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col leading-none"
            >
              <span className="text-base font-semibold tracking-tight text-white font-display">
                DARPAN.AI
              </span>
              <span className="text-[10px] font-normal tracking-wide text-success font-mono uppercase mt-0.5">
                HEALTH TWIN
              </span>
            </motion.div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button 
          onClick={toggleCollapse}
          className="w-6 h-6 rounded border border-border-main hover:bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-6 px-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-2 px-3 font-mono">
            Twin Intelligence
          </div>
        )}
        
        {NAV_ITEMS.map(({ href, label, icon: Icon, highlight, hasBadge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 h-10 transition-all duration-150 relative cursor-pointer group rounded-md ${
                isCollapsed ? "justify-center px-0" : "px-3"
              } ${
                isActive 
                  ? "text-white bg-[#181C24] border-l-2 border-primary font-medium" 
                  : highlight
                  ? "text-primary hover:text-white hover:bg-[#181C24]"
                  : "text-text-secondary hover:text-white hover:bg-[#181C24]"
              }`}
            >
              <Icon 
                size={16} 
                className={`flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-primary" : "text-text-secondary group-hover:text-white"
                }`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              {!isCollapsed && (
                <span className="text-[13px] tracking-wide whitespace-nowrap font-body">
                  {label}
                </span>
              )}

              {/* Dynamic Alerts Badge */}
              {hasBadge && alertCount > 0 && !isCollapsed && (
                <span className="ml-auto bg-danger text-white text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}

              {/* Collapsed label tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 rounded bg-[#181C24] border border-border-main text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  {label}
                  {hasBadge && alertCount > 0 && (
                    <span className="ml-1.5 bg-danger text-white text-[9px] font-mono px-1 rounded-full">
                      {alertCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom widgets and Google Translate */}
      <div className="mt-auto px-2 pb-4 flex flex-col gap-2">
        {/* Google Translate element holder */}
        <div id="google_translate_element" className="!static !w-full !p-0" />

        {/* Footer Profile card */}
        <div className={`p-1 border-t border-border-main/20 pt-3 ${isCollapsed ? "flex flex-col items-center gap-2" : ""}`}>
          <div 
            className={`flex items-center justify-between border border-border-main/40 bg-[#111318] rounded-lg ${
              isCollapsed ? "p-1.5" : "p-2.5 w-full"
            }`}
          >
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-[9px] text-text-muted font-normal uppercase tracking-wider font-mono">Provider ID</span>
                <span className="text-xs font-medium text-white font-mono bg-[#181C24] px-1.5 py-0.5 rounded border border-border-main/50 mt-1">
                  Roshan-9602
                </span>
              </div>
            )}
            
            <button 
              onClick={handleLogout}
              className={`rounded flex items-center justify-center text-text-secondary hover:text-danger hover:bg-[#181C24] transition-all cursor-pointer ${
                isCollapsed ? "w-8 h-8" : "w-7 h-7"
              }`}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
          
          {/* Bottom Alerts Issues Badge */}
          {alertCount > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-danger/10 border border-danger/25 rounded-md mt-2 ${isCollapsed ? "w-8 h-8 justify-center p-0" : "w-full"}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
              </span>
              {!isCollapsed && (
                <span className="text-[10px] font-mono text-danger font-semibold">
                  {alertCount} ISSUES FLAGGED
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
