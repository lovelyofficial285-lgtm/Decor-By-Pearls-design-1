import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

function refreshScroll() {
  if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 150);
}

/* ===== FAQ: replaces the list + the FAQPage schema. Falls back to existing HTML if empty or error. ===== */
async function loadFaqs() {
  const list = document.querySelector(".faq__list");
  if (!list) return;
  const snap = await getDocs(query(collection(db, "faqs"), orderBy("order", "asc")));
  const items = snap.docs.map((d) => d.data()).filter((f) => f.question && f.answer);
  if (!items.length) return;

  list.innerHTML = items.map((f, i) =>
    '<details class="faq__item" name="faq"' + (i === 0 ? " open" : "") + ">" +
    "<summary>" + (i + 1) + ". " + esc(f.question) + "</summary>" +
    "<p>" + esc(f.answer) + "</p></details>"
  ).join("");

  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
    try {
      const j = JSON.parse(s.textContent);
      if (j["@type"] === "FAQPage") {
        j.mainEntity = items.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer }
        }));
        s.textContent = JSON.stringify(j);
      }
    } catch (e) { /* leave schema as is */ }
  });
  refreshScroll();
}

/* ===== BLOG CARDS: latest 3 published. Falls back to existing HTML if empty or error. ===== */
async function loadBlogs() {
  const wrap = document.querySelector("#blog .blogs");
  if (!wrap) return;
  const snap = await getDocs(query(collection(db, "blogs"), where("published", "==", true)));
  const posts = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);
  if (!posts.length) return;

  wrap.innerHTML = posts.map(function (p) {
    const d = new Date(p.date + "T00:00:00");
    const date = isNaN(d) ? esc(p.date) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return '<article class="blog-card">' +
      '<div class="blog-card__img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"><span class="blog-card__date">' + date + "</span></div>" +
      '<div class="blog-card__body">' +
      '<p class="eyebrow">' + esc(p.category) + "</p>" +
      '<h3 class="blog-card__title">' + esc(p.title) + "</h3>" +
      '<p class="blog-card__text">' + esc(p.excerpt) + "</p>" +
      '<a class="blog-card__link" href="blog.html#post-' + encodeURIComponent(p.id) + '">Read more &rarr;</a>' +
      "</div></article>";
  }).join("");
  refreshScroll();
}

loadFaqs().catch(function (e) { console.warn("FAQ load skipped:", e.message); });
loadBlogs().catch(function (e) { console.warn("Blog load skipped:", e.message); });