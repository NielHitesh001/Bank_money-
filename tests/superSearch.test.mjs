import test from "node:test";
import assert from "node:assert/strict";
import { getSearchSuggestions, resolveEntityDossier } from "../src/services/superSearchService.js";

test("SuperSearch returns matching autocomplete suggestions for tickers and institutions", () => {
  const suggestionsAapl = getSearchSuggestions("AAPL");
  assert.ok(suggestionsAapl.length > 0, "Should return suggestions for AAPL");
  assert.equal(suggestionsAapl[0].symbol, "AAPL");

  const suggestionsFed = getSearchSuggestions("Federal Reserve");
  assert.ok(suggestionsFed.length > 0, "Should return suggestions for Federal Reserve");
  assert.ok(suggestionsFed[0].title.includes("Federal Reserve"));
});

test("SuperSearch resolves unified multi-dimensional dossier for equity ticker", () => {
  const dossier = resolveEntityDossier("AAPL");
  assert.equal(dossier.symbol, "AAPL");
  assert.ok(dossier.market.price > 0, "Market price must be positive");
  assert.ok(dossier.entity.name, "Entity must have a name");
  assert.ok(dossier.risk.var95 > 0, "VaR 95% must be positive");
  assert.ok(Array.isArray(dossier.news), "News must be an array");
});

test("SuperSearch resolves institutional counterparty relationships", () => {
  const dossier = resolveEntityDossier("JPM");
  assert.ok(dossier.entity.id.includes("JPM"), "Should resolve to JPMorgan entity");
  assert.ok(Array.isArray(dossier.counterparties), "Counterparties must be an array");
});
