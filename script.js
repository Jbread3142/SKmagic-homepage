const DATA = window.PRODUCT_DATA || {};

const CATEGORY_META = {
  water: {
    label: "정수기",
    eyebrow: "Water Purifier",
    page: "water-purifier.html",
  },
  air: {
    label: "공기청정기",
    eyebrow: "Air Purifier",
    page: "air-purifier.html",
  },
  bidet: {
    label: "비데",
    eyebrow: "Bidet",
    page: "bidet.html",
  },
  sleep: {
    label: "매트리스",
    eyebrow: "Sleep Care",
    page: "sleep-care.html",
  },
};

const won = new Intl.NumberFormat("ko-KR");
const menuToggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".site-header");
const detailSection = document.querySelector("#productDetail");
const detailImage = document.querySelector("#detailImage");
const detailName = document.querySelector("#detailName");
const detailModel = document.querySelector("#detailModel");
const detailPrice = document.querySelector("#detailPrice");

function syncHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

function formatPrice(price) {
  return `${won.format(price)}원`;
}

function allProducts() {
  return Object.values(DATA).flat();
}

function productHref(product) {
  if (product.model === "WPU-IAC606") {
    return "product-detail-wpu-iac606.html";
  }
  if (product.category === "공기청정기") {
    return `product-detail-air.html?id=${product.id}`;
  }
  if (String(product.id).startsWith("G")) {
    return `product-detail-water.html?id=${product.id}`;
  }
  if (product.category === "정수기" || product.category === "비데") {
    return `product-detail-${product.id}.html?id=${product.id}`;
  }
  return `#product-${product.id}`;
}

function productTitleParts(product) {
  const model = product.model || "";
  const escapedModel = model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const name = model
    ? product.name.replace(new RegExp(`\\s*${escapedModel}\\s*$`), "").trim()
    : product.name;

  return {
    name: name || product.name,
    model,
  };
}

function productCard(product, variant = "best") {
  const original = product.originalPrice
    ? `<small class="original-price">${formatPrice(product.originalPrice)}</small>`
    : "";
  const title = productTitleParts(product);
  const model = title.model ? `<span class="product-model">${title.model}</span>` : "";
  const benefit = product.benefit
    ? `<div class="product-benefit">${product.benefit}</div>`
    : "";

  return `
    <article class="product-card ${variant}">
      <a class="product-image" href="${productHref(product)}" aria-label="${product.name} 상세 보기">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="product-body">
        <h3><span class="product-name">${title.name}</span>${model}</h3>
        ${benefit}
        <div class="product-price">${formatPrice(product.price)}${original}</div>
      </div>
    </article>
  `;
}

function bestItems(key) {
  return (DATA[key] || []).slice(0, 4);
}

function monthlyItems() {
  return [
    ...(DATA.water || []).slice(0, 2),
    ...(DATA.air || []).slice(0, 1),
    ...(DATA.sleep || []).slice(0, 1),
  ].slice(0, 4);
}

function renderHome() {
  const sections = {
    waterBest: bestItems("water"),
    airBest: bestItems("air"),
    bidetBest: bestItems("bidet"),
    monthlyBest: monthlyItems(),
  };

  document.querySelectorAll("[data-section]").forEach((target) => {
    const data = sections[target.dataset.section] || [];
    target.innerHTML = data.map((product) => productCard(product, "best")).join("");
  });
}

function renderCategoryPage() {
  const key = document.body.dataset.category;
  if (!key) return;

  const meta = CATEGORY_META[key];
  const products = DATA[key] || [];
  const grid = document.querySelector("[data-product-grid]");
  const count = document.querySelector("[data-product-count]");

  if (grid) {
    grid.innerHTML = products.map((product) => productCard(product, "listing")).join("");
  }
  if (count && meta) {
    count.textContent = `${meta.label} 제품 ${products.length}개를 반영했습니다.`;
  }
}

