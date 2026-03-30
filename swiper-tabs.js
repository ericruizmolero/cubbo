

document.addEventListener("DOMContentLoaded", function () {
  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  // ── Clone content from tab panes into swiper ──────────────
  const swiperWrapper = document.querySelector(".client_swiper .swiper-wrapper");
  const tabPanes      = document.querySelectorAll(".client_tabs .w-tab-pane");

  if (!swiperWrapper) {
    console.warn("client_swiper .swiper-wrapper not found");
    return;
  }

  tabPanes.forEach(pane => {
    const slide = document.createElement("div");
    slide.classList.add("swiper-slide");
    slide.innerHTML = pane.innerHTML;
    swiperWrapper.appendChild(slide);
  });

  // ── Init Swiper ───────────────────────────────────────────
  const swiper = new Swiper(".client_swiper", {
    loop:  true,
    speed: 500,
    autoplay: {
      delay:                3000,
      disableOnInteraction: false,
    },
  });

  // ── Equalize client_tab-review heights ───────────────────
  function equalizeReviews() {
    const reviews = document.querySelectorAll(".client_swiper .client_tab-review");
    let maxHeight = 0;

    reviews.forEach(r => {
      r.style.height = "";
      maxHeight = Math.max(maxHeight, r.offsetHeight);
    });

    reviews.forEach(r => { r.style.height = `${maxHeight}px`; });
  }

  // Wait for all swiper images to load before measuring
  const swiperImages = document.querySelectorAll(".client_swiper img");
  let loadedCount    = 0;
  const total        = swiperImages.length;

  if (total === 0) {
    equalizeReviews();
  } else {
    swiperImages.forEach(img => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === total) equalizeReviews();
      } else {
        img.addEventListener("load",  () => { loadedCount++; if (loadedCount === total) equalizeReviews(); });
        img.addEventListener("error", () => { loadedCount++; if (loadedCount === total) equalizeReviews(); });
      }
    });
  }

  window.addEventListener("resize", equalizeReviews);

  // ── Arrows ────────────────────────────────────────────────
  const tabLinks = Array.from(document.querySelectorAll(".client_tab-link"));
  const prevBtn  = document.querySelector(".client_tabs-prev");
  const nextBtn  = document.querySelector(".client_tabs-next");

  function getActiveTabIndex() {
    return tabLinks.findIndex(tab => tab.classList.contains("w--current"));
  }

  function goToTab(index) {
    const circular = (index + tabLinks.length) % tabLinks.length;
    tabLinks[circular].click();
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (isDesktop()) goToTab(getActiveTabIndex() - 1);
      else swiper.slidePrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (isDesktop()) goToTab(getActiveTabIndex() + 1);
      else swiper.slideNext();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  isDesktop() ? goToTab(getActiveTabIndex() - 1) : swiper.slidePrev();
    if (e.key === "ArrowRight") isDesktop() ? goToTab(getActiveTabIndex() + 1) : swiper.slideNext();
  });
});


