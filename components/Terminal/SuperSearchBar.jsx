import React, { useEffect, useRef, useState } from "react";

export default function SuperSearchBar({ onSelectEntity, onSelectSymbol }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeDossier, setActiveDossier] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global Cmd+F hotkey listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch live suggestions on query change
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(0);
        }
      } catch {
        setSuggestions([]);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (item) => {
    setIsOpen(false);
    setQuery(item.title);

    try {
      const res = await fetch(`/api/v1/search/entity?q=${encodeURIComponent(item.symbol || item.id)}`);
      if (res.ok) {
        const dossier = await res.json();
        setActiveDossier(dossier);
        if (onSelectEntity) onSelectEntity(dossier);
        if (onSelectSymbol && dossier.symbol) onSelectSymbol(dossier.symbol);
      }
    } catch (err) {
      console.error("SuperSearch error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        handleSelect({ title: query, symbol: query, id: query });
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px" }}>
      {/* Super Search Input Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#060a08",
          border: "1px solid #1a2c24",
          borderRadius: "4px",
          padding: "3px 8px",
          width: "280px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        <span style={{ color: "#64dcb1", fontSize: "11px", fontWeight: "bold", marginRight: "6px" }}>
          ⚡ SUPER SEARCH
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Ticker, Entity, LEI (Cmd+F)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f0fdf4",
            fontSize: "11px",
            width: "100%",
            fontFamily: "monospace",
          }}
        />
        <span style={{ color: "#486256", fontSize: "9px", padding: "1px 4px", border: "1px solid #1a2c24", borderRadius: "2px" }}>
          ⌘F
        </span>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "360px",
            background: "#0c1511",
            border: "1px solid #284437",
            borderRadius: "4px",
            marginTop: "4px",
            zIndex: 9999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => handleSelect(item)}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #14221b",
                cursor: "pointer",
                background: idx === selectedIndex ? "#162820" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#f0fdf4", fontSize: "12px", fontWeight: "bold" }}>
                  {item.title}
                </div>
                <div style={{ color: "#8da49c", fontSize: "10px" }}>
                  {item.subtitle}
                </div>
              </div>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "2px",
                  background: item.type === "TICKER" ? "rgba(82, 214, 170, 0.15)" : "rgba(56, 189, 248, 0.15)",
                  color: item.type === "TICKER" ? "#52d6aa" : "#38bdf8",
                  border: `1px solid ${item.type === "TICKER" ? "#52d6aa" : "#38bdf8"}`,
                  fontWeight: "bold",
                }}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Floating Active Entity Context Badge */}
      {activeDossier && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#0e1a14",
            border: "1px solid #284437",
            padding: "2px 8px",
            borderRadius: "3px",
            fontSize: "10px",
          }}
        >
          <span style={{ color: "#8da49c" }}>FOCUSED:</span>
          <strong style={{ color: "#64dcb1" }}>{activeDossier.symbol}</strong>
          <span style={{ color: "#f0fdf4" }}>${activeDossier.market.price.toFixed(2)}</span>
          <span style={{ color: activeDossier.market.changePct >= 0 ? "#52d6aa" : "#ff5b6e" }}>
            {activeDossier.market.changePct >= 0 ? "+" : ""}{activeDossier.market.changePct}%
          </span>
          <span style={{ color: "#fbbf24" }}>[{activeDossier.entity.rating || "AAA"}]</span>
          <button
            onClick={() => setActiveDossier(null)}
            style={{ background: "none", border: "none", color: "#6e8a7f", cursor: "pointer", fontSize: "11px", padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