function renderDetail(product) {
  if (!detailSection || !product) {
    detailSection?.classList.add("hidden");
    return;
  }

  detailImage.src = product.image;
  detailImage.alt = product.name;
  detailName.textContent = product.name;
  detailModel.textContent = product.model ? `모델명 ${product.model}` : product.category;
  detailPrice.textContent = formatPrice(product.price);
  detailSection.classList.remove("hidden");
  detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function planByTerm(plans = []) {
  return plans.reduce((acc, plan) => {
    acc[plan.term] = plan;
    return acc;
  }, {});
}

function renderPlanRow(basePlan, tradePlan) {
  const trade = tradePlan
    ? `<i></i><strong class="trade-label">타사보상 <em>월</em></strong><span>${formatPrice(tradePlan.price)}</span>`
    : "";
  return `
    <section>
      <h3>${basePlan.term}</h3>
      <ul>
        <li><strong><em>월</em></strong><span>${formatPrice(basePlan.price)}</span>${trade}</li>
      </ul>
    </section>
  `;
}

function renderRentalPanel(key, plans = [], tradePlans = [], activeKey = "visit") {
  if (!plans.length) return "";
  const tradeByTerm = planByTerm(tradePlans);
  return `
    <div class="rental-panel${key === activeKey ? " is-active" : ""}" data-rental-panel="${key}">
      ${plans.map((plan) => renderPlanRow(plan, tradeByTerm[plan.term])).join("")}
    </div>
  `;
}

function rentalLabel(product, key) {
  return product.rentalLabels?.[key] || (key === "self" ? "셀프관리" : "방문관리");
}

function renderRentalGuide(guide, product) {
  const plans = product.rentalPlans || {};
  const hasVisit = (plans.visit || []).length > 0;
  const hasSelf = (plans.self || []).length > 0;
  const activeRentalType = hasVisit ? "visit" : "self";
  const tabButtons = [
    hasVisit ? `<button class="${activeRentalType === "visit" ? "is-active" : ""}" type="button" data-rental-tab="visit">${rentalLabel(product, "visit")}</button>` : "",
    hasSelf ? `<button class="${activeRentalType === "self" ? "is-active" : ""}" type="button" data-rental-tab="self">${rentalLabel(product, "self")}</button>` : "",
  ].join("");

  guide.innerHTML = `
    <div class="rental-type-tabs" role="tablist" aria-label="관리 방식 선택">${tabButtons}</div>
    ${renderRentalPanel("visit", plans.visit || [], plans.visitTrade || [], activeRentalType)}
    ${renderRentalPanel("self", plans.self || [], plans.selfTrade || [], activeRentalType)}
  `;
}

function renderWaterDetailPage() {
  if (document.body.dataset.page !== "water-detail") return;

  const id = new URLSearchParams(location.search).get("id");
  const product = (DATA.water || []).find((item) => item.id === id) || (DATA.water || [])[0];
  if (!product) return;

  document.title = `${product.name} ${product.model} | 세모가 - SK매직 다이렉트`;

  const image = document.querySelector("[data-water-detail-image]");
  const title = document.querySelector("[data-water-detail-title]");
  const badges = document.querySelector("[data-water-detail-badges]");
  const guide = document.querySelector("[data-water-rental-guide]");
  const detailStack = document.querySelector("[data-water-detail-stack]");
  const plans = product.rentalPlans || {};

  if (image) {
    image.src = product.image;
    image.alt = `${product.name} ${product.model}`;
  }
  if (title) {
    title.innerHTML = `${product.name}<span>${product.model}</span>`;
  }
  if (badges) {
    badges.innerHTML = [
      product.benefit ? `<span>${product.benefit.replace(/\s*,\s*/g, " / ")}</span>` : "",
      (plans.visitTrade || plans.selfTrade) ? `<span class="light">타사보상할인</span>` : "",
    ].join("");
  }
  if (guide) {
    renderRentalGuide(guide, product);
  }
  if (detailStack) {
    detailStack.innerHTML = product.detailImage
      ? `<img src="${product.detailImage}" alt="${product.name} ${product.model} 상세 이미지">`
      : `<p class="detail-placeholder">상세 이미지는 준비 중입니다.</p>`;
  }
}

function renderAirDetailPage() {
  if (document.body.dataset.page !== "air-detail") return;

  const id = new URLSearchParams(location.search).get("id");
  const product = (DATA.air || []).find((item) => item.id === id) || (DATA.air || [])[0];
  if (!product) return;

  document.title = `${product.name} ${product.model} | 세모가 - SK매직 다이렉트`;

  const image = document.querySelector("[data-air-detail-image]");
  const title = document.querySelector("[data-air-detail-title]");
  const badges = document.querySelector("[data-air-detail-badges]");
  const guide = document.querySelector("[data-air-rental-guide]");
  const detailStack = document.querySelector("[data-air-detail-stack]");

  if (image) {
    image.src = product.image;
    image.alt = `${product.name} ${product.model}`;
  }
  if (title) {
    title.innerHTML = `${product.name}<span>${product.model}</span>`;
  }
  if (badges) {
    badges.innerHTML = product.benefit ? `<span>${product.benefit}</span>` : "";
  }
  if (guide) {
    renderRentalGuide(guide, product);
  }
  if (detailStack) {
    detailStack.innerHTML = product.detailImage
      ? `<img src="${product.detailImage}" alt="${product.name} ${product.model} 상세 이미지">`
      : `<p class="detail-placeholder">상세 이미지는 준비 중입니다.</p>`;
  }
}

function bindRentalTabs() {
  const tabs = document.querySelectorAll("[data-rental-tab]");
  const panels = document.querySelectorAll("[data-rental-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.rentalTab;
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.rentalPanel === target);
      });
    });
  });
}

function syncRoute() {
  const match = location.hash.match(/^#product-(.+)$/);
  if (!match) return;
  renderDetail(allProducts().find((product) => product.id === match[1]));
}

menuToggle?.addEventListener("click", () => {
  header.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".main-nav a")) {
    header.classList.remove("open");
  }
});

window.addEventListener("hashchange", syncRoute);
window.addEventListener("scroll", syncHeaderState, { passive: true });

renderHome();
renderCategoryPage();
renderWaterDetailPage();
renderAirDetailPage();
bindRentalTabs();
syncRoute();
syncHeaderState();



