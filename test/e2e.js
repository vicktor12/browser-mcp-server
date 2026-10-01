import "dotenv/config";
import * as navigate from "../tools/navigate.js";
import * as readPage from "../tools/read_page.js";
import * as screenshot from "../tools/screenshot.js";
import * as click from "../tools/click.js";
import * as waitFor from "../tools/wait_for.js";
import * as fill from "../tools/fill.js";
import { closeBrowser } from "../browser.js";

const T = "[AGENT-BROWSER-TASK] Teste automatizado do servidor";
const parse = (tool, input) => tool.schema.parse({ task_description: T, ...input });
const expectBlocked = async (label, fn) => {
  try {
    await fn();
    console.log(`FALHA: ${label} não foi bloqueado`);
    process.exitCode = 1;
  } catch (e) {
    console.log(`OK bloqueado (${label}): ${e.message}`);
  }
};

try {
  console.log("navigate:", await navigate.handler(parse(navigate, { url: "https://example.com" })));
  const page = await readPage.handler(parse(readPage, {}));
  console.log("read_page:", page.title, "|", page.text.slice(0, 200), "| links:", page.links.length);
  console.log("wait_for:", await waitFor.handler(parse(waitFor, { text: "documentation examples" })));
  console.log("wait_for (timeout):", await waitFor.handler(parse(waitFor, { selector: "#nao-existe", timeout: 1000 })));
  console.log("screenshot:", await screenshot.handler(parse(screenshot, { filename: "test" })));
  console.log("click:", await click.handler(parse(click, { text: "Learn more" })));
  await navigate.handler(parse(navigate, { url: "https://example.com" }));

  await expectBlocked("sem marcador", () =>
    navigate.handler({ task_description: "x", url: "https://example.com", wait_until: "load" }));
  await expectBlocked("domínio financeiro", () => navigate.handler(parse(navigate, { url: "https://meubanco.com.br" })));
  await expectBlocked("token em URL", () =>
    navigate.handler(parse(navigate, { url: "https://example.com/?a=" + "x".repeat(40) })));
  await expectBlocked("campo password", () => fill.handler(parse(fill, { selector: "input[name=password]", value: "x" })));
} finally {
  await closeBrowser();
}
