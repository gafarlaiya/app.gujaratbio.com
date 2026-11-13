/* Hariyo farmer app (Phase 1). Plain JS, no build step. Data: Supabase (hariyo_* tables, accessed through RPC with a private token kept on the phone). */
const SB_URL = "https://filbmvtclfcrrvxckema.supabase.co";
const SB_KEY = "sb_publishable_qbndsVEhemxGLYZa6P3PyQ_iDNmsmmT";
const WA = "919978791167";
const SITE = "https://www.gujaratbio.com";
const STORE = "https://organicfertilizersindia.com";
const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
const IMG = new Set(["apple","banana","chilli","citrus","coconut","cotton","cumin","dhanya","fruit","maize","mango","mungfali","onion","paddy","pomegranate","potato","pulses","sugarcane","tea","vegetable"].map(s => `immunity-${s}-special`).concat(["immunity-gold","immunity-granules"]));
const STATES = ["Gujarat","Maharashtra","Madhya Pradesh","Rajasthan","Uttar Pradesh","Punjab","Haryana","Himachal Pradesh","Karnataka","Tamil Nadu","Andhra Pradesh","Telangana","Kerala","West Bengal","Bihar","Odisha","Other"];

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
let CROPS = [], ME = null, TOKEN = store.get("hariyo_token");
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const crop = slug => CROPS.find(c => c.slug === slug);
const wa = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* Which stage is the crop in today? */
function stageOf(c, startDate) {
  const t = c.timing, today = new Date();
  if (t.mode === "months") return { idx: t.map[today.getMonth() + 1], day: null };
  if (t.mode === "all" || !startDate) return { idx: null, day: null };
  const day = Math.floor((today - new Date(startDate)) / 86400000);
  let idx = 0;
  t.map.forEach((s, i) => { if (day >= s) idx = i; });
  if (day < t.map[0]) idx = 0;
  return { idx, day };
}

async function loadMe() {
  if (!TOKEN) { ME = null; return; }
  const { data, error } = await sb.rpc("hariyo_me", { p_token: TOKEN });
  if (error) { ME = ME || null; return; }
  if (!data) { store.del("hariyo_token"); TOKEN = null; ME = null; return; }
  ME = data;
}

function render(html) { const v = $("#view"); v.innerHTML = html; window.scrollTo(0, 0); }
function setTab(t) { document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === t)); }

/* ---------- Sign up ---------- */
function signup(next) {
  render(`<section class="hero"><h1>Know what your crop needs today</h1>
  <p class="muted">Hariyo shows your crop's stage, what to check this week, and connects you to our crop team on WhatsApp. Free to use.</p></section>
  <form class="card" id="f">
    <label for="n">Your name</label><input id="n" autocomplete="name" required>
    <label for="p">Mobile number</label><input id="p" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required>
    <label for="v">Village</label><input id="v">
    <div class="row"><div><label for="d">District</label><input id="d"></div>
    <div><label for="s">State</label><select id="s">${STATES.map(s => `<option>${s}</option>`).join("")}</select></div></div>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">Start using Hariyo</button>
    <p class="small muted" style="margin-top:10px">We use your number only to help you with your crop. We never share it.</p>
  </form>`);
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#b").disabled = true; $("#e").textContent = "";
    const { data, error } = await sb.rpc("hariyo_register", { p_name: $("#n").value, p_phone: $("#p").value, p_village: $("#v").value, p_district: $("#d").value, p_state: $("#s").value });
    if (error) { $("#e").textContent = error.message.includes("10-digit") ? "Please enter your name and a 10-digit mobile number." : "Could not save. Check your internet and try again."; $("#b").disabled = false; return; }
    TOKEN = data; store.set("hariyo_token", data); await loadMe(); location.hash = next || "#/farm";
  };
}
const needMe = next => { if (!ME) { signup(next); return false; } return true; };

