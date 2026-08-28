import assert from "node:assert/strict";
import test from "node:test";
import { findBidirectionalPath, findDirectedPath, parseCsv } from "../lib/investigationUtils.mjs";
import { entities, transactions } from "../data/intelligenceMock.js";

test("parseCsv preserves quoted commas and escaped quotes", () => {
  const records = parseCsv('id,flag,amount\nTX-1,"Sanctions, proximity",12400000\nTX-2,"A ""quoted"" value",20');
  assert.deepEqual(records, [
    { id: "TX-1", flag: "Sanctions, proximity", amount: "12400000" },
    { id: "TX-2", flag: 'A "quoted" value', amount: "20" },
  ]);
});

test("parseCsv rejects unterminated quoted fields", () => {
  assert.throws(() => parseCsv('id,flag\nTX-1,"unterminated'), /unterminated quoted CSV field/);
});

test("findDirectedPath returns the shortest directed route", () => {
  const graph = [
    { id: "edge-1", source: "A", target: "B" },
    { id: "edge-2", source: "B", target: "D" },
    { id: "edge-3", source: "A", target: "C" },
    { id: "edge-4", source: "C", target: "E" },
    { id: "edge-5", source: "E", target: "D" },
  ];
  assert.deepEqual(findDirectedPath(graph, "A", "D"), { nodeIds: ["A", "B", "D"], edgeIds: ["edge-1", "edge-2"] });
});

test("findDirectedPath handles missing paths", () => {
  assert.deepEqual(findDirectedPath([{ id: "edge-1", source: "A", target: "B" }], "B", "A"), { nodeIds: [], edgeIds: [] });
});

test("findBidirectionalPath discovers relationship connection between BlackRock and Jio Financial Services", () => {
  const path = findBidirectionalPath(transactions, "BLACKROCK-US", "JIO-IN");
  assert.ok(path.nodeIds.length >= 2, "Path should contain at least 2 nodes");
  assert.equal(path.nodeIds[0], "BLACKROCK-US");
  assert.equal(path.nodeIds[path.nodeIds.length - 1], "JIO-IN");
});

test("findBidirectionalPath discovers multi-hop connection from BlackRock to Reliance Industries", () => {
  const path = findBidirectionalPath(transactions, "BLACKROCK-US", "RELIANCE-IN");
  assert.ok(path.nodeIds.includes("JIO-IN"), "Path from BlackRock to Reliance should route through Jio");
  assert.equal(path.nodeIds[path.nodeIds.length - 1], "RELIANCE-IN");
});
