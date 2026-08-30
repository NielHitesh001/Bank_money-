import React, { useEffect, useState } from "react";

export default function TerminalHeader({ onOpenPalette }) {
  const [currentTime, setCurrentTime] = useState(() => new Date().toUTCString().slice(17, 25) + " UTC");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="terminal-header">
      <div className="terminal-header__logo">
        <span style={{ color: "#64dcb1", fontSize: "14px" }}>⚡</span>
        <span>WORLD MONEY TERMINAL</span>
      </div>

      <div className="terminal-header__status-group">
        <div className="terminal-header__status-item">
          <span className="terminal-header__status-dot" />
          <span>MARKET LIVE</span>
        </div>
        <div className="terminal-header__status-item">
          <span>NY <b>09:30 - 16:00 ET</b></span>
        </div>
        <div className="terminal-header__status-item">
          <span>SEC <b>17a-5 VERIFIED</b></span>
        </div>
        <div className="terminal-header__status-item" style={{ color: "#00d9ff", fontWeight: 600 }}>
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
}
