import { z } from "zod";
import { getBrowser } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_click";
export const description =
  "Clica em um elemento da página. Pode encontrar o elemento por seletor CSS, por texto visível ou por aria-label. Tenta as estratégias em ordem até encontrar.";
export const schema = z
  .object({
    task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
    selector: z.string().optional().describe("Seletor CSS"),
    text: z.string().optional().describe("Texto visível do elemento"),
    aria_label: z.string().optional().describe("aria-label do elemento"),
  })
  .refine((v) => v.selector || v.text || v.aria_label, {
    message: "Informe ao menos um de: selector, text, aria_label",
  });

export async function handler(input) {
  const page = await getBrowser();
  validate(name, input, { currentUrl: page.url() });

  const candidates = [];
  if (input.selector) candidates.push([`selector "${input.selector}"`, page.locator(input.selector)]);
  if (input.text) candidates.push([`texto "${input.text}"`, page.getByText(input.text, { exact: false })]);
  if (input.aria_label) {
    candidates.push([`aria-label "${input.aria_label}"`, page.getByRole("button", { name: input.aria_label })]);
    candidates.push([`aria-label "${input.aria_label}"`, page.getByLabel(input.aria_label)]);
  }

  for (const [label, loc] of candidates) {
    if ((await loc.count()) === 0) continue;
    const el = loc.first();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    return { success: true, clicked: label };
  }
  throw new Error("Nenhum elemento encontrado pelas estratégias informadas");
}
