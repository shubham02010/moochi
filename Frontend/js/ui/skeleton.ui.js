export function showHeroSkeleton() {
  const hero = document.getElementById("hero");

  if (hero.querySelector(".hero-skeleton")) return;

  const skeleton = document.createElement("div");
  skeleton.className = "hero-skeleton skeleton";

  skeleton.innerHTML = `
    <div class="hero-content">
      <div class="title skeleton"></div>
      <div class="text skeleton"></div>
      <div class="text skeleton"></div>
    </div>
  `;

  hero.appendChild(skeleton);
}

export function hideHeroSkeleton() {
  const skeleton = document.querySelector(".hero-skeleton");
  if (skeleton) skeleton.remove();
}

/* ===== ROW SKELETONS ===== */
export function showRowSkeletons(count = 6, container = document.getElementById("rows")) {
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const row = document.createElement("div");
    row.className = "row-skeleton";

    row.innerHTML = `
      <h2 class="skeleton" style="width:200px;height:20px;margin-left:20px;"></h2>
      <div class="row-list">
        ${Array(8)
          .fill(0)
          .map(() => `<div class="card skeleton"></div>`)
          .join("")}
      </div>
    `;

    container.appendChild(row);
  }
}
