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

  it("translates entries pushed late and placeholder templates in every locale", () => {
    expect(translateUi("ar-AE","FRIDGE INVESTIGATION")).toBe("تحقيق الثلاجة");
    expect(translateUi("zh-CN","savage")).toBe("毒舌");
    expect(translateUi("zh-CN","3 related mission records: 1 completed and 2 skipped.")).toBe("3 条相关任务记录：1 条已完成，2 条已跳过。");
    expect(translateUi("yue-Hant","Forgot; barrier selected: I forget.")).toBe("唔記得咗；所揀障礙：我會唔記得。");
    expect(translateUi("hi-IN","savage mode")).toBe("तीखा मोड");
  });

  it("matches multi-line titles and restores the original text in English", () => {
    document.body.innerHTML="<h2>THE RECEIPTS\nDON'T LIE.</h2>";
    localizeDocument("zh-CN");
    expect(document.querySelector("h2")?.textContent).toBe("证据不会说谎。");
    localizeDocument("en");
    expect(document.querySelector("h2")?.textContent).toBe("THE RECEIPTS\nDON'T LIE.");
  });
});
