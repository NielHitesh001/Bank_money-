import React, { useMemo, useState } from "react";

function fuzzyScore(node, query) {
  const candidates = [node.id, node.name].map((value) => value.toLowerCase());
  let bestScore = 0;
  for (const candidate of candidates) {
    if (candidate === query) bestScore = Math.max(bestScore, 1000);
    else if (candidate.startsWith(query)) bestScore = Math.max(bestScore, 700 - candidate.length);
    else if (candidate.includes(query)) bestScore = Math.max(bestScore, 500 - candidate.indexOf(query));
    else {
      let queryIndex = 0;
      for (const character of candidate) {
        if (character === query[queryIndex]) queryIndex += 1;
        if (queryIndex === query.length) break;
      }
      if (queryIndex === query.length) bestScore = Math.max(bestScore, 300 - candidate.length);
    }
  }
  return bestScore;
}

export default function GraphSearch({ nodes, onSelectNode }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredNodes = useMemo(() => {
    if (!normalizedQuery) return [];
    return nodes
      .map((node, index) => ({ node, score: fuzzyScore(node, normalizedQuery), index }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 10)
      .map((result) => result.node);
  }, [nodes, normalizedQuery]);

  const selectNode = (node) => {
    onSelectNode(node);
    setQuery(node.name);
    setIsOpen(false);
  };

  return <div className="graph-search">
    <div className="search-input-wrap"><span className="search-prefix">/</span><input aria-label="Search entities" type="search" placeholder="SEARCH TICKER / ENTITY" value={query} onChange={(event) => { setQuery(event.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} /></div>
    {isOpen && filteredNodes.length > 0 && <div className="search-results" role="listbox">{filteredNodes.map((node) => <button className="search-result" key={node.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectNode(node)}><span>[{node.id}]</span>{node.name}</button>)}</div>}
    {isOpen && normalizedQuery && filteredNodes.length === 0 && <div className="search-empty">NO MATCHING ENTITIES</div>}
  </div>;
}