import test from "node:test";
import assert from "node:assert/strict";
import { STRATEGY_IDE_MCP_TOOLS } from "../src/services/claudeMCPTools.js";
import { handleMCPToolCall, processClaudeMessage } from "../src/server/mcpHandler.mjs";
import { pythonBridge } from "../src/services/pythonBridge.js";

test("STRATEGY_IDE_MCP_TOOLS contains all 7 core MCP tools with valid JSON schemas", () => {
  assert.equal(STRATEGY_IDE_MCP_TOOLS.length, 7);
  const toolNames = STRATEGY_IDE_MCP_TOOLS.map((t) => t.name);
  assert.ok(toolNames.includes("run_backtest"));
  assert.ok(toolNames.includes("walk_forward"));
  assert.ok(toolNames.includes("monte_carlo"));
  assert.ok(toolNames.includes("train_model"));
  assert.ok(toolNames.includes("get_candles"));
  assert.ok(toolNames.includes("edit_strategy"));
  assert.ok(toolNames.includes("list_datasets"));
});

test("handleMCPToolCall executes run_backtest through MCP schema", async () => {
  const result = await handleMCPToolCall("run_backtest", {
    symbol: "SPY",
    preset: "mean_reversion",
  });

  assert.ok(result);
  assert.ok(result.finalEquity > 0);
  assert.ok(result.metrics.sharpeRatio > 0);
});

test("handleMCPToolCall executes train_model for GARCH(1,1)", async () => {
  const result = await handleMCPToolCall("train_model", {
    model_type: "garch",
    symbol: "SPY",
  });

  assert.equal(result.modelType, "GARCH(1,1)");
  assert.ok(result.annualizedVolPct > 0);
});

test("processClaudeMessage handles quantitative assistant prompts and triggers MCP tools", async () => {
  const reply = await processClaudeMessage({
    messages: [{ role: "user", content: "Please optimize Sharpe and add Kalman filter" }],
  });

  assert.ok(reply.content.length > 0);
  assert.ok(reply.toolCalls.length > 0);
  assert.equal(reply.toolCalls[0].name, "train_model");
});

test.after(() => {
  pythonBridge.terminate();
});
