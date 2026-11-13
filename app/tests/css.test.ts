import { describe, expect, it } from "vitest";
import { css } from "@/lib/css";

describe("css()", () => {
  it("converts declarations to a React style object", () => {
    expect(css("font-size:13px; border-radius:8px; -webkit-font-smoothing:antialiased")).toEqual({
      fontSize: "13px",
      borderRadius: "8px",
      WebkitFontSmoothing: "antialiased",
    });
  });
  it("keeps semicolons and colons inside functions and quotes", () => {
    expect(css("background:url('data:image/png;base64,AA'); font-family:'Geist Mono',monospace")).toEqual({
      background: "url('data:image/png;base64,AA')",
      fontFamily: "'Geist Mono',monospace",
    });
  });
  it("lets later declarations win and skips empty ones", () => {
    expect(css("color:red; ; color:blue; width:")).toEqual({ color: "blue" });
  });
  it("preserves custom properties", () => {
    expect(css("--x:1; color:var(--x)")).toEqual({ "--x": "1", color: "var(--x)" });
  });
});
