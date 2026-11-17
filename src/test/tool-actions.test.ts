import { describe, expect, it } from "vitest";
import { toolActionUrl } from "@/lib/tools/tool-registry";
import { toolActionIds } from "@/types/tools";

describe("allowlisted Gemini actions", () => {
  it("maps every supported action to an internal route", () => {
    toolActionIds.forEach((id) => expect(toolActionUrl({id})).toMatch(/^\/app\//));
  });

  it("encodes and limits untrusted action context", () => {
    const url=toolActionUrl({id:"open_excuse_court",context:"<script>"+"x".repeat(500)});
    expect(url).not.toContain("<script>");
    expect(decodeURIComponent(url.split("context=")[1])).toHaveLength(300);
  });
});
