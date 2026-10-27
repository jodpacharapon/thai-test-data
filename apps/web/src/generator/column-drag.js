// Header interactions for the result table: drag a header to move its column, drag its right
// edge to change the width, or press Alt + ← / → on a focused header to move it with the keyboard.

// Movement below this many px is a click, not a drag.
const DRAG_THRESHOLD_PX = 5;
export const MIN_COLUMN_PX = 60;

/**
 * @param {HTMLElement} thead
 * @param {object} handlers
 * @param {(col: string, to: number) => void} handlers.onMove `to` is the new position among movable columns
 * @param {(col: string, px: number) => void} handlers.onResize called while dragging
 * @param {() => void} handlers.onResizeEnd
 */
export function enableColumnDrag(thead, { onMove, onResize, onResizeEnd }) {
  const movable = () => [...thead.querySelectorAll("th[data-c]")];
  const clearMarks = () => thead.querySelectorAll(".dragging, .drop-before, .drop-after")
    .forEach((th) => th.classList.remove("dragging", "drop-before", "drop-after"));

  // Insertion point for pointer x: before the first header whose middle is right of x.
  function dropIndex(x) {
    const heads = movable();
    const at = heads.findIndex((th) => { const r = th.getBoundingClientRect(); return x < r.left + r.width / 2; });
    return at === -1 ? heads.length : at;
  }

  function follow(e, onDrag, onDone) {
    thead.setPointerCapture(e.pointerId);
    const move = (ev) => onDrag(ev);
    const up = (ev) => {
      thead.removeEventListener("pointermove", move);
      thead.removeEventListener("pointerup", up);
      thead.removeEventListener("pointercancel", up);
      onDone(ev);
    };
    thead.addEventListener("pointermove", move);
    thead.addEventListener("pointerup", up);
    thead.addEventListener("pointercancel", up);
  }

  function startResize(e, th) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = th.getBoundingClientRect().width;
    thead.classList.add("resizing");
    follow(e, (ev) => onResize(th.dataset.c, Math.max(MIN_COLUMN_PX, Math.round(startW + ev.clientX - startX))), () => {
      thead.classList.remove("resizing");
      onResizeEnd();
    });
  }

  function startMove(e, th) {
    const startX = e.clientX;
    const from = movable().indexOf(th);
    let dragging = false;
    follow(e, (ev) => {
      if (!dragging && Math.abs(ev.clientX - startX) < DRAG_THRESHOLD_PX) return;
      dragging = true;
      clearMarks();
      th.classList.add("dragging");
      const at = dropIndex(ev.clientX);
      const heads = movable();
      if (at < heads.length) heads[at].classList.add("drop-before");
      else heads.at(-1).classList.add("drop-after");
    }, (ev) => {
      clearMarks();
      if (!dragging || ev.type === "pointercancel") return;
      const at = dropIndex(ev.clientX);
      const to = at > from ? at - 1 : at;
      if (to !== from) onMove(th.dataset.c, to);
    });
  }

  thead.addEventListener("pointerdown", (e) => {
    const th = e.target.closest("th[data-c]");
    if (!th || e.button !== 0) return;
    if (e.target.closest(".col-resize")) startResize(e, th);
    else startMove(e, th);
  });

  thead.addEventListener("keydown", (e) => {
    const th = e.target.closest("th[data-c]");
    if (!th || !e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    const from = movable().indexOf(th);
    const to = from + (e.key === "ArrowLeft" ? -1 : 1);
    if (to < 0 || to >= movable().length) return;
    onMove(th.dataset.c, to);
    thead.querySelector(`th[data-c="${CSS.escape(th.dataset.c)}"]`)?.focus();
  });
}
