import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { localizeDocument, translateUi } from "@/i18n/ui-translations";

describe("multilingual UI catalog", () => {
  afterEach(() => { cleanup(); document.body.innerHTML=""; });

  it("updates visible and accessible copy without changing control values", () => {
    document.body.innerHTML='<button aria-label="Send message">Open tool</button><option value="per 100 g/ml">per 100 g/ml</option>';
    localizeDocument("zh-CN");
    expect(document.querySelector("button")?.textContent).toBe("打开工具");
    expect(document.querySelector("button")?.getAttribute("aria-label")).toBe("发送消息");
    expect(document.querySelector("option")?.getAttribute("value")).toBe("per 100 g/ml");
    localizeDocument("ar-AE");
    expect(document.querySelector("button")?.textContent).toBe("فتح الأداة");
    localizeDocument("en");
    expect(document.querySelector("button")?.textContent).toBe("Open tool");
  });

  it("localises destructive confirmations before they open", () => {
    expect(translateUi("hi-IN","Delete this browser's UNFIT AI conversation history?")).toContain("UNFIT AI");
    expect(translateUi("hi-IN","Delete this browser's UNFIT AI conversation history?")).not.toMatch(/^Delete/);
  });
});