/* ---------- Today ---------- */
function home() {
  setTab("home");
  if (!ME) {
    render(`<section class="hero"><h1>Your crop's day, every day</h1><p class="muted">Add your crop and sowing date. Hariyo tells you which stage it is in and what to check this week.</p></section>
    <a class="btn full tur" href="#/farm">Add my crop</a>
    <h2 style="margin-top:22px">Crop guides</h2>${cropGrid()}`);
    return;
  }
  const plots = ME.plots || [];
  let html = `<p class="muted" style="margin:0 0 10px">Namaste, ${esc(ME.farmer.name.split(" ")[0])}</p>`;
  if (!plots.length) html += `<div class="card empty"><h2>Add your first crop</h2><p class="muted">Tell us what you grow and when you sowed it.</p><a class="btn" href="#/farm">Add crop</a></div>`;
  plots.forEach(p => {
    const c = crop(p.crop); if (!c) return;
    const s = stageOf(c, p.start_date), n = c.stages.length;
    const st = s.idx != null ? c.stages[s.idx] : null;
    html += `<section class="season" aria-label="${esc(c.name)} today">
      <div class="crop">${esc(c.name)}${p.acres ? ` · ${esc(p.acres)} acres` : ""}</div>
      ${s.day != null ? `<div class="day">Day ${Math.max(s.day, 0)}<small>since ${fmtDate(p.start_date)}</small></div>` : `<div class="day" style="font-size:2.2rem">${new Date().toLocaleDateString("en-IN", { month: "long" })}</div>`}
      ${st ? `<div class="stage">${esc(st.name)}</div>` : `<div class="stage">Care all year</div>`}
      <div class="stem" aria-hidden="true">${c.stages.map((_, i) => `<i class="${s.idx == null ? "" : i < s.idx ? "done" : i === s.idx ? "now" : ""}"></i>`).join("")}</div>
      <div class="stem-l" aria-hidden="true">${c.stages.map(x => `<span>${esc(x.name.split(" and ")[0].split(",")[0])}</span>`).join("")}</div>
      ${st ? `<div class="what"><p style="margin:0">${esc(st.text)}</p></div>` : ""}
      <p style="margin:12px 0 0"><a href="#/crop/${c.slug}">Full ${esc(c.name.toLowerCase())} guide</a></p>
    </section>
    <div class="card"><h3>This week, check</h3><ul class="checks">${c.checks.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <a class="btn alt full" href="#/help?crop=${c.slug}">Something looks wrong? Send a photo</a></div>`;
  });
  html += `<h2 style="margin-top:20px">All crop guides</h2>${cropGrid()}`;
  render(html);
}
const cropGrid = () => `<div class="crops">${CROPS.map(c => `<a href="#/crop/${c.slug}">${esc(c.name)}<span>${esc(c.problems[0])}</span></a>`).join("")}</div>`;

/* ---------- Crop guide ---------- */
function cropPage(slug) {
  setTab("home");
  const c = crop(slug); if (!c) return home();
  const plot = ME && (ME.plots || []).find(p => p.crop === slug);
  const s = stageOf(c, plot && plot.start_date);
  render(`<p><a href="#/home">← Back</a></p><h1>${esc(c.name)}</h1><p class="muted">${esc(c.hook)}</p>
  <div class="card"><p>${esc(c.intro)}</p></div>
  <h2>Stage by stage</h2><ol class="stages">${c.stages.map((x, i) => `<li class="${i === s.idx ? "now" : ""}"><h3>${esc(x.name)} ${i === s.idx ? '<span class="tag new">Now</span>' : ""}</h3><div class="when">${esc(x.when)}</div><p>${esc(x.text)}</p></li>`).join("")}</ol>
  <div class="card"><h2>Common problems</h2><ul>${c.problems.map(x => `<li>${esc(x)}</li>`).join("")}</ul><a class="btn full" href="#/help?crop=${c.slug}">Report a problem with photos</a></div>
  <div class="card"><h2>What to check first</h2><ul class="checks">${c.checks.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
  ${product(c)}
  <div class="card faq"><h2>Questions</h2>${c.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
  <p class="small"><a href="${SITE}/crops/${c.slug}" target="_blank" rel="noopener">Read this guide on gujaratbio.com</a></p>
  ${!plot ? `<a class="btn tur full" href="#/farm?crop=${c.slug}">Add ${esc(c.name.toLowerCase())} to my farm</a>` : ""}`);
}

