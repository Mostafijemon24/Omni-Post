import { describe, expect, it } from "vitest";
import { OmniPostLogic } from "@/lib/omnipost/logic";
import { ROUTES } from "@/lib/routes";

describe("view model", () => {
  it("renders every route without throwing", () => {
    const logic = new OmniPostLogic();
    for (const route of Object.keys(ROUTES)) {
      logic.state.route = route;
      const vm = logic.renderVals();
      expect(vm.pageTitle).toBeTruthy();
    }
  });
  it("routes navigation through the injected navigator instead of mutating state", () => {
    const logic = new OmniPostLogic();
    const seen: string[] = [];
    logic.navigate = (r) => seen.push(r);
    logic.renderVals().goStudio();
    expect(seen).toEqual(["studio"]);
    expect(logic.state.route).toBe("dashboard");
  });
});

describe("file import", () => {
  const logic = new OmniPostLogic();
  it("parses quoted CSV fields", () => {
    expect(logic.parseCSV('a,b\n"x, y","he said ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
  });
  it("auto-maps the sample year plan and flags its deliberate mistakes", () => {
    const imp = logic.sampleImport();
    expect(imp.rows).toHaveLength(365);
    const map = imp.headers.map((h: string) => logic.matchField(h));
    expect(map).toContain("Scheduled date");
    const result = logic.validateImport(imp, map, "A");
    expect(result.posts.length).toBeGreaterThan(365);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe("adapter wiring", () => {
  it("runs generation through the AI adapter and clears the busy flag", async () => {
    const logic = new OmniPostLogic();
    logic.renderVals().generate();
    expect(logic.state.generating).toBe(true);
    await new Promise((r) => setTimeout(r, 1600));
    expect(logic.state.generating).toBe(false);
  });
  it("marks a provider connection as tested only after the adapter validates it", async () => {
    const logic = new OmniPostLogic();
    logic.renderVals().wizTest();
    expect(logic.state.wizTested).toBe(false);
    await new Promise((r) => setTimeout(r, 1100));
    expect(logic.state.wizTested).toBe(true);
  });
});
