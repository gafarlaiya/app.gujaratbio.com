/* Hariyo farmer app. Plain JS, no build step. Data: Supabase hariyo_* tables, reached only through hariyo_* functions with a private token kept on the phone. */
const SB_URL = "https://filbmvtclfcrrvxckema.supabase.co";
const SB_KEY = "sb_publishable_qbndsVEhemxGLYZa6P3PyQ_iDNmsmmT";
const WA = "919978791167";
const SITE = "https://www.gujaratbio.com";
const STORE = "https://organicfertilizersindia.com";
const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
const IMG = new Set(["apple","banana","chilli","citrus","coconut","cotton","cumin","dhanya","fruit","maize","mango","mungfali","onion","paddy","pomegranate","potato","pulses","sugarcane","tea","vegetable"].map(s => `immunity-${s}-special`).concat(["immunity-gold","immunity-granules"]));
const STATES = ["Gujarat","Maharashtra","Madhya Pradesh","Rajasthan","Uttar Pradesh","Punjab","Haryana","Himachal Pradesh","Karnataka","Tamil Nadu","Andhra Pradesh","Telangana","Kerala","West Bengal","Bihar","Odisha","Other"];
const UNITS = { vigha: "vigha", acre: "acre", hectare: "hectare" };
const KINDS = [
  { k: "basal", l: "Basal dose (at planting)", fert: true, icon: "🌱" },
  { k: "fert", l: "Fertilizer dose", fert: true, icon: "🧪" },
  { k: "bio", l: "Biostimulant / Immunity dose", fert: true, icon: "🌿" },
  { k: "spray", l: "Spray (pest or disease)", fert: true, icon: "💨" },
  { k: "irrigation", l: "Irrigation", icon: "💧" },
  { k: "weeding", l: "Weeding / hoeing", icon: "🪓" },
  { k: "pruning", l: "Pruning", icon: "✂️" },
  { k: "harvest", l: "Harvest / picking", icon: "🧺" },
  { k: "other", l: "Other work", icon: "📝" }];
const METHODS = ["Basal (in soil at planting)", "Broadcast", "Drench (root zone)", "Foliar spray", "Drip / fertigation", "Seed or sett treatment"];
const SEV = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["severe", "Severe"]];
const FERTS = ["Urea", "DAP", "MOP (potash)", "SSP", "NPK 19:19:19", "NPK 12:32:16", "Ammonium sulphate", "Zinc sulphate", "Gypsum", "Farmyard manure", "Compost", "Vermicompost", "Immunity Gold", "Immunity Granules"];
/* Daily thought: real, well-known quotes plus a few lines of our own. */
const QUOTES = [
  ["The nation that destroys its soil destroys itself.", "Franklin D. Roosevelt"],
  ["Everything else can wait, but not agriculture.", "Jawaharlal Nehru"],
  ["Jai Jawan, Jai Kisan.", "Lal Bahadur Shastri"],
  ["To forget how to dig the earth and to tend the soil is to forget ourselves.", "Mahatma Gandhi"],
  ["There can be no life without soil and no soil without life; they have evolved together.", "Charles E. Kellogg"],
  ["Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals and happiness.", "Thomas Jefferson"],
  ["The farmer has to be an optimist or he wouldn't still be a farmer.", "Will Rogers"],
  ["If you tickle the earth with a hoe, she laughs with a harvest.", "Douglas Jerrold"],
  ["The ultimate goal of farming is not the growing of crops, but the cultivation and perfection of human beings.", "Masanobu Fukuoka"],
  ["The care of the earth is our most ancient and most worthy, and after all our most pleasing responsibility.", "Wendell Berry"],
  ["Hunger is not an issue of charity. It is an issue of justice.", "Jacques Diouf"],
  ["We do not inherit the earth from our ancestors; we borrow it from our children.", "Proverb"],
  ["Every meal on every plate began with a farmer and a field.", "Hariyo"],
  ["A handful of healthy soil holds more living beings than there are people on earth. Feed it, and it feeds you.", "Hariyo"],
  ["Nature takes hundreds of years to build an inch of topsoil. One heavy rain on bare land can wash it away.", "Hariyo"],
  ["Bees, earthworms and birds work on your farm for free. Protect them, and they keep working.", "Hariyo"],
  ["The field you care for today is the field your children will farm tomorrow.", "Hariyo"],
  ["Rain you save in your soil today is the water your crop drinks in the dry weeks.", "Hariyo"],
  ["Trees on the bunds and many kinds of crops keep pests in check and the farm alive.", "Hariyo"],
  ["Return the leaves and stalks to the soil; they are tomorrow's fertilizer.", "Hariyo"],
  ["Feeding a nation starts with feeding the soil.", "Hariyo"],
  ["A farmer's patience is the slowest and strongest force on earth.", "Hariyo"]];

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
const today = () => new Date().toISOString().slice(0, 10);
const plotById = id => ((ME && ME.plots) || []).find(p => p.id === id);
const plotName = p => p.name || (crop(p.crop) || {}).name || p.crop;
const areaTxt = p => p.area ? `${+p.area} ${UNITS[p.unit] || p.unit}` : "";
const kind = k => KINDS.find(x => x.k === k) || KINDS[KINDS.length - 1];
const HELP = "Facing any problem in your crop? Get help from an expert";

