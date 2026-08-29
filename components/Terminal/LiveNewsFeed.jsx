import React, { useMemo, useState } from "react";
import { INITIAL_NEWS_ITEMS } from "../../src/services/newsService.js";

export default function LiveNewsFeed({ onFilterEntity }) {
  const [news, setNews] = useState(INITIAL_NEWS_ITEMS);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = ["ALL", "Monetary Policy", "Corporate Action", "Clearing Rails", "Commodities", "AML Compliance"];

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
      if (!filterQuery) return true;
      const q = filterQuery.toLowerCase();
      return (
        item.headline.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.entities.some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [news, selectedCategory, filterQuery]);

  return (
    <div className="terminal-news-card">
      <div className="news-card-header">
        <div>
          <span className="eyebrow">REAL-TIME GLOBAL FINANCIAL NEWS WIRE</span>
          <h3>Live Institutional News & Macro Events</h3>
        </div>
        <span className="live-pulse-badge">
          ● STREAMING
        </span>
      </div>

      {/* Category Pills & Search */}
      <div className="news-filter-strip">
        <div className="news-cat-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter news by entity, keyword (e.g. FED, JIO, Gold)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="news-search-input"
        />
      </div>

      {/* News Stream List */}
      <div className="news-items-list">
        {filteredNews.map((item) => {
          const isBullish = item.sentiment === "BULLISH";
          const isBearish = item.sentiment === "BEARISH";
          return (
            <article key={item.id} className="news-item-row">
              <div className="news-meta-top">
                <span className="news-timestamp">{item.timestamp}</span>
                <span className="news-source">{item.source}</span>
                {item.breaking && <span className="breaking-tag">⚡ BREAKING</span>}
                <span className={`sentiment-badge ${item.sentiment.toLowerCase()}`}>
                  {isBullish ? "▲ " : isBearish ? "▼ " : "● "}{item.sentiment}
                </span>
              </div>

              <h4 className="news-headline">{item.headline}</h4>
              <p className="news-summary">{item.summary}</p>

              {/* Tagged Entities */}
              <div className="news-entities-strip">
                <span className="entities-label">ENTITIES:</span>
                {item.entities.map((ent) => (
                  <span
                    key={ent}
                    className="entity-news-pill"
                    onClick={() => onFilterEntity && onFilterEntity(ent)}
                    title={`Inspect ${ent} in Knowledge Graph`}
                  >
                    #{ent}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