/* ---------- My farm ---------- */
function farm(q) {
  setTab("farm");
  if (!needMe("#/farm")) return;
  const pre = q.get("crop") || "";
  const plots = ME.plots || [];
  render(`<h1>My farm</h1><p class="muted">${esc(ME.farmer.village || "")}${ME.farmer.district ? ", " + esc(ME.farmer.district) : ""}</p>
  ${plots.map(p => { const c = crop(p.crop); return `<div class="card plot"><div><h3>${esc(c ? c.name : p.crop)}</h3><div class="small muted">${p.acres ? esc(p.acres) + " acres · " : ""}${p.start_date ? fmtDate(p.start_date) : "No date"}</div></div><button class="x" data-del="${p.id}">Remove</button></div>`; }).join("")}
  <form class="card" id="f"><h2>Add a crop</h2>
    <label for="c">Crop</label><select id="c">${CROPS.map(c => `<option value="${c.slug}" ${c.slug === pre ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
    <div id="dl"><label for="sd" id="sdl">Sowing date</label><input id="sd" type="date"></div>
    <label for="a">Area (acres, optional)</label><input id="a" type="number" inputmode="decimal" min="0" step="0.1">
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">Save crop</button></form>`);
  const sync = () => { const c = crop($("#c").value); $("#dl").style.display = c.timing.mode === "days" ? "" : "none"; $("#sdl").textContent = c.timing.label || "Date"; };
  $("#c").onchange = sync; sync();
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); const c = crop($("#c").value);
    if (c.timing.mode === "days" && !$("#sd").value) { $("#e").textContent = "Please choose the date."; return; }
    $("#b").disabled = true;
    const { error } = await sb.rpc("hariyo_add_plot", { p_token: TOKEN, p_crop: c.slug, p_acres: $("#a").value ? Number($("#a").value) : null, p_start: c.timing.mode === "days" ? $("#sd").value : null });
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; return; }
    await loadMe(); location.hash = "#/home";
  };
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm("Remove this crop from your farm?")) return;
    await sb.rpc("hariyo_del_plot", { p_token: TOKEN, p_id: b.dataset.del }); await loadMe(); farm(q);
  });
}