function quote(offset) {
  const d = new Date(), start = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((d - start) / 86400000);
  const [t, a] = QUOTES[(doy + (offset || 0) * 7) % QUOTES.length];
  return `<figure class="quote"><blockquote>${esc(t)}</blockquote>${a !== "Hariyo" ? `<figcaption>${esc(a)}</figcaption>` : ""}</figure>`;
}

/* Which stage is the crop in today, and what comes next? */
function stageOf(c, startDate) {
  const t = c.timing, now = new Date();
  if (t.mode === "months") { const idx = t.map[now.getMonth() + 1]; return { idx, day: null, next: null }; }
  if (t.mode === "all" || !startDate) return { idx: null, day: null, next: null };
  const day = Math.floor((now - new Date(startDate)) / 86400000);
  let idx = 0;
  t.map.forEach((s, i) => { if (day >= s) idx = i; });
  const next = idx + 1 < t.map.length ? { idx: idx + 1, inDays: t.map[idx + 1] - day } : null;
  return { idx, day, next };
}
function nextAction(p) {
  const c = crop(p.crop), s = stageOf(c, p.start_date);
  const acts = (ME.activities || []).filter(a => a.plot_id === p.id);
  const replied = (ME.cases || []).find(x => x.plot_id === p.id && x.status === "replied");
  if (replied) return "Our expert replied to your problem report. Read it in the field diary.";
  if (c.timing.mode === "days" && s.day != null && s.day <= 30 && !acts.some(a => a.kind === "basal")) return "Record your basal dose for this field.";
  const week = Math.floor(Date.now() / 604800000);
  return "This week: " + c.checks[week % c.checks.length];
}

async function loadMe() {
  if (!TOKEN) { ME = null; return; }
  const { data, error } = await sb.rpc("hariyo_me", { p_token: TOKEN });
  if (error) return;
  if (!data) { store.del("hariyo_token"); TOKEN = null; ME = null; return; }
  ME = data;
}
function render(html) { $("#view").innerHTML = html; window.scrollTo(0, 0); }
function setTab(t) { document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === t)); }
function go(h) { if (location.hash === h) route(); else location.hash = h; }

