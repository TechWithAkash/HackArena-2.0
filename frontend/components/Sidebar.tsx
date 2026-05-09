"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Radio, Compass, BellRing, Settings2, LogOut, MessageSquare, Swords } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Patient Vitals",      icon: Activity },
  { href: "/simulation", label: "Forecast Trajectory", icon: Radio },
  { href: "/insights",   label: "Causal Diagnosis",    icon: Compass },
  { href: "/alerts",     label: "Medical Alerts",      icon: BellRing },
  { href: "/arena",      label: "Model Arena",         icon: Swords, highlight: true },
  { href: "/chat",       label: "AI Health Chat",      icon: MessageSquare, highlight: true },
  { href: "/settings",   label: "Preferences",         icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 xl:w-72 border-r border-gray-200 bg-white flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-20 border-b border-gray-100 flex items-center px-5 bg-white">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 flex-shrink-0 group-hover:shadow-md transition-shadow">
            <img src="/image.png" alt="DARPAN.AI" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[20px] font-black tracking-widest bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
              DARPAN.AI
            </span>
            <span className="text-[12px] font-semibold tracking-[0.18em] text-gray-400 uppercase mt-0.5">
              Health Twin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-8 px-4 flex flex-col gap-1 relative overflow-y-auto">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 px-4">Patient Control</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3.5 text-[13px] font-bold rounded-2xl transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                  : highlight
                  ? "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              {label}
              {highlight && !isActive && (
                <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-white bg-indigo-500 px-1.5 py-0.5 rounded-md">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Provider ID</span>
            <span className="text-xs font-bold text-gray-900">Roshan</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <LogOut className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
}