/* ---------- Get help: photo case ---------- */
async function shrink(file) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 1280 / Math.max(img.width, img.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  return new Promise(r => cv.toBlob(r, "image/jpeg", 0.8));
}
function help(q) {
  setTab("help");
  if (!needMe(location.hash)) return;
  const pre = q.get("crop") || (ME.plots[0] && ME.plots[0].crop) || "";
  const cases = ME.cases || [];
  render(`<h1>Get help</h1><p class="muted">Send photos and a few words. Our crop team checks and replies on WhatsApp, usually within a day.</p>
  <form class="card" id="f">
    <label for="c">Crop</label><select id="c">${CROPS.map(c => `<option value="${c.slug}" ${c.slug === pre ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
    <label for="ph">Photos (up to 4): whole plant, the problem close up, roots</label><input id="ph" type="file" accept="image/*" multiple>
    <div class="thumbs" id="th"></div>
    <label for="t">What is wrong? Since when?</label><textarea id="t" placeholder="Example: leaves yellow from the edges for 10 days, after heavy rain"></textarea>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">Send to crop team</button></form>
  <h2>My reports</h2>${cases.length ? cases.map(c => `<div class="card"><div class="plot"><h3>${esc((crop(c.crop) || {}).name || c.crop)}</h3><span class="tag ${c.status === "new" ? "new" : ""}">${c.status === "new" ? "Waiting" : c.status === "replied" ? "Replied" : esc(c.status)}</span></div><p class="small muted">${fmtDate(c.created_at)} · ${c.n_photos} photo(s)</p><p>${esc(c.problem)}</p>${c.reply ? `<div class="card" style="background:#F1F6EF"><strong>Our team:</strong> ${esc(c.reply)}</div>` : ""}</div>`).join("") : `<p class="muted">No reports yet.</p>`}`);
  let files = [];
  $("#ph").onchange = () => { files = [...$("#ph").files].slice(0, 4); $("#th").innerHTML = files.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join(""); };
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#e").textContent = "";
    if ($("#t").value.trim().length < 5 && !files.length) { $("#e").textContent = "Please add a photo or describe the problem."; return; }
    $("#b").disabled = true; $("#b").textContent = "Sending…";
    const paths = [];
    try {
      for (const f of files) {
        const blob = await shrink(f), path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from("hariyo-cases").upload(path, blob, { contentType: "image/jpeg" });
        if (!error) paths.push(path);
      }
    } catch (e) {}
    const { error } = await sb.rpc("hariyo_add_case", { p_token: TOKEN, p_crop: $("#c").value, p_problem: $("#t").value.trim() || "(photos only)", p_photos: paths });
    if (error) { $("#e").textContent = "Could not send. Check your internet and try again."; $("#b").disabled = false; $("#b").textContent = "Send to crop team"; return; }
    await loadMe();
    render(`<div class="card empty"><h1>Sent</h1><p>Our crop team will check your photos and reply on WhatsApp${files.length && paths.length < files.length ? ". Some photos did not upload; you can also send them on WhatsApp" : ""}.</p>
    <a class="btn full" href="${wa(`Hi, I sent a crop report on Hariyo for my ${(crop($("#c") ? $("#c").value : "") || {}).name || "crop"}.`)}" target="_blank" rel="noopener">Also message on WhatsApp</a>
    <p style="margin-top:12px"><a href="#/help">Back to my reports</a></p></div>`);
  };
}

/* ---------- Meetings ---------- */
async function events() {
  setTab("events");
  render(`<h1>Farmer meetings</h1><p class="muted">Village meetings and online sessions with our crop team.</p><p class="muted">Loading…</p>`);
  const { data } = await sb.from("hariyo_events").select("*").order("starts_at");
  const joined = new Set((ME && ME.events) || []);
  const list = data || [];
  render(`<h1>Farmer meetings</h1><p class="muted">Village meetings and online sessions with our crop team.</p>
  ${list.length ? list.map(e => `<div class="card event"><div class="when">${new Date(e.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div><h2>${esc(e.title)}</h2>
    <p class="small muted">${e.mode === "zoom" ? "Online (Zoom)" : esc(e.place || "Village meeting")} · ${esc(e.language || "")}</p>${e.description ? `<p>${esc(e.description)}</p>` : ""}
    ${joined.has(e.id) ? `<p class="ok">You are registered.</p>${e.mode === "zoom" && e.link ? `<a class="btn full" href="${esc(e.link)}" target="_blank" rel="noopener">Join link</a>` : ""}` : `<button class="btn full" data-join="${e.id}">Register free</button>`}</div>`).join("")
    : `<div class="card empty"><h2>No meetings announced yet</h2><p class="muted">We will post the next meeting here. Ask us on WhatsApp about meetings near you.</p><a class="btn alt" href="${wa("Hi, are there any farmer meetings near me?")}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>`}`);
  document.querySelectorAll("[data-join]").forEach(b => b.onclick = async () => {
    if (!ME) { signup("#/events"); return; }
    b.disabled = true; await sb.rpc("hariyo_join_event", { p_token: TOKEN, p_event: b.dataset.join }); await loadMe(); events();
  });
}

/* ---------- Products ---------- */
function product(c) {
  const p = c.product; if (!p || !p.name) return "";
  return `<div class="card prod">${IMG.has(p.slug) ? `<img src="/img/products/${p.slug}.webp" alt="${esc(p.name)} pack" loading="lazy">` : "<div></div>"}
  <div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.line)}</p>
  <a class="btn tur" href="${wa(`Hi, I want to order ${p.name} for my ${c.name.toLowerCase()}. Please share price and delivery.`)}" target="_blank" rel="noopener">Order on WhatsApp</a></div></div>`;
}
function shop() {
  setTab("shop");
  const mine = new Set(((ME && ME.plots) || []).map(p => p.crop));
  const list = [...CROPS].sort((a, b) => mine.has(b.slug) - mine.has(a.slug));
  render(`<h1>Immunity products</h1><p class="muted">Made in our own factory in Shihor, Bhavnagar. Ask us on WhatsApp for price, delivery and the right schedule for your field.</p>
  ${list.map(product).join("")}
  <a class="btn alt full" href="${STORE}" target="_blank" rel="noopener">See all products in our online store</a>
  <p class="small muted" style="margin-top:12px">Results differ from farm to farm with soil, weather and care. Farmer experiences are their own, not a promise.</p>`);
}

/* ---------- Router ---------- */
async function route() {
  const [path, qs] = (location.hash || "#/home").slice(1).split("?");
  const q = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "farm") return farm(q);
  if (parts[0] === "help") return help(q);
  if (parts[0] === "events") return events();
  if (parts[0] === "shop") return shop();
  if (parts[0] === "crop") return cropPage(parts[1]);
  return home();
}
(async () => {
  render(`<p class="muted">Loading…</p>`);
  CROPS = await fetch("/crops.json").then(r => r.json());
  await loadMe();
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
})();