/* ---------- Sign up ---------- */
function signup(next) {
  render(`<section class="hero"><h1>Know what your crop needs today</h1>
  <p class="muted">Hariyo keeps a diary of each field, shows your crop's stage and what to check this week, and connects you to our crop experts. Free to use.</p></section>
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
    TOKEN = data; store.set("hariyo_token", data); await loadMe(); go(next || "#/farm");
  };
}
const needMe = next => { if (!ME) { signup(next); return false; } return true; };

/* ---------- Home: all fields as tiles ---------- */
function tile(p) {
  const c = crop(p.crop); if (!c) return "";
  const s = stageOf(c, p.start_date), st = s.idx != null ? c.stages[s.idx] : null;
  return `<a class="tile" href="#/field/${p.id}">
    <div class="tile-top"><span class="tile-name">${esc(plotName(p))}</span>${areaTxt(p) ? `<span class="tag">${esc(areaTxt(p))}</span>` : ""}</div>
    <div class="tile-crop">${esc(c.name)}</div>
    <div class="tile-age">${s.day != null ? `Day ${Math.max(s.day, 0)}` : new Date().toLocaleDateString("en-IN", { month: "long" })}</div>
    <div class="tile-stage">${st ? esc(st.name) : "Care all year"}${s.next ? `<span> · next: ${esc(c.stages[s.next.idx].name.split(" and ")[0])} in ${s.next.inDays} d</span>` : ""}</div>
    <div class="stem sm" aria-hidden="true">${c.stages.map((_, i) => `<i class="${s.idx == null ? "" : i < s.idx ? "done" : i === s.idx ? "now" : ""}"></i>`).join("")}</div>
    <div class="tile-next">${esc(nextAction(p))}</div></a>`;
}
function home() {
  setTab("home");
  if (!ME) {
    render(`${quote(0)}<section class="hero"><h1>Your farm diary and crop expert, in one app</h1><p class="muted">Add your fields. Hariyo shows each crop's age and stage, what to do next, and keeps a record of every dose you apply.</p></section>
    <a class="btn full tur" href="#/farm">Add my first field</a>
    <h2 style="margin-top:22px">Crop guides</h2>${cropGrid()}`);
    return;
  }
  const plots = ME.plots || [];
  render(`${quote(0)}<p class="muted" style="margin:0 0 10px">Namaste, ${esc(ME.farmer.name.split(" ")[0])}</p>
  <div class="tiles">${plots.map(tile).join("")}<a class="tile add" href="#/farm"><span>+</span>Add a field</a></div>
  <a class="help-cta" href="#/help"><strong>${HELP}</strong><span>Send photos. Our crop team replies on WhatsApp.</span></a>
  <h2 style="margin-top:20px">Crop guides</h2>${cropGrid()}`);
}
const cropGrid = () => `<div class="crops">${CROPS.map(c => `<a href="#/crop/${c.slug}">${esc(c.name)}<span>${esc(c.problems[0])}</span></a>`).join("")}</div>`;

/* ---------- One field: season, next action, diary ---------- */
function field(id) {
  setTab("home");
  if (!needMe(location.hash)) return;
  const p = plotById(id); if (!p) return home();
  const c = crop(p.crop), s = stageOf(c, p.start_date), st = s.idx != null ? c.stages[s.idx] : null;
  const acts = (ME.activities || []).filter(a => a.plot_id === p.id);
  const cases = (ME.cases || []).filter(x => x.plot_id === p.id);
  const fertOrder = acts.filter(a => a.kind === "fert").sort((a, b) => a.happened_on < b.happened_on ? -1 : 1).map(a => a.id);
  const items = [
    ...acts.map(a => ({ d: a.happened_on, html: diaryAct(a, fertOrder) })),
    ...cases.map(x => ({ d: x.happened_on || x.created_at.slice(0, 10), html: diaryCase(x) })),
    ...(p.start_date ? [{ d: p.start_date, html: `<li class="ev"><span class="ev-i">🌾</span><div><div class="ev-d">${fmtDate(p.start_date)}</div><strong>${esc(c.timing.label || "Planted")}</strong></div></li>` }] : [])
  ].sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  render(`<p><a href="#/home">← All fields</a></p>${quote(CROPS.indexOf(c) + 1)}
  <section class="season"><div class="crop">${esc(plotName(p))} · ${esc(c.name)}${areaTxt(p) ? " · " + esc(areaTxt(p)) : ""}</div>
    ${s.day != null ? `<div class="day">Day ${Math.max(s.day, 0)}<small>since ${fmtDate(p.start_date)}</small></div>` : `<div class="day" style="font-size:2.2rem">${new Date().toLocaleDateString("en-IN", { month: "long" })}</div>`}
    <div class="stage">${st ? esc(st.name) : "Care all year"}</div>
    <div class="stem" aria-hidden="true">${c.stages.map((_, i) => `<i class="${s.idx == null ? "" : i < s.idx ? "done" : i === s.idx ? "now" : ""}"></i>`).join("")}</div>
    <div class="stem-l" aria-hidden="true">${c.stages.map(x => `<span>${esc(x.name.split(" and ")[0].split(",")[0])}</span>`).join("")}</div>
    ${st ? `<div class="what"><p style="margin:0">${esc(st.text)}</p></div>` : ""}
    <div class="what next"><strong>Next action:</strong> ${esc(nextAction(p))}${s.next ? `<br><span class="small">Next stage, ${esc(c.stages[s.next.idx].name)}, in about ${s.next.inDays} days.</span>` : ""}</div>
  </section>
  <div class="row act-btns"><a class="btn" href="#/log/${p.id}">+ Add dose or work</a><a class="btn tur" href="#/help?field=${p.id}">Report a problem</a></div>
  <h2>Field diary</h2>
  ${items.length ? `<ul class="diary">${items.map(i => i.html).join("")}</ul>` : `<div class="card empty"><p class="muted">Nothing recorded yet. Start with your planting date and basal dose.</p></div>`}
  ${product(c)}
  <p class="small"><a href="#/crop/${c.slug}">Full ${esc(c.name.toLowerCase())} guide</a> · <a href="#/farm?edit=${p.id}">Edit field</a></p>`);
  document.querySelectorAll("[data-delact]").forEach(b => b.onclick = async () => {
    if (!confirm("Delete this diary entry?")) return;
    await sb.rpc("hariyo_del_activity", { p_token: TOKEN, p_id: b.dataset.delact }); await loadMe(); field(id);
  });
}
function diaryAct(a, fertOrder) {
  const k = kind(a.kind);
  const title = a.kind === "fert" ? `Fertilizer dose ${fertOrder.indexOf(a.id) + 1}` : k.l;
  const qty = a.qty ? `${+a.qty} ${esc(a.qty_unit || "")}${a.per_unit && a.per_unit !== "total" ? " per " + esc(a.per_unit) : ""}` : "";
  return `<li class="ev"><span class="ev-i">${k.icon}</span><div><div class="ev-d">${fmtDate(a.happened_on)}</div><strong>${esc(title)}</strong>
    ${a.product ? `<div>${esc(a.product)}${qty ? " · " + qty : ""}</div>` : qty ? `<div>${qty}</div>` : ""}
    ${a.method ? `<div class="small muted">${esc(a.method)}</div>` : ""}${a.note ? `<div class="small">${esc(a.note)}</div>` : ""}
    <button class="x" data-delact="${a.id}">Delete</button></div></li>`;
}
function diaryCase(x) {
  return `<li class="ev prob"><span class="ev-i">⚠️</span><div><div class="ev-d">${fmtDate(x.happened_on || x.created_at)}</div>
    <strong>${esc(x.issue || "Problem")}</strong> ${x.severity ? `<span class="sev sev-${x.severity}">${esc(x.severity)}</span>` : ""} <span class="tag ${x.status === "new" ? "new" : ""}">${x.status === "new" ? "Waiting for expert" : x.status === "replied" ? "Expert replied" : esc(x.status)}</span>
    ${x.problem && x.problem !== x.issue ? `<div class="small">${esc(x.problem)}</div>` : ""}<div class="small muted">${x.n_photos} photo(s)</div>
    ${x.reply ? `<div class="reply"><strong>Our expert:</strong> ${esc(x.reply)}</div>` : ""}</div></li>`;
}

/* ---------- Add a dose or work ---------- */
function logForm(id) {
  setTab("home");
  if (!needMe(location.hash)) return;
  const p = plotById(id); if (!p) return home();
  const c = crop(p.crop);
  const prods = [...new Set(FERTS.concat(CROPS.map(x => x.product.name).filter(Boolean)))];
  render(`<p><a href="#/field/${p.id}">← ${esc(plotName(p))}</a></p><h1>Add to diary</h1><p class="muted">${esc(plotName(p))} · ${esc(c.name)}</p>
  <form class="card" id="f">
    <label for="k">What did you do?</label><select id="k">${KINDS.map(k => `<option value="${k.k}">${k.icon} ${esc(k.l)}</option>`).join("")}</select>
    <label for="dt">Date</label><input id="dt" type="date" value="${today()}" max="${today()}">
    <div id="fx">
      <label for="pr">Fertilizer or product name</label><input id="pr" list="pl" placeholder="Type or choose"><datalist id="pl">${prods.map(x => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="row"><div><label for="q">Quantity</label><input id="q" type="number" inputmode="decimal" min="0" step="any"></div>
      <div><label for="qu">Unit</label><select id="qu"><option>kg</option><option>g</option><option>bags</option><option>L</option><option>ml</option></select></div></div>
      <label for="pu">Quantity is</label><select id="pu"><option value="${p.unit === "vigha" ? "vigha" : "acre"}">per ${p.unit === "vigha" ? "vigha" : "acre"}</option><option value="${p.unit === "vigha" ? "acre" : "vigha"}">per ${p.unit === "vigha" ? "acre" : "vigha"}</option><option value="plant">per plant / tree</option><option value="total">total for this field</option></select>
      <label for="m">How did you apply it?</label><select id="m"><option value="">Choose</option>${METHODS.map(m => `<option>${esc(m)}</option>`).join("")}</select>
    </div>
    <label for="nt">Note (optional)</label><input id="nt" placeholder="Example: mixed with irrigation water">
    <p class="err" id="e" role="alert"></p><button class="btn full" id="b">Save to diary</button></form>`);
  const sync = () => { const k = kind($("#k").value); $("#fx").style.display = k.fert ? "" : "none"; if ($("#k").value === "basal" && !$("#m").value) $("#m").value = METHODS[0]; };
  $("#k").onchange = sync; sync();
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); const k = kind($("#k").value);
    if (k.fert && !$("#pr").value.trim()) { $("#e").textContent = "Please write the fertilizer or product name."; return; }
    $("#b").disabled = true;
    const { error } = await sb.rpc("hariyo_add_activity", { p_token: TOKEN, p_plot: p.id, p_kind: k.k, p_date: $("#dt").value || today(),
      p_product: k.fert ? $("#pr").value.trim() : null, p_qty: k.fert && $("#q").value ? Number($("#q").value) : null, p_qty_unit: k.fert ? $("#qu").value : null,
      p_per: k.fert ? $("#pu").value : null, p_method: k.fert ? $("#m").value || null : null, p_note: $("#nt").value.trim() || null });
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; return; }
    await loadMe(); go(`#/field/${p.id}`);
  };
}

/* ---------- Crop guide ---------- */
function cropPage(slug) {
  setTab("home");
  const c = crop(slug); if (!c) return home();
  render(`<p><a href="#/home">← Back</a></p>${quote(CROPS.indexOf(c) + 1)}<h1>${esc(c.name)}</h1><p class="muted">${esc(c.hook)}</p>
  <div class="card"><p>${esc(c.intro)}</p></div>
  <h2>Stage by stage</h2><ol class="stages">${c.stages.map(x => `<li><h3>${esc(x.name)}</h3><div class="when">${esc(x.when)}</div><p>${esc(x.text)}</p></li>`).join("")}</ol>
  <div class="card"><h2>Common problems</h2><ul>${c.problems.map(x => `<li>${esc(x)}</li>`).join("")}</ul><a class="btn full" href="#/help?crop=${c.slug}">${HELP}</a></div>
  <div class="card"><h2>What to check first</h2><ul class="checks">${c.checks.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
  ${product(c)}
  <div class="card faq"><h2>Questions</h2>${c.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
  <p class="small"><a href="${SITE}/crops/${c.slug}" target="_blank" rel="noopener">Read this guide on gujaratbio.com</a></p>
  <a class="btn tur full" href="#/farm?crop=${c.slug}">Add a ${esc(c.name.toLowerCase())} field</a>`);
}

/* ---------- My farm: add and edit fields ---------- */
function farm(q) {
  setTab("farm");
  if (!needMe("#/farm")) return;
  const plots = ME.plots || [], ed = plotById(q.get("edit"));
  const pre = ed ? ed.crop : q.get("crop") || "";
  render(`<h1>My farm</h1><p class="muted">${esc(ME.farmer.village || "")}${ME.farmer.district ? ", " + esc(ME.farmer.district) : ""}</p>
  ${!ed ? plots.map(p => { const c = crop(p.crop); return `<div class="card plot"><a href="#/field/${p.id}" style="text-decoration:none;color:inherit"><h3>${esc(plotName(p))}</h3><div class="small muted">${esc(c ? c.name : p.crop)}${areaTxt(p) ? " · " + esc(areaTxt(p)) : ""}${p.start_date ? " · " + fmtDate(p.start_date) : ""}</div></a><span><a class="x" href="#/farm?edit=${p.id}">Edit</a> <button class="x" data-del="${p.id}">Remove</button></span></div>`; }).join("") : ""}
  <form class="card" id="f"><h2>${ed ? "Edit field" : "Add a field"}</h2>
    <label for="fn">Field name</label><input id="fn" placeholder="Example: Well-side field, Survey 112" value="${esc(ed ? ed.name || "" : "")}">
    <label for="c">Crop</label><select id="c" ${ed ? "disabled" : ""}>${CROPS.map(c => `<option value="${c.slug}" ${c.slug === pre ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
    <div class="row"><div><label for="a">Area</label><input id="a" type="number" inputmode="decimal" min="0" step="any" value="${ed && ed.area ? +ed.area : ""}"></div>
    <div><label for="u">Unit</label><select id="u">${Object.keys(UNITS).map(u => `<option value="${u}" ${ed && ed.unit === u ? "selected" : ""}>${UNITS[u]}</option>`).join("")}</select></div></div>
    <div id="dl"><label for="sd" id="sdl">Planting date</label><input id="sd" type="date" max="${today()}" value="${ed && ed.start_date ? ed.start_date : ""}"></div>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">${ed ? "Save changes" : "Save field"}</button>${ed ? `<p style="margin-top:10px"><a href="#/field/${ed.id}">Cancel</a></p>` : ""}</form>`);
  const sync = () => { const c = crop($("#c").value); $("#dl").style.display = c.timing.mode === "days" ? "" : "none"; $("#sdl").textContent = c.timing.label || "Date"; };
  $("#c").onchange = sync; sync();
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); const c = crop($("#c").value);
    if (c.timing.mode === "days" && !$("#sd").value) { $("#e").textContent = "Please choose the date."; return; }
    $("#b").disabled = true;
    const args = { p_token: TOKEN, p_name: $("#fn").value, p_area: $("#a").value ? Number($("#a").value) : null, p_unit: $("#u").value, p_start: c.timing.mode === "days" ? $("#sd").value : null };
    const { data, error } = ed ? await sb.rpc("hariyo_update_plot", Object.assign(args, { p_id: ed.id })) : await sb.rpc("hariyo_add_plot", Object.assign(args, { p_crop: c.slug }));
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; return; }
    await loadMe(); go(ed ? `#/field/${ed.id}` : `#/field/${data}`);
  };
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm("Remove this field and its diary?")) return;
    await sb.rpc("hariyo_del_plot", { p_token: TOKEN, p_id: b.dataset.del }); await loadMe(); farm(q);
  });
}

