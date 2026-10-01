import { z } from "zod";
import { getBrowser } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_fill";
export const description =
  "Preenche um campo de formulário (input, textarea, select). Limpa o campo antes de digitar.";
export const schema = z.object({
  task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
  selector: z.string().describe("Seletor CSS do campo"),
  value: z.string().describe("Valor a preencher"),
  clear_first: z.boolean().default(true),
  press_enter: z.boolean().default(false),
});

export async function handler(input) {
  const page = await getBrowser();
  validate(name, input, { currentUrl: page.url() });

  await page.waitForSelector(input.selector, { state: "visible" });
  if (input.clear_first) await page.fill(input.selector, "");
  await page.fill(input.selector, input.value);
  if (input.press_enter) await page.keyboard.press("Enter");
  return { success: true, field: input.selector, value_length: input.value.length };
}
