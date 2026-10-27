// Entry point: wire up the shared chrome, then each view.
import { initTheme } from "./core/theme.js";
import { initViews } from "./core/views.js";
import { initTooltips } from "./core/tooltips.js";
import { initGenerator } from "./generator/index.js";
import { initValidator } from "./validator/index.js";
import { initReport } from "./report/index.js";

initTheme();
initTooltips();
const generatorState = initGenerator();
initValidator();
initReport(generatorState);
initViews();
