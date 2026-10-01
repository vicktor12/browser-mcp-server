import { z } from "zod";
import { getBrowser, timeout } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_navigate";
export const description =
  "Navega para uma URL no browser. Sempre chame esta tool antes de interagir com qualquer página. Aguarda o carregamento completo.";
export const schema = z.object({
  task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
  url: z.string().url(),
  wait_until: z.enum(["load", "networkidle", "domcontentloaded"]).default("load"),
});

export async function handler(input) {
  validate(name, input);
  const page = await getBrowser();
  await page.goto(input.url, { waitUntil: input.wait_until, timeout: timeout() });
  return { success: true, url: page.url(), title: await page.title() };
}
