import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN-0pAeMLXcVov40lmQ7DV_KbYP6hjzQI",
  authDomain: "decor-by-pearls.firebaseapp.com",
  projectId: "decor-by-pearls",
  storageBucket: "decor-by-pearls.firebasestorage.app",
  messagingSenderId: "815568698743",
  appId: "1:815568698743:web:cf842cf99744abe7edf572"
};

const SITE = "https://decorbypearls.com";
const BRAND = "Decor By Pearls";
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const slugify = (s) => String(s).toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const LEGACY_TITLES = {
  1: "Why October to February Is Peak Wedding Season in Chandigarh (And What That Means for Booking)",
  2: "Best Wedding Planner in Chandigarh: Hire With Confidence, Not Guesswork",
  3: "Best Wedding Planner in Punjab: Check Availability Before Your Dream Date Is Gone",
  4: "How to Choose the Right Wedding Planner in Chandigarh: A Complete Guide"
};
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const $ = (s) => document.querySelector(s);
const abs = (u) => !u ? "" : /^https?:/.test(u) ? u : SITE + (u.startsWith("/") ? "" : "/") + u;

function longDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? String(iso || "") : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
const slugFromPath = () => { const m = location.pathname.match(/^\/blog\/([^\/]+)\/?$/); return m ? decodeURIComponent(m[1]) : null; };

/* ---------- content normaliser: one H1 per page, scrollable tables, lazy images ---------- */
function normalise(html) {
  const t = document.createElement("template");
  t.innerHTML = html;
  const c = t.content;
  c.querySelectorAll("h1").forEach((h) => { const n = document.createElement("h2"); n.innerHTML = h.innerHTML; h.replaceWith(n); });
  c.querySelectorAll("table").forEach((tb) => { const w = document.createElement("div"); w.className = "table-wrap"; tb.replaceWith(w); w.appendChild(tb); });
  c.querySelectorAll("img").forEach((i) => { i.loading = "lazy"; if (!i.hasAttribute("alt")) i.alt = ""; });
  c.querySelectorAll("a[href^='http']").forEach((a) => { if (!a.href.startsWith(SITE)) a.rel = "noopener"; });
  return Array.from(c.childNodes).map((n) => n.outerHTML !== undefined ? n.outerHTML : esc(n.textContent)).join("");
}

/* ---------- SEO head management ---------- */
const head = document.head;
function meta(attr, key) {
  let el = head.querySelector("meta[" + attr + '="' + key + '"]');
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); head.appendChild(el); }
  return el;
}
function canonicalEl() {
  let el = head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.rel = "canonical"; head.appendChild(el); }
  return el;
}
const SEO_KEYS = [["name", "description"], ["name", "keywords"], ["property", "og:title"], ["property", "og:description"], ["property", "og:image"], ["property", "og:url"], ["property", "og:type"], ["name", "twitter:title"], ["name", "twitter:description"], ["name", "twitter:image"]];
let defaults = null;
function snapshotDefaults() {
  defaults = { title: document.title, canonical: canonicalEl().getAttribute("href"), metas: SEO_KEYS.map(([a, k]) => { const el = head.querySelector("meta[" + a + '="' + k + '"]'); return [a, k, el ? el.getAttribute("content") : null]; }) };
}
function applySeo(p) {
  const url = SITE + "/blog/" + p.id;
  const title = p.metaTitle || (p.title + " | " + BRAND);
  const desc = p.metaDescription || p.excerpt;
  const img = abs(p.image);
  document.title = title;
  canonicalEl().setAttribute("href", url);
  meta("name", "description").setAttribute("content", desc);
  const kws = (p.keywords || []).slice(); if (p.focusKeyword && !kws.includes(p.focusKeyword.toLowerCase())) kws.unshift(p.focusKeyword);
  if (kws.length) meta("name", "keywords").setAttribute("content", kws.join(", "));
  meta("property", "og:title").setAttribute("content", title);
  meta("property", "og:description").setAttribute("content", desc);
  meta("property", "og:url").setAttribute("content", url);
  meta("property", "og:type").setAttribute("content", "article");
  if (img) { meta("property", "og:image").setAttribute("content", img); meta("name", "twitter:image").setAttribute("content", img); }
  meta("name", "twitter:title").setAttribute("content", title);
  meta("name", "twitter:description").setAttribute("content", desc);
  let ld = $("#ld-article");
  if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; ld.id = "ld-article"; head.appendChild(ld); }
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article",
    headline: p.title, description: desc, image: img ? [img] : undefined,
    datePublished: p.sort, dateModified: p.updated || p.sort,
    author: { "@type": "Organization", name: p.by || BRAND },
    publisher: { "@type": "Organization", name: BRAND, logo: { "@type": "ImageObject", url: SITE + "/images/brand_logo-removebg-preview.png" } },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: kws.join(", ") || undefined
  });
}
function resetSeo() {
  if (!defaults) return;
  document.title = defaults.title;
  if (defaults.canonical) canonicalEl().setAttribute("href", defaults.canonical);
  defaults.metas.forEach(([a, k, v]) => {
    const el = head.querySelector("meta[" + a + '="' + k + '"]');
    if (!el) return;
    if (v === null) el.remove(); else el.setAttribute("content", v);
  });
  const ld = $("#ld-article"); if (ld) ld.remove();
}