/* ---------- Problem report: issue, severity, photos ---------- */
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
  const plots = ME.plots || [];
  const fp = plotById(q.get("field")) || null;
  const cases = ME.cases || [];
  render(`<h1>Get help from an expert</h1><p class="muted">Facing any problem in your crop? Tell us what you see and add photos. Our crop experts check and reply here and on WhatsApp, usually within a day.</p>
  <form class="card" id="f">
    ${plots.length ? `<label for="fl">Which field?</label><select id="fl">${plots.map(p => `<option value="${p.id}" ${fp && fp.id === p.id ? "selected" : ""}>${esc(plotName(p))} · ${esc((crop(p.crop) || {}).name || "")}</option>`).join("")}<option value="">Another crop</option></select>` : ""}
    <div id="cw"><label for="c">Crop</label><select id="c">${CROPS.map(c => `<option value="${c.slug}" ${c.slug === q.get("crop") ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
    <label for="is">What is the problem?</label><select id="is"></select>
    <div id="ow"><label for="io">Describe the problem in your words</label><input id="io" placeholder="Example: black spots on leaves"></div>
    <label>How serious is it?</label><div class="sevs" role="radiogroup">${SEV.map(([v, l], i) => `<label class="sev-opt"><input type="radio" name="sv" value="${v}" ${i === 1 ? "checked" : ""}><span class="sev sev-${v}">${l}</span></label>`).join("")}</div>
    <label for="dt">Since when?</label><input id="dt" type="date" value="${today()}" max="${today()}">
    <label>Photos (up to 4): whole plant, the problem close up, roots</label>
    <div class="row"><label class="btn alt pick">📷 Take photo<input id="cam" type="file" accept="image/*" capture="environment" hidden></label><label class="btn alt pick">🖼️ From gallery<input id="gal" type="file" accept="image/*" multiple hidden></label></div>
    <div class="thumbs" id="th"></div>
    <label for="t">Anything else? (optional)</label><textarea id="t" placeholder="Example: started after heavy rain; spreading to nearby plants"></textarea>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">Send to our expert</button></form>
  <h2>My reports</h2>${cases.length ? `<ul class="diary">${cases.map(diaryCase).join("")}</ul>` : `<p class="muted">No reports yet.</p>`}`);
  const curCrop = () => { const fl = $("#fl"); const p = fl && plotById(fl.value); return p ? p.crop : $("#c").value; };
  const syncIssues = () => {
    const fl = $("#fl"); $("#cw").style.display = fl && fl.value ? "none" : "";
    const c = crop(curCrop());
    $("#is").innerHTML = c.problems.map(x => `<option>${esc(x)}</option>`).join("") + `<option value="__other">Something else (type your own)</option>`;
    syncOther();
  };
  const syncOther = () => { $("#ow").style.display = $("#is").value === "__other" ? "" : "none"; };
  if ($("#fl")) $("#fl").onchange = syncIssues;
  $("#c").onchange = syncIssues; $("#is").onchange = syncOther; syncIssues();
  let files = [];
  const add = list => { files = files.concat([...list]).slice(0, 4); $("#th").innerHTML = files.map((f, i) => `<span class="th"><img src="${URL.createObjectURL(f)}" alt="Photo ${i + 1}"><button type="button" class="th-x" data-rm="${i}" aria-label="Remove photo">×</button></span>`).join("");
    document.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { files.splice(+b.dataset.rm, 1); add([]); }); };
  $("#cam").onchange = e => { add(e.target.files); e.target.value = ""; };
  $("#gal").onchange = e => { add(e.target.files); e.target.value = ""; };
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#e").textContent = "";
    const issue = $("#is").value === "__other" ? $("#io").value.trim() : $("#is").value;
    if (!issue) { $("#e").textContent = "Please describe the problem."; return; }
    $("#b").disabled = true; $("#b").textContent = "Sending…";
    const paths = [];
    try {
      for (const f of files) {
        const blob = await shrink(f), path = `${today()}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from("hariyo-cases").upload(path, blob, { contentType: "image/jpeg" });
        if (!error) paths.push(path);
      }
    } catch (e) {}
    const fl = $("#fl"), plot = fl && fl.value ? fl.value : null, cs = curCrop();
    const { error } = await sb.rpc("hariyo_add_case", { p_token: TOKEN, p_plot: plot, p_crop: cs, p_issue: issue, p_severity: (document.querySelector("[name=sv]:checked") || {}).value, p_date: $("#dt").value || today(), p_problem: $("#t").value.trim() || issue, p_photos: paths });
    if (error) { $("#e").textContent = "Could not send. Check your internet and try again."; $("#b").disabled = false; $("#b").textContent = "Send to our expert"; return; }
    await loadMe();
    render(`<div class="card empty"><h1>Sent to our expert</h1><p>Our crop team will check and reply here and on WhatsApp${files.length && paths.length < files.length ? ". Some photos did not upload; please also send them on WhatsApp" : ""}.</p>
    <a class="btn full" href="${wa(`Hi, I sent a problem report on Hariyo: ${issue} in my ${(crop(cs) || {}).name || "crop"}.`)}" target="_blank" rel="noopener">Also message on WhatsApp</a>
    <p style="margin-top:12px"><a href="${plot ? `#/field/${plot}` : "#/help"}">Back</a></p></div>`);
  };
}

/* ---------- Meetings ---------- */
async function events() {
  setTab("events");
  render(`<h1>Farmer meetings</h1><p class="muted">Loading…</p>`);
  const { data } = await sb.from("hariyo_events").select("*").order("starts_at");
  const joined = new Set((ME && ME.events) || []);
  const list = data || [];
  render(`<h1>Farmer meetings</h1><p class="muted">Village meetings and online sessions with our crop experts.</p>
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
  if (parts[0] === "field") return field(parts[1]);
  if (parts[0] === "log") return logForm(parts[1]);
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
