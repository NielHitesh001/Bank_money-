import React, { useState } from "react";

export const defaultGraphSettings = {
  searchQuery: "",
  showTags: true,
  showAttachments: true,
  existingOnly: false,
  showOrphans: true,
  arrows: false,
  textFade: 0.2,
  nodeSize: 8,
  linkThickness: 1.5,
  centerForce: 0.1,
  repelForce: 140,
  linkDistance: 90,
};

export default function GraphControls({ settings, onChange, onAnimate }) {
  const [isOpen, setIsOpen] = useState(false);
  const updateSetting = (key, value) => onChange((previous) => ({ ...previous, [key]: value }));
  const resetSettings = () => onChange({ ...defaultGraphSettings });

  if (!isOpen) {
    return <button className="controls-reopen" type="button" onClick={() => setIsOpen(true)}>GRAPH CONTROLS</button>;
  }

  const filters = [
    ["showTags", "Tags"], ["showAttachments", "Attachments"],
    ["existingOnly", "Existing files only"], ["showOrphans", "Orphans"],
  ];

  return <aside className="graph-controls">
    <div className="controls-header"><strong>GRAPH SETTINGS</strong><div><button type="button" onClick={resetSettings} aria-label="Reset graph settings">RESET</button><button type="button" onClick={() => setIsOpen(false)} aria-label="Close graph controls">x</button></div></div>
    <div className="controls-section"><h3>FILTERS</h3><input aria-label="Filter entities" type="search" placeholder="Search entities..." value={settings.searchQuery} onChange={(event) => updateSetting("searchQuery", event.target.value)} />{filters.map(([key, label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={(event) => updateSetting(key, event.target.checked)} /></label>)}</div>
    <div className="controls-section"><h3>DISPLAY</h3><label><span>Arrows</span><input type="checkbox" checked={settings.arrows} onChange={(event) => updateSetting("arrows", event.target.checked)} /></label><RangeControl label="Text fade threshold" value={settings.textFade} min="0" max="1" step="0.05" onChange={(value) => updateSetting("textFade", value)} /><RangeControl label="Node size" value={settings.nodeSize} min="2" max="20" step="1" onChange={(value) => updateSetting("nodeSize", value)} /><RangeControl label="Link thickness" value={settings.linkThickness} min="0.5" max="5" step="0.5" onChange={(value) => updateSetting("linkThickness", value)} /><button className="animate-button" type="button" onClick={onAnimate}>ANIMATE TIME-LAPSE</button></div>
    <div className="controls-section"><h3>FORCES</h3><RangeControl label="Center force" value={settings.centerForce} min="0" max="1" step="0.05" onChange={(value) => updateSetting("centerForce", value)} /><RangeControl label="Repel force" value={settings.repelForce} min="10" max="300" step="5" onChange={(value) => updateSetting("repelForce", value)} /><RangeControl label="Link distance" value={settings.linkDistance} min="10" max="200" step="5" onChange={(value) => updateSetting("linkDistance", value)} /></div>
  </aside>;
}

function RangeControl({ label, value, min, max, step, onChange }) {
  return <label className="range-control"><span><span>{label}</span><output>{Number(value).toFixed(step < 1 ? 2 : 0)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