/* ---------- load ---------- */
async function boot() {
  const col = collection(db, "blogs");
  const docs = new Map();
  const [pub, sch] = await Promise.allSettled([
    getDocs(query(col, where("published", "==", true))),
    getDocs(query(col, where("status", "==", "scheduled"), where("publishAt", "<=", Timestamp.now())))
  ]);
  if (pub.status === "fulfilled") pub.value.docs.forEach((d) => docs.set(d.id, d));
  else throw pub.reason;
  if (sch.status === "fulfilled") sch.value.docs.forEach((d) => docs.set(d.id, d));
  else console.warn("Scheduled posts skipped (create the Firestore index from the console link):", sch.reason && sch.reason.message);

  const posts = Array.from(docs.values()).map((d) => {
    const x = d.data();
    const pa = x.publishAt && x.publishAt.toDate ? x.publishAt.toDate() : null;
    const up = x.updatedAt && x.updatedAt.toDate ? x.updatedAt.toDate().toISOString() : null;
    return {
      id: x.slug || d.id, docId: d.id,
      title: x.title || "", excerpt: x.excerpt || "",
      date: longDate(x.date), sort: String(x.date || ""), updated: up,
      by: x.by || BRAND + " Team", category: x.category || "Uncategorized",
      image: x.image || "", imageAlt: x.imageAlt || x.title || "",
      metaTitle: x.metaTitle || "", metaDescription: x.metaDescription || "",
      keywords: Array.isArray(x.keywords) ? x.keywords : [], focusKeyword: x.focusKeyword || "",
      content: x.content || "", pa
    };
  }).filter((p) => p.title && p.content)
    .sort((a, b) => b.sort.localeCompare(a.sort));

  if (!posts.length) return;
  takeover(posts);
}

