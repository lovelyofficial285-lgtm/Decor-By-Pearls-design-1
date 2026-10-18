(function () {
  var header = document.getElementById("siteHeader");
  if (!header) return;
  var toggler = document.querySelector(".site-nav__toggler");
  var menu = document.getElementById("mobileMenu");
  var overlay = document.getElementById("mobileMenuOverlay");
  var closeBtn = menu.querySelector(".mobile-menu__close");

  /* scrolled state */
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 60); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* active page */
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var isLocation = /-wedding-planner\.html$/.test(file);
  document.querySelectorAll("[data-page]").forEach(function (a) {
    var p = a.getAttribute("data-page");
    if (p === file || (p === "services.html" && isLocation)) a.setAttribute("aria-current", "page");
  });

  /* desktop dropdown */
  var dd = document.getElementById("navDd");
  var caret = dd.querySelector(".nav-dd__caret");
  function setDd(o) { dd.classList.toggle("is-open", o); caret.setAttribute("aria-expanded", String(o)); }
  caret.addEventListener("click", function (e) { e.stopPropagation(); setDd(!dd.classList.contains("is-open")); });
  document.addEventListener("click", function (e) { if (!dd.contains(e.target)) setDd(false); });

  /* mobile menu */
  function setMenu(o) {
    menu.classList.toggle("is-open", o);
    overlay.classList.toggle("is-open", o);
    menu.setAttribute("aria-hidden", String(!o));
    toggler.setAttribute("aria-expanded", String(o));
    document.body.style.overflow = o ? "hidden" : "";
  }
  toggler.addEventListener("click", function () { setMenu(true); });
  closeBtn.addEventListener("click", function () { setMenu(false); });
  overlay.addEventListener("click", function () { setMenu(false); });

  /* mobile services accordion */
  var mm = menu.querySelector(".mm-dd"), mmBtn = mm.querySelector(".mm-dd__btn");
  mmBtn.addEventListener("click", function () {
    var o = !mm.classList.contains("is-open");
    mm.classList.toggle("is-open", o);
    mmBtn.setAttribute("aria-expanded", String(o));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setDd(false); setMenu(false); }
  });
})();