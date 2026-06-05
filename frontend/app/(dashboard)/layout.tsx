"use client";
import React from "react";
import Script from "next/script";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 w-full min-h-[100dvh] bg-bg-base text-text-primary font-body selection:bg-primary/20 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto relative px-6 py-6 md:px-8 bg-bg-base">
            {children}
          </main>
        </div>
      </div>

      {/* Google Translate container */}
      <div id="google_translate_element" style={{ display: 'none' }} />
      <Script id="gt-init" strategy="afterInteractive">{`
        function googleTranslateElementInit(){
          new google.translate.TranslateElement({
            pageLanguage:'en',
            includedLanguages:'en,hi,ta,te,kn,bn,gu,ar,zh-CN,fr',
            autoDisplay:false
          },'google_translate_element');
        }
      `}</Script>
      <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
    </div>
  );
}
