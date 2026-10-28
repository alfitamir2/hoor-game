import React from "react";

export function GameApp(): React.JSX.Element {
  return (
    <div className="w-full h-screen bg-[#0F172A] overflow-hidden flex flex-col" dir="rtl">
      <iframe
        src="/Hoor-Plays-Learns-Android.html"
        title="لعبة حور: العب وتعلّم - 22 مرحلة"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        allow="autoplay"
        loading="eager"
      />
    </div>
  );
}

export default GameApp;
