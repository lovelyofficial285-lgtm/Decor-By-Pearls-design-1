import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN-0pAeMLXcVov40lmQ7DV_KbYP6hjzQI",
  authDomain: "decor-by-pearls.firebaseapp.com",
  projectId: "decor-by-pearls",
  storageBucket: "decor-by-pearls.firebasestorage.app",
  messagingSenderId: "815568698743",
  appId: "1:815568698743:web:cf842cf99744abe7edf572"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/* Same slug rule as admin, used to keep old links like blog.html#post-1 working */
const slugify = (s) => String(s).toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const LEGACY_TITLES = {
  1: "Why October to February Is Peak Wedding Season in Chandigarh (And What That Means for Booking)",
  2: "Best Wedding Planner in Chandigarh: Hire With Confidence, Not Guesswork",
  3: "Best Wedding Planner in Punjab: Check Availability Before Your Dream Date Is Gone",
  4: "How to Choose the Right Wedding Planner in Chandigarh: A Complete Guide"
};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const $ = (s) => document.querySelector(s);

function longDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? String(iso || "") : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

async function boot() {
  const snap = await getDocs(query(collection(db, "blogs"), where("published", "==", true)));
  const posts = snap.docs
    .map((d) => {
      const x = d.data();
      return {
      id: x.slug || d.id,
      docId: d.id,
       title: x.title || "",
        excerpt: x.excerpt || "",
        date: longDate(x.date),
        sort: String(x.date || ""),
        by: x.by || "Decor By Pearls Team",
        category: x.category || "Uncategorized",
        image: x.image || "",
        content: x.content || ""
      };
    })
    .filter((p) => p.title && p.content)
    .sort((a, b) => b.sort.localeCompare(a.sort));

  if (!posts.length) return; /* keep the existing page as is */
  takeover(posts);
}

function takeover(posts) {
  /* Drop the old listeners by swapping in clean copies of the same elements */
  const fresh = (sel) => { const el = $(sel); const c = el.cloneNode(true); el.parentNode.replaceChild(c, el); return c; };
  const grid = fresh("#grid"), catSel = fresh("#cat"), q = fresh("#q");
  const applyBtn = fresh("#apply"), clearBtn = fresh("#clear");
  const closeBtn = fresh("#close"), side = fresh("#rSide");
  const reader = $("#reader"), count = $("#count");
  let lastFocus = null;

  /* The old inline script reads this global; empty it so it can never fight with this one */
  try { window.posts = []; } catch (e) { /* ignore */ }

  /* Categories: keep existing options, add any new ones */
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
        '<div class="thumb"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" onerror="this.remove()"><span class="date">' + esc(p.date) + "</span></div>" +
        '<div class="cbody"><p class="eyebrow">' + esc(p.category) + "</p><h3>" + esc(p.title) + "</h3><p>" + esc(p.excerpt) + "</p>" +
        '<button class="more" type="button" data-id="' + esc(p.id) + '">Read more &rarr;</button></div>' +
      "</article>"
    ).join("");
  }

  function applyFilter() {
    const c = catSel.value, t = q.value.trim().toLowerCase();
    render(posts.filter((p) =>
      (c === "all" || p.category === c) &&
      (!t || (p.title + " " + p.excerpt + " " + p.content).toLowerCase().indexOf(t) > -1)
    ));
  }
  applyBtn.addEventListener("click", applyFilter);
  clearBtn.addEventListener("click", () => { catSel.value = "all"; q.value = ""; applyFilter(); });
  q.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilter(); });
  catSel.addEventListener("change", applyFilter);

  /* Accepts a slug, or an old numeric id (#post-1 to #post-4) */
  function resolve(raw) {
  if (!raw) return null;
  if (posts.some((p) => p.id === raw)) return raw;
  const byDoc = posts.find((p) => p.docId === raw);
  if (byDoc) return byDoc.id;
  if (/^\d+$/.test(raw) && LEGACY_TITLES[raw]) {
    const s = slugify(LEGACY_TITLES[raw]);
    const m = posts.find((p) => p.docId === s);
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
    $("#rBody").innerHTML = '<img class="cover" src="' + esc(p.image) + '" alt="" onerror="this.remove()">' + p.content +
      '<div class="rcta"><h4>Plan Your Dream Day</h4><a class="btn" href="contact.html">Contact Us</a></div>';

    side.innerHTML = "<h3>Recent Post</h3>" + posts.filter((x) => x.id !== id).slice(0, 5).map((x) =>
      '<button class="side-item" type="button" data-id="' + esc(x.id) + '">' +
        '<img src="' + esc(x.image) + '" alt="" onerror="this.remove()">' +
        "<span><b>" + esc(x.title) + "</b><small>Read more &rarr;</small></span>" +
      "</button>"
    ).join("");

    if (!wasOpen) lastFocus = document.activeElement;
    reader.scrollTop = 0;
    reader.classList.add("open");
    document.body.classList.add("lock");
    if (!fromPop) {
      if (wasOpen) history.replaceState({ post: id }, "", "#post-" + id);
      else history.pushState({ post: id }, "", "#post-" + id);
    }
    if (!wasOpen) closeBtn.focus();
  }

  function closePost(fromPop) {
    if (!reader.classList.contains("open")) return;
    reader.classList.remove("open");
    document.body.classList.remove("lock");
    if (!fromPop && location.hash.indexOf("#post-") === 0) history.back();
    if (lastFocus) lastFocus.focus();
  }

  grid.addEventListener("click", (e) => { const b = e.target.closest(".more"); if (b) openPost(b.dataset.id); });
  side.addEventListener("click", (e) => { const b = e.target.closest(".side-item"); if (b) openPost(b.dataset.id); });
  closeBtn.addEventListener("click", () => closePost());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && reader.classList.contains("open")) closePost(); });
  window.addEventListener("popstate", () => {
    if (location.hash.indexOf("#post-") === 0) {
      const id = resolve(decodeURIComponent(location.hash.slice(6)));
      if (id) openPost(id, true);
    } else closePost(true);
  });

  render(posts);
  if (location.hash.indexOf("#post-") === 0) {
    const id = resolve(decodeURIComponent(location.hash.slice(6)));
    if (id) openPost(id, true);
  }
}

boot().catch((e) => console.warn("Blog load skipped:", e.message));