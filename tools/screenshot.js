import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { getBrowser } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_screenshot";
export const description =
  "Tira screenshot da página atual e salva em disco. Usar para confirmar o resultado de ações ou capturar estado de erro.";
export const schema = z.object({
  task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
  filename: z.string().optional().describe("Nome do arquivo sem extensão; default: timestamp"),
  full_page: z.boolean().default(false),
});

export async function handler(input) {
  const page = await getBrowser();
  validate(name, input, { currentUrl: page.url() });

  const dir = process.env.SCREENSHOTS_DIR || path.join(os.tmpdir(), "browser-mcp-screenshots");
  fs.mkdirSync(dir, { recursive: true });
  // basename evita path traversal via filename
  const base = path.basename(input.filename || String(Date.now()));
  const file = path.join(dir, `${base}.png`);
  await page.screenshot({ path: file, fullPage: input.full_page });
  return { success: true, path: file, url: page.url() };
}
