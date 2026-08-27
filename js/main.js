/* ==========================================================================
   Tem Aí? — interações do protótipo estático
   ========================================================================== */
(function () {
  "use strict";

  const brl = (value) =>
    "R$ " + value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll("#year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Sombra do header ao rolar ---------- */
  const header = document.getElementById("siteHeader");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Toasts ---------- */
  let toastRegion = null;
  function showToast(title, message) {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.className = "toast-region";
      toastRegion.setAttribute("role", "status");
      toastRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(toastRegion);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      "<div>" +
      (title ? "<strong></strong>" : "") +
      "<span></span></div>";
    if (title) toast.querySelector("strong").textContent = title;
    toast.querySelector("span").textContent = message;
    toastRegion.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /* ---------- Elementos de protótipo (forms e botões) ---------- */
  document.querySelectorAll("form[data-proto-msg]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast(form.dataset.protoTitle || "Protótipo", form.dataset.protoMsg);
    });
  });

  document.querySelectorAll("button[data-proto-msg]").forEach((btn) => {
    if (btn.type === "submit") return; // tratado pelo submit do form
    btn.addEventListener("click", () => {
      showToast(btn.dataset.protoTitle || "Protótipo", btn.dataset.protoMsg);
    });
  });

  /* ---------- Botões de favorito ---------- */
  document.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle("active");
    });
  });

  /* ---------- Chips de avaliação (filtros) ---------- */
  document.querySelectorAll(".stars-filter").forEach((group) => {
    group.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        group.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
      });
    });
  });

  /* ---------- Chips de filtros ativos (remoção) ---------- */
  document.querySelectorAll(".active-filters .chip").forEach((chip) => {
    chip.style.cursor = "pointer";
    chip.addEventListener("click", () => chip.remove());
  });

  /* ---------- Slider de distância ---------- */
  const distRange = document.getElementById("distRange");
  const distOut = document.getElementById("distOut");
  if (distRange && distOut) {
    distRange.addEventListener("input", () => {
      distOut.textContent = "até " + distRange.value + " km";
    });
  }

  /* ---------- Contexto de busca (?q=) na página Explorar ---------- */
  const exploreQ = document.getElementById("exploreQ");
  const searchContext = document.getElementById("searchContext");
  if (exploreQ) {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      exploreQ.value = q;
      if (searchContext) {
        searchContext.textContent = 'para "' + q + '" perto de Vila Mariana, São Paulo';
      }
    }
  }

  /* ---------- Galeria do produto ---------- */
  document.querySelectorAll(".gallery-thumbs .thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document
        .querySelectorAll(".gallery-thumbs .thumb")
        .forEach((t) => t.classList.remove("current"));
      thumb.classList.add("current");
    });
  });

  /* ---------- Cálculo da reserva (página de produto) ---------- */
  const bookingBox = document.getElementById("bookingBox");
  if (bookingBox) {
    const pricePerDay = Number(bookingBox.dataset.price) || 25;
    const DEPOSIT = 100;
    const dtStart = document.getElementById("dtStart");
    const dtEnd = document.getElementById("dtEnd");
    const calcDesc = document.getElementById("calcDesc");
    const calcSubtotal = document.getElementById("calcSubtotal");
    const calcFee = document.getElementById("calcFee");
    const calcTotal = document.getElementById("calcTotal");

    const iso = (d) => d.toISOString().slice(0, 10);
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 1);
    const end = new Date(today);
    end.setDate(end.getDate() + 3);

    dtStart.value = iso(start);
    dtEnd.value = iso(end);
    dtStart.min = iso(today);
    dtEnd.min = iso(today);

    function updateCalc() {
      const a = new Date(dtStart.value);
      const b = new Date(dtEnd.value);
      let days = Math.round((b - a) / 86400000);
      if (!dtStart.value || !dtEnd.value || isNaN(days) || days < 1) days = 1;
      const subtotal = pricePerDay * days;
      const fee = Math.round(subtotal * 0.1);
      calcDesc.textContent =
        brl(pricePerDay) + " × " + days + (days === 1 ? " dia" : " dias");
      calcSubtotal.textContent = brl(subtotal);
      calcFee.textContent = brl(fee);
      calcTotal.textContent = brl(subtotal + fee + DEPOSIT);
    }

    dtStart.addEventListener("change", () => {
      if (dtEnd.value && dtEnd.value <= dtStart.value) {
        const next = new Date(dtStart.value);
        next.setDate(next.getDate() + 1);
        dtEnd.value = iso(next);
      }
      dtEnd.min = dtStart.value;
      updateCalc();
    });
    dtEnd.addEventListener("change", updateCalc);
    updateCalc();
  }

  /* ---------- Simulador de ganhos (página de anúncio) ---------- */
  const simPrice = document.getElementById("simPrice");
  const simDays = document.getElementById("simDays");
  const simTotal = document.getElementById("simTotal");
  if (simPrice && simDays && simTotal) {
    const updateSim = () => {
      const price = Math.max(0, Number(simPrice.value) || 0);
      const days = Math.min(30, Math.max(0, Number(simDays.value) || 0));
      simTotal.textContent = brl(price * days);
    };
    simPrice.addEventListener("input", updateSim);
    simDays.addEventListener("input", updateSim);
    updateSim();
  }
})();
