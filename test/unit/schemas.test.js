import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import * as navigate from "../../tools/navigate.js";
import * as click from "../../tools/click.js";
import * as fill from "../../tools/fill.js";
import * as screenshot from "../../tools/screenshot.js";
import * as readPage from "../../tools/read_page.js";
import * as waitFor from "../../tools/wait_for.js";

const T = "[AGENT-BROWSER-TASK] x";
const tools = [navigate, click, fill, screenshot, readPage, waitFor];

describe("tools", () => {
  it("têm nome único, descrição e schema convertível para JSON Schema", () => {
    const names = tools.map((t) => t.name);
    assert.equal(new Set(names).size, tools.length);
    for (const t of tools) {
      assert.match(t.name, /^browser_/);
      assert.ok(t.description.length > 0);
      assert.equal(z.toJSONSchema(t.schema, { io: "input" }).type, "object");
    }
  });

  it("navigate: exige URL válida e aplica default de wait_until", () => {
    assert.throws(() => navigate.schema.parse({ task_description: T, url: "nao-e-url" }));
    assert.equal(navigate.schema.parse({ task_description: T, url: "https://a.com" }).wait_until, "load");
  });

  it("click: exige ao menos um de selector/text/aria_label", () => {
    assert.throws(() => click.schema.parse({ task_description: T }));
    assert.doesNotThrow(() => click.schema.parse({ task_description: T, text: "OK" }));
  });

  it("wait_for: exige selector ou text", () => {
    assert.throws(() => waitFor.schema.parse({ task_description: T }));
    assert.equal(waitFor.schema.parse({ task_description: T, text: "a" }).state, "visible");
  });

  it("fill e read_page aplicam defaults", () => {
    const f = fill.schema.parse({ task_description: T, selector: "#a", value: "v" });
    assert.equal(f.clear_first, true);
    assert.equal(f.press_enter, false);
    assert.equal(readPage.schema.parse({ task_description: T }).max_text_length, 3000);
  });
});
