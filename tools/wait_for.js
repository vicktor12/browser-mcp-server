import { z } from "zod";
import { getBrowser, timeout as defaultTimeout } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_wait_for";
export const description =
  "Aguarda um elemento aparecer, desaparecer ou um texto surgir na página. Útil após ações que disparam carregamentos assíncronos.";
export const schema = z
  .object({
    task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
    selector: z.string().optional(),
    text: z.string().optional(),
    state: z.enum(["visible", "hidden", "attached", "detached"]).default("visible"),
    timeout: z.number().int().positive().optional().describe("ms; default BROWSER_TIMEOUT"),
  })
  .refine((v) => v.selector || v.text, { message: "Informe selector e/ou text" });

export async function handler(input) {
  const page = await getBrowser();
  validate(name, input, { currentUrl: page.url() });

  const timeout = input.timeout ?? defaultTimeout();
  try {
    if (input.selector) await page.waitForSelector(input.selector, { state: input.state, timeout });
    if (input.text) {
      await page.waitForFunction((t) => document.body.innerText.includes(t), input.text, { timeout });
    }
    return { success: true, found: true };
  } catch (e) {
    if (e.name === "TimeoutError") return { success: false, error: `Timeout após ${timeout}ms` };
    throw e;
  }
}
