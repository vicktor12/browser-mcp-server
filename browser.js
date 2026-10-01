import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

let context = null;
let page = null;

export const timeout = () => Number(process.env.BROWSER_TIMEOUT) || 15000;

function userDataDir() {
  if (process.env.CHROME_USER_DATA_DIR) return process.env.CHROME_USER_DATA_DIR;
  // Fallback: perfil dedicado (sem sessões do usuário), para não falhar silenciosamente
  const dir = path.join(os.tmpdir(), "browser-mcp-profile");
  fs.mkdirSync(dir, { recursive: true });
  console.error(`[browser] CHROME_USER_DATA_DIR vazio; usando perfil dedicado em ${dir}`);
  return dir;
}

/** Retorna a page ativa, criando o contexto na primeira chamada. */
export async function getBrowser() {
  if (page && !page.isClosed()) return page;

  if (!context) {
    const args = ["--no-first-run", "--no-default-browser-check"];
    if (process.env.CHROME_PROFILE) args.push(`--profile-directory=${process.env.CHROME_PROFILE}`);
    context = await chromium.launchPersistentContext(userDataDir(), {
      channel: "chrome",
      headless: (process.env.BROWSER_HEADLESS ?? "false").toLowerCase() === "true",
      args,
      timeout: timeout(),
    });
    context.on("close", () => {
      context = null;
      page = null;
    });
  }

  page = context.pages()[0] ?? (await context.newPage());
  page.setDefaultTimeout(timeout());
  return page;
}

export async function closeBrowser() {
  if (context) await context.close().catch(() => {});
  context = null;
  page = null;
}
