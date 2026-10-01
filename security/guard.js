import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MARKER = "[AGENT-BROWSER-TASK]";
const TOKEN_IN_URL = /[?&][^=]+=.{32,}/;
const CREDENTIAL_NAMES = /password|api_key|secret|token|private_key/i;
const SENSITIVE_EXT = /\.(env|pem|key)(?![\w])/i;

function blockedDomains() {
  return (process.env.BLOCKED_DOMAINS ?? "banco,pagamento,financeiro,pix,transferencia")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function auditLogPath() {
  return process.env.AUDIT_LOG || path.join(os.tmpdir(), "browser-mcp-audit.log");
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function checkDomain(url, label) {
  const host = hostOf(url);
  if (!host) return;
  const hit = blockedDomains().find((d) => host.includes(d));
  if (hit) throw new Error(`[guard] Domínio bloqueado (${label}: "${host}" contém "${hit}")`);
}

/**
 * Valida uma chamada de tool antes de qualquer ação no browser.
 * @param {string} tool nome da tool
 * @param {object} input input já validado pelo Zod
 * @param {{currentUrl?: string}} [ctx] URL atual da página, para checar domínio em tools sem `url`
 * @returns {{allowed: true}}
 */
export function validate(tool, input, ctx = {}) {
  const desc = input?.task_description;
  if (typeof desc !== "string" || !desc.includes(MARKER)) {
    throw new Error(`[guard] task_description deve conter o marcador ${MARKER}`);
  }

  if (input.url && TOKEN_IN_URL.test(input.url)) {
    throw new Error("[guard] URL contém possível token/secret em query string (valor >= 32 chars)");
  }

  // Seletores e rótulos que apontam para campos de credencial
  for (const key of ["selector", "aria_label", "text"]) {
    const v = input[key];
    if (typeof v === "string" && CREDENTIAL_NAMES.test(v)) {
      throw new Error(`[guard] Campo "${key}" sugere credencial (password/api_key/secret/token/private_key)`);
    }
  }

  // Extensões sensíveis em qualquer string de destino/valor
  for (const key of ["url", "selector", "value", "filename"]) {
    const v = input[key];
    if (typeof v === "string" && SENSITIVE_EXT.test(v)) {
      throw new Error(`[guard] Extensão de arquivo sensível (.env/.pem/.key) detectada em "${key}"`);
    }
  }

  if (input.url) checkDomain(input.url, "url");
  if (ctx.currentUrl) checkDomain(ctx.currentUrl, "página atual");

  const line = `${new Date().toISOString()} | ${tool} | ${desc.slice(0, 100).replace(/\s+/g, " ")}\n`;
  try {
    fs.appendFileSync(auditLogPath(), line);
  } catch (e) {
    console.error(`[guard] falha ao gravar audit log: ${e.message}`);
  }

  return { allowed: true };
}
