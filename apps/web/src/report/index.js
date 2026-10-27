// Report: build a prefilled GitHub issue URL (issue forms accept field ids as query params).
import { $ } from "../core/dom.js";
import { onViewShown } from "../core/views.js";

const ISSUE_URL = "https://github.com/jodpacharapon/thai-test-data/issues/new";
const reportKind = () => document.querySelector('input[name="kind"]:checked').value;

/** @param {() => { type: { key: string, title: string }, settings: object, count: string, seed: string, rows: { value: unknown }[] }} generatorState */
export function initReport(generatorState) {
  const contextText = () => {
    const g = generatorState();
    return [
      `Data type: ${g.type.title} (${g.type.key})`,
      `Settings: ${JSON.stringify(g.settings)}`,
      `Count: ${g.count || 10}, Seed: ${g.seed || "(random)"}`,
      `Example values: ${g.rows.slice(0, 3).map((r) => JSON.stringify(r.value)).join(", ")}`,
    ].join("\n");
  };

  // Keep the context block in the textarea in sync with the checkbox, so what you see is what gets sent.
  function setContext(on) {
    const steps = $("bugSteps");
    const base = steps.value.replace(/\n*Data type:[\s\S]*$/, "");
    steps.value = on ? `${base}\n\n${contextText()}` : base;
    updateIssueLink();
  }

  function fillContext() {
    const steps = $("bugSteps");
    if (!steps.dataset.edited) steps.value = `1. เปิด Generator เลือก ${generatorState().type.title}\n2. ตั้งค่าตามด้านล่าง แล้วกด Generate\n3. `;
    setContext($("bugContext").checked);
  }

  function updateIssueLink() {
    const q = new URLSearchParams();
    if (reportKind() === "bug") {
      q.set("template", "bug_report.yml");
      q.set("title", $("bugTitle").value.trim() || "Bug: ");
      q.set("what", $("bugWhat").value);
      q.set("steps", $("bugSteps").value);
      q.set("where", "Web app");
      if ($("bugContext").checked) q.set("version", navigator.userAgent);
    } else {
      q.set("template", "feature_request.yml");
      q.set("title", $("featTitle").value.trim() || "Feature: ");
      q.set("need", $("featNeed").value);
      q.set("rule", $("featRule").value);
      q.set("usecase", $("featUse").value);
    }
    $("openIssue").href = `${ISSUE_URL}?${q}`;
  }

  document.querySelectorAll('input[name="kind"]').forEach((r) => r.addEventListener("change", () => {
    document.querySelectorAll(".field-group").forEach((g) => { g.hidden = g.dataset.for !== reportKind(); });
    updateIssueLink();
  }));
  $("bugSteps").addEventListener("input", () => { $("bugSteps").dataset.edited = "1"; });
  $("bugContext").addEventListener("change", (e) => setContext(e.target.checked));
  $("reportForm").addEventListener("input", updateIssueLink);
  $("reportForm").addEventListener("submit", (e) => e.preventDefault());
  onViewShown((name) => { if (name === "report") fillContext(); });
  fillContext();
}