function takeover(posts) {
  snapshotDefaults();
  const fresh = (sel) => { const el = $(sel); const c = el.cloneNode(true); el.parentNode.replaceChild(c, el); return c; };
  const grid = fresh("#grid"), catSel = fresh("#cat"), q = fresh("#q");
  const applyBtn = fresh("#apply"), clearBtn = fresh("#clear");
  const closeBtn = fresh("#close"), side = fresh("#rSide");
  const reader = $("#reader"), count = $("#count");
  let lastFocus = null;
  try { window.posts = []; } catch (e) { /* ignore */ }

  const have = Array.from(catSel.options).map((o) => o.value);
  posts.forEach((p) => {
    if (have.indexOf(p.category) === -1) {
      const o = document.createElement("option"); o.value = p.category; o.textContent = p.category; catSel.appendChild(o); have.push(p.category);
    }
  });

  function render(list) {
    count.textContent = list.length + (list.length === 1 ? " article" : " articles");
    if (!list.length) { grid.innerHTML = '<div class="empty">No blogs match your search.</div>'; return; }
    grid.innerHTML = list.map((p) =>
      '<article class="card">' +
        '<div class="thumb"><img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '" loading="lazy" onerror="this.remove()"><span class="date">' + esc(p.date) + "</span></div>" +
        '<div class="cbody"><p class="eyebrow">' + esc(p.category) + "</p><h3>" + esc(p.title) + "</h3><p>" + esc(p.excerpt) + "</p>" +
        '<button class="more" type="button" data-id="' + esc(p.id) + '">Read more &rarr;</button></div>' +
      "</article>"
    ).join("");
  }

  function applyFilter() {
    const c = catSel.value, t = q.value.trim().toLowerCase();
    render(posts.filter((p) =>
      (c === "all" || p.category === c) &&
      (!t || (p.title + " " + p.excerpt + " " + p.keywords.join(" ") + " " + p.content).toLowerCase().indexOf(t) > -1)
    ));
  }
  applyBtn.addEventListener("click", applyFilter);
  clearBtn.addEventListener("click", () => { catSel.value = "all"; q.value = ""; applyFilter(); });
  q.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilter(); });
  catSel.addEventListener("change", applyFilter);

  function resolve(raw) {
    if (!raw) return null;
    if (posts.some((p) => p.id === raw)) return raw;
    const byDoc = posts.find((p) => p.docId === raw);
    if (byDoc) return byDoc.id;
    if (/^\d+$/.test(raw) && LEGACY_TITLES[raw]) {
      const m = posts.find((p) => p.docId === slugify(LEGACY_TITLES[raw]));
      if (m) return m.id;
    }
    return null;
  }

  function openPost(id, fromPop) {
    const p = posts.filter((x) => x.id === id)[0];
    if (!p) return;
    const wasOpen = reader.classList.contains("open");

    $("#rCat").textContent = p.category;
    $("#rTitle").textContent = p.title;
    $("#rDate").textContent = p.date;
    $("#rBy").textContent = "By " + p.by;
    $("#rBody").innerHTML =
      (p.image ? '<img class="cover" src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '" onerror="this.remove()">' : "") +
      normalise(p.content) +
      '<div class="rcta"><h4>Plan Your Dream Day</h4><a class="btn" href="/contact">Contact Us</a></div>';

    side.innerHTML = "<h3>Recent Posts</h3>" + posts.filter((x) => x.id !== id).slice(0, 5).map((x) =>
      '<button class="side-item" type="button" data-id="' + esc(x.id) + '">' +
        '<img src="' + esc(x.image) + '" alt="' + esc(x.imageAlt) + '" onerror="this.remove()">' +
        "<span><b>" + esc(x.title) + "</b><small>Read more &rarr;</small></span>" +
      "</button>"
    ).join("");

    applySeo(p);

    if (!wasOpen) lastFocus = document.activeElement;
    reader.scrollTop = 0;
    reader.classList.add("open");
    document.body.classList.add("lock");
    if (!fromPop) {
      if (wasOpen) history.replaceState({ post: id }, "", "/blog/" + id);
      else history.pushState({ post: id }, "", "/blog/" + id);
    }
    if (!wasOpen) closeBtn.focus();
  }

  function closePost(fromPop) {
    if (!reader.classList.contains("open")) return;
    reader.classList.remove("open");
    document.body.classList.remove("lock");
    resetSeo();
    if (!fromPop && location.pathname !== "/blog") history.pushState({}, "", "/blog");
    if (lastFocus) lastFocus.focus();
  }

  grid.addEventListener("click", (e) => { const b = e.target.closest(".more"); if (b) openPost(b.dataset.id); });
  side.addEventListener("click", (e) => { const b = e.target.closest(".side-item"); if (b) openPost(b.dataset.id); });
  closeBtn.addEventListener("click", () => closePost());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reader.classList.contains("open")) { e.stopImmediatePropagation(); closePost(); }
  }, true);
  window.addEventListener("popstate", () => {
    const id = resolve(slugFromPath());
    if (id) openPost(id, true); else closePost(true);
  });

  render(posts);

  const raw = slugFromPath() || (location.hash.indexOf("#post-") === 0 ? decodeURIComponent(location.hash.slice(6)) : null);
  const startId = resolve(raw);
  if (startId) {
    openPost(startId, true);
    history.replaceState({ post: startId }, "", "/blog/" + startId);
  }
}

boot().catch((e) => console.warn("Blog load skipped:", e.message));