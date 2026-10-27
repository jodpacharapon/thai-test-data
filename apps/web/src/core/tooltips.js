// Info tooltips: hover/focus shows them; a tap toggles them on touch screens.
// The tooltip is shifted left when it would run past the right edge of the screen.

const placeTip = (e) => {
  const btn = e.target.closest?.(".info");
  if (!btn) return;
  const width = Math.min(280, innerWidth - 32);
  const left = btn.getBoundingClientRect().left - 8;
  const overflow = left + width - (document.documentElement.clientWidth - 12);
  btn.style.setProperty("--tip-x", `${-8 - Math.max(0, overflow)}px`);
};

export function initTooltips() {
  document.addEventListener("pointerover", placeTip);
  document.addEventListener("focusin", placeTip);
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".info");
    document.querySelectorAll(".info.open").forEach((b) => { if (b !== btn) b.classList.remove("open"); });
    if (btn) btn.classList.toggle("open");
  });
}
