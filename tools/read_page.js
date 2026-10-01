import { z } from "zod";
import { getBrowser } from "../browser.js";
import { validate } from "../security/guard.js";

export const name = "browser_read_page";
export const description =
  "Lê o conteúdo atual da página: título, URL, texto visível e lista dos links disponíveis. Usar para entender o estado da página antes de agir.";
export const schema = z.object({
  task_description: z.string().describe("Deve conter [AGENT-BROWSER-TASK] + descrição da ação"),
  include_links: z.boolean().default(true),
  max_text_length: z.number().int().positive().default(3000),
});

export async function handler(input) {
  const page = await getBrowser();
  validate(name, input, { currentUrl: page.url() });

  const title = await page.title();
  const url = page.url();
  const full = await page.evaluate(() => document.body.innerText);
  const text = full.slice(0, input.max_text_length);
  const result = { title, url, text, truncated: full.length > text.length };
  if (input.include_links) {
    result.links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .slice(0, 30)
        .map((a) => ({ href: a.href, text: a.innerText.trim().slice(0, 100) })),
    );
  }
  return result;
}
