import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validate } from "../security/guard.js";

const TASK = "[AGENT-BROWSER-TASK] teste unitário";
let logFile;

beforeEach(() => {
  logFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "guard-")), "audit.log");
  process.env.AUDIT_LOG = logFile;
  delete process.env.BLOCKED_DOMAINS;
});

afterEach(() => {
  delete process.env.AUDIT_LOG;
  delete process.env.BLOCKED_DOMAINS;
});

const call = (input, ctx) => validate("browser_test", { task_description: TASK, ...input }, ctx);

describe("guard.validate", () => {
  it("permite chamada válida e retorna { allowed: true }", () => {
    assert.deepEqual(call({ url: "https://example.com" }), { allowed: true });
  });

  it("bloqueia task_description sem o marcador", () => {
    assert.throws(() => validate("t", { task_description: "sem marcador" }), /marcador/);
    assert.throws(() => validate("t", {}), /marcador/);
  });

  it("bloqueia token longo em query string, mas aceita valores curtos", () => {
    assert.throws(() => call({ url: `https://example.com/?a=${"x".repeat(32)}` }), /token/i);
    assert.doesNotThrow(() => call({ url: "https://example.com/?page=2" }));
  });

  for (const word of ["password", "API_KEY", "Secret", "token", "private_key"]) {
    it(`bloqueia seletor com nome de credencial (${word})`, () => {
      assert.throws(() => call({ selector: `input[name=${word}]` }), /credencial/);
    });
  }

  for (const target of ["https://x.com/a.env", "https://x.com/cert.pem", "id_rsa.key"]) {
    it(`bloqueia extensão sensível (${target})`, () => {
      assert.throws(() => call({ filename: target }), /sens[ií]vel/);
    });
  }

  it("não confunde .environment com .env", () => {
    assert.doesNotThrow(() => call({ filename: "notes.environment" }));
  });

  it("bloqueia domínios do default de BLOCKED_DOMAINS", () => {
    assert.throws(() => call({ url: "https://meubanco.com.br" }), /Domínio bloqueado/);
  });

  it("respeita BLOCKED_DOMAINS customizado", () => {
    process.env.BLOCKED_DOMAINS = "interno, secreto";
    assert.throws(() => call({ url: "https://app.interno.corp" }), /Domínio bloqueado/);
    assert.doesNotThrow(() => call({ url: "https://meubanco.com.br" }));
  });

  it("bloqueia quando a página atual está em domínio bloqueado", () => {
    assert.throws(() => call({ selector: "#ok" }, { currentUrl: "https://pix.exemplo.com" }), /página atual/);
  });

  it("registra no audit log apenas tasks validadas, truncando em 100 chars", () => {
    call({ task_description: `${TASK} ${"a".repeat(200)}` });
    assert.throws(() => validate("t", { task_description: "ruim" }));
    const lines = fs.readFileSync(logFile, "utf8").trim().split("\n");
    assert.equal(lines.length, 1);
    const [ts, tool, desc] = lines[0].split(" | ");
    assert.ok(!Number.isNaN(Date.parse(ts)));
    assert.equal(tool, "browser_test");
    assert.equal(desc.length, 100);
  });
});
