import "dotenv/config";
import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { closeBrowser } from "./browser.js";
import * as navigate from "./tools/navigate.js";
import * as click from "./tools/click.js";
import * as fill from "./tools/fill.js";
import * as screenshot from "./tools/screenshot.js";
import * as readPage from "./tools/read_page.js";
import * as waitFor from "./tools/wait_for.js";

const tools = new Map([navigate, click, fill, screenshot, readPage, waitFor].map((t) => [t.name, t]));

const server = new Server({ name: "browser-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...tools.values()].map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: z.toJSONSchema(t.schema, { io: "input" }),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    const tool = tools.get(req.params.name);
    if (!tool) throw new Error(`Tool desconhecida: ${req.params.name}`);
    const input = tool.schema.parse(req.params.arguments ?? {});
    const result = await tool.handler(input);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    const msg = e instanceof z.ZodError ? `Input inválido: ${e.message}` : e.message;
    return { isError: true, content: [{ type: "text", text: msg }] };
  }
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await closeBrowser();
    process.exit(0);
  });
}

await server.connect(new StdioServerTransport());
console.error("[browser-mcp-server] pronto");
