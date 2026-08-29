import test from "node:test";
import assert from "node:assert/strict";
import { BLOOMBERG_COMMANDS } from "../src/services/bloombergCommands.js";

test("BLOOMBERG_COMMANDS contains core Bloomberg function codes", () => {
  assert.ok(BLOOMBERG_COMMANDS.length >= 10, "Expected at least 10 Bloomberg commands");

  const codes = BLOOMBERG_COMMANDS.map((c) => c.code);
  assert.ok(codes.includes("ALLQ"), "Missing ALLQ command");
  assert.ok(codes.includes("WIRP"), "Missing WIRP command");
  assert.ok(codes.includes("BLOT"), "Missing BLOT command");
  assert.ok(codes.includes("OMST"), "Missing OMST command");
  assert.ok(codes.includes("FXFA"), "Missing FXFA command");
  assert.ok(codes.includes("VAR"), "Missing VAR command");
  assert.ok(codes.includes("AML"), "Missing AML command");

  BLOOMBERG_COMMANDS.forEach((cmd) => {
    assert.ok(cmd.code, "Command code required");
    assert.ok(cmd.name, "Command name required");
    assert.ok(cmd.category, "Command category required");
  });
});
