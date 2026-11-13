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
const areaTxt = p => p.area ? `${+p.area} ${UNITS[p.unit] || p.unit}${p.unit === "vigha" && p.vigha_guntha ? ` (${p.vigha_guntha} g)` : ""}` : "";
const acreTxt = p => { const a = acresOf(p); return a && p.unit !== "acre" ? `about ${Math.round(a * 100) / 100} acre` : ""; };
const kind = k => KINDS.find(x => x.k === k) || KINDS[KINDS.length - 1];
const HELP = "Facing any problem in your crop? Get help from an expert";
const SOIL_TYPES = ["Black (cotton) soil", "Medium black", "Red soil", "Sandy", "Sandy loam", "Loam", "Clay", "Alluvial", "Saline / alkaline", "Rocky / murrum", "Not sure"];
const SOIL_COND = ["Hard", "Normal", "Soft"];
const PH_BANDS = ["Below 6.5 (acidic)", "6.6 to 7.2 (neutral)", "7.3 to 8.0 (slightly alkaline)", "8.1 and above (alkaline)", "Not tested"];
const LNH = ["Low", "Normal", "High", "Not tested"];
const WATER_SRC = ["Canal", "Borewell", "Open well", "River or pond", "Farm pond", "Rain-fed only", "Other"];
const IRR_METHOD = ["Flood", "Furrow", "Drip", "Sprinkler", "Rain-fed"];
const LOOKS = ["Excellent", "Good", "Average", "Poor"];
const GERM = ["95% or more", "85 to 95%", "70 to 85%", "Below 70%"];
const COUNT = ["Less than 4", "5 to 7", "8 to 10", "11 to 14", "15 or more"];
const YIELD_UNITS = ["tonnes per acre", "tonnes per vigha", "quintal per acre", "quintal per vigha", "kg per plant", "kg per tree"];
const VARIETIES = { sugarcane: ["Co 86032", "CoC 671", "Co 0238", "CoM 0265", "Co 86002", "CoVSI 9805", "Co 0118"], mango: ["Kesar", "Alphonso (Hapus)", "Rajapuri", "Langra", "Dashehari", "Totapuri", "Amrapali"], potato: ["Kufri Jyoti", "Kufri Pukhraj", "Lady Rosetta", "Kufri Chipsona", "Santana"], banana: ["Grand Naine (G9)", "Robusta", "Shrimanti", "Basrai"], apple: ["Royal Delicious", "Red Delicious", "Gala", "Granny Smith", "Fuji"], pomegranate: ["Bhagwa", "Ganesh", "Ruby", "Mridula"], citrus: ["Nagpur mandarin", "Kagzi lime", "Mosambi", "Kinnow"], onion: ["Agrifound Light Red", "N-53", "Bhima Super", "Pusa Red"], cotton: [], groundnut: ["GG 20", "GJG 32", "TG 37A", "Kadiri 6"] };
const RATOON = ["sugarcane", "banana"];
const VIGHA = [[24, "24 guntha (Vadodara, Surat, Navsari, Valsad, Tapi, Amreli, North Gujarat)"], [20, "20 guntha (Bharuch)"], [16, "16 guntha (Saurashtra)"], [13, "13 guntha (Kodinar, Morbi, Vankaner)"]];
const vighaOpts = cur => `<option value="">Choose vigha size</option>` + VIGHA.map(([g, l]) => `<option value="${g}" ${+cur === g ? "selected" : ""}>${l}</option>`).join("");
const PESTS = {
  sugarcane: { pests: ["Early shoot borer", "Top shoot borer", "Internode borer", "White grub", "Termites", "Woolly aphid", "Pyrilla", "Scale insect", "Mealybug", "Whitefly"],
               diseases: ["Red rot", "Smut (whip)", "Wilt", "Grassy shoot", "Pokkah boeng", "Rust", "Ratoon stunting", "Leaf scald", "Yellow leaf disease"] },
  mango: { pests: ["Mango hopper", "Mealybug", "Fruit fly", "Stem borer", "Thrips", "Leaf webber", "Gall midge / psylla", "Stone weevil", "Scale insect"],
           diseases: ["Powdery mildew", "Anthracnose", "Malformation", "Bacterial canker (black spot)", "Sooty mould", "Dieback", "Gummosis", "Stem-end rot", "Red rust"] } };
const PESTS_ANY = { pests: ["Sucking pests (aphid, jassid, whitefly, thrips)", "Mites", "Borers", "Leaf-eating caterpillars", "Fruit fly", "Termites or white grub", "Nematodes"], diseases: ["Fungal leaf spots or blight", "Powdery or downy mildew", "Root rot or wilt", "Bacterial disease", "Viral disease (leaf curl, mosaic)"] };
const LEVELS = ["None", "Low", "Medium", "High", "Severe"];
const acresOf = p => !p.area ? null : p.unit === "acre" ? +p.area : p.unit === "hectare" ? p.area * 2.471 : p.vigha_guntha ? p.area * p.vigha_guntha / 40 : null;
const COUNT_LABEL = { sugarcane: "Average tillers per clump", paddy: "Average tillers per hill", cereals: "Average tillers per plant", banana: "Suckers per plant" };
function issueList(slug) {
  if (slug === "sugarcane") return ["Poor germination", "Weak growth", "Less tillers", "Low stalk height", "Thin stalks", "Low stalk weight", "Dying of stalks", "Weak crop attacked by pests and diseases", "Unfavourable weather", "Needed more fertilizers", "Increased chemical dependency", "Low recovery / sugar"];
  const c = crop(slug) || { problems: [] };
  return [...new Set(["Poor germination or establishment", "Weak growth"].concat(c.problems, ["Weak crop attacked by pests and diseases", "Unfavourable weather", "Needed more fertilizers", "Increased chemical dependency", "Low yield"]))];
}
const photoUrl = path => path ? `${SB_URL}/storage/v1/object/public/hariyo-fields/${path}` : "";
async function uploadFieldPhoto(file) {
  const blob = await shrink(file), path = `${today()}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from("hariyo-fields").upload(path, blob, { contentType: "image/jpeg" });
  return error ? null : path;
}
const opts = (list, cur) => `<option value="">Choose</option>` + list.map(x => `<option ${x === cur ? "selected" : ""}>${esc(x)}</option>`).join("");
const chips = (name, list, cur) => `<div class="chips">${list.map((x, i) => `<label class="chip"><input type="checkbox" name="${name}" value="${esc(x)}" ${(cur || []).includes(x) ? "checked" : ""}><span>${esc(x)}</span></label>`).join("")}</div>`;
const checked = name => [...document.querySelectorAll(`[name="${name}"]:checked`)].map(i => i.value);
const upcoming = p => (ME.activities || []).filter(a => a.plot_id === p.id && a.happened_on > today()).sort((a, b) => a.happened_on < b.happened_on ? -1 : 1);
const lastObs = p => (ME.observations || []).find(o => o.plot_id === p.id);

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
    <label for="vg">Your vigha size</label><select id="vg">${vighaOpts()}<option value="0">I measure in acres</option></select>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">Start using Hariyo</button>
    <p class="small muted" style="margin-top:10px">We use your number only to help you with your crop. We never share it.</p>
  </form>`);
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#b").disabled = true; $("#e").textContent = "";
    const { data, error } = await sb.rpc("hariyo_register", { p_name: $("#n").value, p_phone: $("#p").value, p_village: $("#v").value, p_district: $("#d").value, p_state: $("#s").value, p_vigha: +$("#vg").value || null });
    if (error) { $("#e").textContent = error.message.includes("10-digit") ? "Please enter your name and a 10-digit mobile number." : "Could not save. Check your internet and try again."; $("#b").disabled = false; return; }
    TOKEN = data; store.set("hariyo_token", data); await loadMe(); go(next || "#/farm");
  };
}
const needMe = next => { if (!ME) { signup(next); return false; } return true; };

/* ---------- Home: all fields as tiles ---------- */
function tile(p) {
  const c = crop(p.crop); if (!c) return "";
  const s = stageOf(c, p.start_date), st = s.idx != null ? c.stages[s.idx] : null;
  const up = upcoming(p)[0];
  return `<a class="tile" href="#/field/${p.id}">
    <div class="tile-photo">${p.photo ? `<img src="${photoUrl(p.photo)}" alt="" loading="lazy">` : `<span>📷</span>`}</div><div class="tile-body">
    <div class="tile-top"><span class="tile-name">${esc(plotName(p))}</span>${areaTxt(p) ? `<span class="tag">${esc(areaTxt(p))}</span>` : ""}</div>
    <div class="tile-crop">${esc(c.name)}</div>
    <div class="tile-age">${s.day != null ? `Day ${Math.max(s.day, 0)}` : new Date().toLocaleDateString("en-IN", { month: "long" })}</div>
    <div class="tile-stage">${st ? esc(st.name) : "Care all year"}${s.next ? `<span> · next: ${esc(c.stages[s.next.idx].name.split(" and ")[0])} in ${s.next.inDays} d</span>` : ""}</div>
    <div class="stem sm" aria-hidden="true">${c.stages.map((_, i) => `<i class="${s.idx == null ? "" : i < s.idx ? "done" : i === s.idx ? "now" : ""}"></i>`).join("")}</div>
    ${up ? `<div class="tile-date">Next: ${esc(kind(up.kind).l.split(" (")[0])} on ${new Date(up.happened_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>` : ""}
    <div class="tile-next">${esc(nextAction(p))}</div></div></a>`;
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
  const acts = (ME.activities || []).filter(a => a.plot_id === p.id && a.happened_on <= today());
  const ups = upcoming(p), obs = (ME.observations || []).filter(o => o.plot_id === p.id), lo = obs[0];
  const cases = (ME.cases || []).filter(x => x.plot_id === p.id);
  const fertOrder = acts.filter(a => a.kind === "fert").sort((a, b) => a.happened_on < b.happened_on ? -1 : 1).map(a => a.id);
  const items = [
    ...acts.map(a => ({ d: a.happened_on, html: diaryAct(a, fertOrder) })),
    ...cases.map(x => ({ d: x.happened_on || x.created_at.slice(0, 10), html: diaryCase(x) })),
    ...obs.map(o => ({ d: o.observed_on, html: diaryObs(o, c) })),
    ...(p.start_date ? [{ d: p.start_date, html: `<li class="ev"><span class="ev-i">🌾</span><div><div class="ev-d">${fmtDate(p.start_date)}</div><strong>${esc(c.timing.label || "Planted")}</strong></div></li>` }] : [])
  ].sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  const sl = p.soil || {}, wt = p.water || {}, ly = p.last_year || {};
  render(`<p><a href="#/home">← All fields</a></p>${quote(CROPS.indexOf(c) + 1)}
  ${p.photo ? `<img class="field-photo" src="${photoUrl(p.photo)}" alt="${esc(plotName(p))} crop photo">` : `<a class="field-photo empty" href="#/obs/${p.id}">📷 Add a photo of this field</a>`}
  <section class="season"><div class="crop">${esc(plotName(p))} · ${esc(c.name)}${areaTxt(p) ? " · " + esc(areaTxt(p)) : ""}</div>
    ${s.day != null ? `<div class="day">Day ${Math.max(s.day, 0)}<small>since ${fmtDate(p.start_date)}</small></div>` : `<div class="day" style="font-size:2.2rem">${new Date().toLocaleDateString("en-IN", { month: "long" })}</div>`}
    <div class="stage">${st ? esc(st.name) : "Care all year"}</div>
    <div class="stem" aria-hidden="true">${c.stages.map((_, i) => `<i class="${s.idx == null ? "" : i < s.idx ? "done" : i === s.idx ? "now" : ""}"></i>`).join("")}</div>
    <div class="stem-l" aria-hidden="true">${c.stages.map(x => `<span>${esc(x.name.split(" and ")[0].split(",")[0])}</span>`).join("")}</div>
    ${st ? `<div class="what"><p style="margin:0">${esc(st.text)}</p></div>` : ""}
    <div class="what next"><strong>Next action:</strong> ${esc(nextAction(p))}${s.next ? `<br><span class="small">Next stage, ${esc(c.stages[s.next.idx].name)}, in about ${s.next.inDays} days.</span>` : ""}</div>
  </section>
  <div class="act-grid"><a class="btn" href="#/obs/${p.id}">📷 Update crop status</a><a class="btn" href="#/log/${p.id}">+ Add or plan a dose / work</a><a class="btn tur" href="#/help?field=${p.id}">⚠️ Report a problem</a><a class="btn alt" href="#/profile/${p.id}">Field profile</a></div>
  ${ups.length ? `<div class="card"><h2>Coming up</h2><ul class="diary">${ups.map(a => `<li class="ev up"><span class="ev-i">${kind(a.kind).icon}</span><div><div class="ev-d">${fmtDate(a.happened_on)} · planned</div><strong>${esc(kind(a.kind).l)}</strong>${a.product ? `<div>${esc(a.product)}</div>` : ""}<button class="x" data-delact="${a.id}">Delete</button></div></li>`).join("")}</ul></div>` : ""}
  ${lo ? `<div class="card"><h2>Crop status on ${fmtDate(lo.observed_on)}</h2>${obsFacts(lo, c)}</div>` : ""}
  <div class="card"><div class="plot"><h2>Field profile</h2><a class="x" href="#/profile/${p.id}">Edit</a></div>
    <dl class="facts">${[["Variety", p.variety], ["Planting", p.plant_type], ["Soil", [sl.type, sl.condition].filter(Boolean).join(", ")], ["Soil pH", sl.ph], ["Soil EC", sl.ec], ["Water", [wt.source === "Other" ? wt.other : wt.source, wt.method].filter(Boolean).join(", ")], ["Water pH / EC / TDS", [wt.ph, wt.ec, wt.tds].some(Boolean) ? [wt.ph || "-", wt.ec || "-", wt.tds || "-"].join(" / ") : ""], ["Area", acreTxt(p) ? areaTxt(p) + ", " + acreTxt(p) : ""], ["Pests and diseases this year", pestTxt((p.pests || {}).this)], ["Pests and diseases last year", pestTxt((p.pests || {}).last)]].filter(x => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("") || `<dd class="muted">Add soil, water and variety details so our expert can advise better.</dd>`}</dl>
    ${(p.issues || []).length ? `<h3>Problems this year</h3><p>${p.issues.map(x => `<span class="tag new">${esc(x)}</span>`).join(" ")}</p>` : ""}
    ${ly.yield || (ly.problems || []).length ? `<h3>Last year</h3><p class="small">${ly.variety ? esc(ly.variety) + " · " : ""}${ly.yield ? esc(ly.yield + " " + (ly.yield_unit || "")) : ""}</p>${(ly.problems || []).length ? `<p>${ly.problems.map(x => `<span class="tag">${esc(x)}</span>`).join(" ")}</p>` : ""}` : ""}</div>
  <h2>Field diary</h2>
  ${items.length ? `<ul class="diary">${items.map(i => i.html).join("")}</ul>` : `<div class="card empty"><p class="muted">Nothing recorded yet. Start with your planting date and basal dose.</p></div>`}
  ${product(c)}
  <p class="small"><a href="#/crop/${c.slug}">Full ${esc(c.name.toLowerCase())} guide</a> · <a href="#/farm?edit=${p.id}">Edit field</a></p>`);
  document.querySelectorAll("[data-delact]").forEach(b => b.onclick = async () => {
    if (!confirm("Delete this entry?")) return;
    await sb.rpc("hariyo_del_activity", { p_token: TOKEN, p_id: b.dataset.delact }); await loadMe(); field(id);
  });
  document.querySelectorAll("[data-delobs]").forEach(b => b.onclick = async () => {
    if (!confirm("Delete this status update?")) return;
    await sb.rpc("hariyo_del_obs", { p_token: TOKEN, p_id: b.dataset.delobs }); await loadMe(); field(id);
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
function obsFacts(o, c) {
  const f = [["Crop looks", o.look], ["Germination", o.germination], [COUNT_LABEL[c.slug] || "Average shoots or branches per plant", o.count_band], ["Average height", o.height ? `${+o.height} ${o.height_unit || ""}` : ""]].filter(x => x[1]);
  return `${o.photo ? `<img class="obs-photo" src="${photoUrl(o.photo)}" alt="Crop photo" loading="lazy">` : ""}<dl class="facts">${f.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>${o.note ? `<p class="small">${esc(o.note)}</p>` : ""}`;
}
function diaryObs(o, c) {
  return `<li class="ev"><span class="ev-i">📷</span><div><div class="ev-d">${fmtDate(o.observed_on)}</div><strong>Crop status${o.look ? ": " + esc(o.look) : ""}</strong>${obsFacts(Object.assign({}, o, { look: null }), c)}<button class="x" data-delobs="${o.id}">Delete</button></div></li>`;
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
  render(`<p><a href="#/field/${p.id}">← ${esc(plotName(p))}</a></p><h1>Add or plan</h1><p class="muted">${esc(plotName(p))} · ${esc(c.name)}</p>
  <form class="card" id="f">
    <label for="k">What did you do?</label><select id="k">${KINDS.map(k => `<option value="${k.k}">${k.icon} ${esc(k.l)}</option>`).join("")}</select>
    <label for="dt">Date</label><input id="dt" type="date" value="${today()}"><p class="small muted" style="margin:4px 0 0">Choose a future date to plan it. Planned work shows on the field tile.</p>
    <div id="fx">
      <label for="pr">Fertilizer or product name</label><input id="pr" list="pl" placeholder="Type or choose"><datalist id="pl">${prods.map(x => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="row"><div><label for="q">Quantity</label><input id="q" type="number" inputmode="decimal" min="0" step="any"></div>
      <div><label for="qu">Unit</label><select id="qu"><option>kg</option><option>g</option><option>bags</option><option>L</option><option>ml</option></select></div></div>
      <label for="pu">Quantity is</label><select id="pu"><option value="${p.unit === "vigha" ? "vigha" : "acre"}">per ${p.unit === "vigha" ? `vigha${p.vigha_guntha ? ` (${p.vigha_guntha} guntha)` : ""}` : "acre"}</option><option value="${p.unit === "vigha" ? "acre" : "vigha"}">per ${p.unit === "vigha" ? "acre" : "vigha"}</option><option value="plant">per plant / tree</option><option value="total">total for this field</option></select>
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

/* ---------- Field profile: photo, variety, soil, water, this year and last year ---------- */
function profileForm(id) {
  setTab("home");
  if (!needMe(location.hash)) return;
  const p = plotById(id); if (!p) return home();
  const c = crop(p.crop), sl = p.soil || {}, wt = p.water || {}, ly = p.last_year || {}, iss = issueList(c.slug), PL = PESTS[c.slug] || PESTS_ANY;
  render(`<p><a href="#/field/${p.id}">← ${esc(plotName(p))}</a></p><h1>Field profile</h1><p class="muted">${esc(plotName(p))} · ${esc(c.name)}. The more you fill in, the better our expert can advise.</p>
  <form class="card" id="f">
    <h2>Field photo</h2>
    <div class="row"><label class="btn alt pick">📷 Take photo<input id="cam" type="file" accept="image/*" capture="environment" hidden></label><label class="btn alt pick">🖼️ From gallery<input id="gal" type="file" accept="image/*" hidden></label></div>
    <div class="thumbs" id="th">${p.photo ? `<img src="${photoUrl(p.photo)}" alt="Current field photo">` : ""}</div>
    <h2>Crop</h2>
    <label for="va">Variety</label><input id="va" list="vl" value="${esc(p.variety || "")}" placeholder="Type or choose"><datalist id="vl">${(VARIETIES[c.slug] || []).map(v => `<option value="${esc(v)}">`).join("")}</datalist>
    ${RATOON.includes(c.slug) ? `<label for="pt">Planting type</label><select id="pt">${opts(["New planting (Ropan)", "Ratoon (Lam) 1st", "Ratoon (Lam) 2nd", "Ratoon (Lam) 3rd or more"], p.plant_type)}</select>` : ""}
    <h2>Soil</h2>
    <div class="row"><div><label for="st">Soil type</label><select id="st">${opts(SOIL_TYPES, sl.type)}</select></div><div><label for="sc">Soil condition</label><select id="sc">${opts(SOIL_COND, sl.condition)}</select></div></div>
    <div class="row"><div><label for="sp">Soil pH</label><select id="sp">${opts(PH_BANDS, sl.ph)}</select></div><div><label for="se">Soil EC (salts)</label><select id="se">${opts(LNH, sl.ec)}</select></div></div>
    <h2>Water</h2>
    <div class="row"><div><label for="ws">Irrigation source</label><select id="ws">${opts(WATER_SRC, wt.source)}</select></div><div><label for="wm">Irrigation method</label><select id="wm">${opts(IRR_METHOD, wt.method)}</select></div></div>
    <div id="wow"><label for="wo">Please specify</label><input id="wo" value="${esc(wt.other || "")}"></div>
    <div class="row three"><div><label for="wp">Water pH</label><select id="wp">${opts(LNH, wt.ph)}</select></div><div><label for="we">Water EC</label><select id="we">${opts(LNH, wt.ec)}</select></div><div><label for="wd">Water TDS</label><select id="wd">${opts(LNH, wt.tds)}</select></div></div>
    <h2>Problems this year</h2>${chips("iy", iss, p.issues)}
    ${pestBlock("Pest and disease attack this year", "pt", (p.pests || {}).this, PL)}
    <h2>Last year</h2>
    <label for="lv">Variety last year</label><input id="lv" list="vl" value="${esc(ly.variety || "")}">
    <div class="row"><div><label for="ly">Yield</label><input id="ly" type="number" inputmode="decimal" min="0" step="any" value="${esc(ly.yield || "")}"></div><div><label for="lu">Unit</label><select id="lu">${YIELD_UNITS.map(u => `<option ${u === ly.yield_unit ? "selected" : ""}>${u}</option>`).join("")}</select></div></div>
    <label>Problems faced last year</label>${chips("ly", iss, ly.problems)}
    ${pestBlock("Pest and disease attack last year", "pl", (p.pests || {}).last, PL)}
    <label for="ln">Anything else about last season? (optional)</label><input id="ln" value="${esc(ly.note || "")}">
    <label class="flag"><input type="checkbox" id="fl"> Share this year's problems with our expert now</label>
    <p class="err" id="e" role="alert"></p><button class="btn full" id="b">Save field profile</button></form>`);
  const syncW = () => { $("#wow").style.display = $("#ws").value === "Other" ? "" : "none"; };
  $("#ws").onchange = syncW; syncW();
  let file = null;
  const pick = e => { file = e.target.files[0] || file; if (file) $("#th").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="New field photo">`; };
  $("#cam").onchange = pick; $("#gal").onchange = pick;
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#b").disabled = true; $("#b").textContent = "Saving…";
    let photo = null; if (file) { try { photo = await uploadFieldPhoto(file); } catch (e) {} }
    const issues = checked("iy");
    const { error } = await sb.rpc("hariyo_save_profile", { p_token: TOKEN, p_id: p.id, p_variety: $("#va").value, p_plant_type: $("#pt") ? $("#pt").value : null,
      p_soil: { type: $("#st").value, condition: $("#sc").value, ph: $("#sp").value, ec: $("#se").value },
      p_water: { source: $("#ws").value, other: $("#ws").value === "Other" ? $("#wo").value.trim() : "", method: $("#wm").value, ph: $("#wp").value, ec: $("#we").value, tds: $("#wd").value },
      p_last_year: { variety: $("#lv").value.trim(), yield: $("#ly").value, yield_unit: $("#lu").value, problems: checked("ly"), note: $("#ln").value.trim() },
      p_issues: issues, p_pests: { this: pestVal("pt"), last: pestVal("pl") }, p_photo: photo });
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; $("#b").textContent = "Save field profile"; return; }
    if ($("#fl").checked && issues.length) {
      await sb.rpc("hariyo_add_case", { p_token: TOKEN, p_plot: p.id, p_crop: c.slug, p_issue: issues.slice(0, 3).join(", ") + (issues.length > 3 ? " and more" : ""), p_severity: null, p_date: today(), p_problem: "Problems this year: " + issues.join("; "), p_photos: [] });
    }
    await loadMe(); go(`#/field/${p.id}`);
  };
}

function pestBlock(title, key, cur, PL) {
  cur = cur || {};
  return `<h3 style="margin-top:14px">${esc(title)}</h3><label for="${key}lv">Overall attack</label><select id="${key}lv">${opts(LEVELS, cur.level)}</select>
  <label>Pests</label>${chips(key + "p", PL.pests, cur.pests)}<label>Diseases</label>${chips(key + "d", PL.diseases, cur.diseases)}
  <label for="${key}o">Other pest or disease (optional)</label><input id="${key}o" value="${esc(cur.other || "")}">`;
}
const pestVal = key => ({ level: $("#" + key + "lv").value, pests: checked(key + "p"), diseases: checked(key + "d"), other: $("#" + key + "o").value.trim() });
const pestTxt = x => x && (x.level || (x.pests || []).length || (x.diseases || []).length || x.other) ? [x.level && x.level !== "None" ? x.level + " attack" : x.level === "None" ? "No attack" : "", ...(x.pests || []), ...(x.diseases || []), x.other].filter(Boolean).join(", ") : "";

/* ---------- Crop status update: photo, how it looks, germination, tillers, height ---------- */
function obsForm(id) {
  setTab("home");
  if (!needMe(location.hash)) return;
  const p = plotById(id); if (!p) return home();
  const c = crop(p.crop), sown = c.timing.mode === "days";
  render(`<p><a href="#/field/${p.id}">← ${esc(plotName(p))}</a></p><h1>Update crop status</h1><p class="muted">${esc(plotName(p))} · ${esc(c.name)}. A photo every week or two shows how your crop is changing.</p>
  <form class="card" id="f">
    <label>Photo of the crop today</label>
    <div class="row"><label class="btn alt pick">📷 Take photo<input id="cam" type="file" accept="image/*" capture="environment" hidden></label><label class="btn alt pick">🖼️ From gallery<input id="gal" type="file" accept="image/*" hidden></label></div>
    <div class="thumbs" id="th"></div>
    <label class="flag"><input type="checkbox" id="sp" checked> Use this photo as the field picture</label>
    <label for="dt">Date</label><input id="dt" type="date" value="${today()}" max="${today()}">
    <label>How does the crop look?</label><div class="sevs">${LOOKS.map((l, i) => `<label class="sev-opt"><input type="radio" name="lk" value="${l}" ${i === 1 ? "checked" : ""}><span class="sev look-${i}">${l}</span></label>`).join("")}</div>
    ${sown ? `<label for="gm">Germination</label><select id="gm">${opts(GERM)}</select>` : ""}
    <label for="cb">${esc(COUNT_LABEL[c.slug] || "Average shoots or branches per plant")}</label><select id="cb">${opts(COUNT)}</select>
    <div class="row"><div><label for="ht">Average height</label><input id="ht" type="number" inputmode="decimal" min="0" step="any"></div><div><label for="hu">Unit</label><select id="hu"><option>feet</option><option>inches</option><option>cm</option></select></div></div>
    <label for="nt">Note (optional)</label><input id="nt" placeholder="Example: lower leaves yellowing in one corner">
    <p class="err" id="e" role="alert"></p><button class="btn full" id="b">Save status</button></form>`);
  let file = null;
  const pick = e => { file = e.target.files[0] || file; if (file) $("#th").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Crop photo">`; };
  $("#cam").onchange = pick; $("#gal").onchange = pick;
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); $("#b").disabled = true; $("#b").textContent = "Saving…";
    let photo = null; if (file) { try { photo = await uploadFieldPhoto(file); } catch (e) {} }
    const { error } = await sb.rpc("hariyo_add_obs", { p_token: TOKEN, p_plot: p.id, p_date: $("#dt").value || today(), p_photo: photo,
      p_look: (document.querySelector("[name=lk]:checked") || {}).value || null, p_germ: $("#gm") ? $("#gm").value || null : null, p_count: $("#cb").value || null,
      p_height: $("#ht").value ? Number($("#ht").value) : null, p_hunit: $("#hu").value, p_note: $("#nt").value.trim() || null, p_set_photo: $("#sp").checked });
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; $("#b").textContent = "Save status"; return; }
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
  ${!ed ? accountCard() : ""}
  <form class="card" id="f"><h2>${ed ? "Edit field" : "Add a field"}</h2>
    <label for="fn">Field name</label><input id="fn" placeholder="Example: Well-side field, Survey 112" value="${esc(ed ? ed.name || "" : "")}">
    <label for="c">Crop</label><select id="c" ${ed ? "disabled" : ""}>${CROPS.map(c => `<option value="${c.slug}" ${c.slug === pre ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
    <div class="row"><div><label for="a">Area</label><input id="a" type="number" inputmode="decimal" min="0" step="any" value="${ed && ed.area ? +ed.area : ""}"></div>
    <div><label for="u">Unit</label><select id="u">${Object.keys(UNITS).map(u => `<option value="${u}" ${(ed ? ed.unit === u : (ME.farmer.vigha_guntha ? u === "vigha" : u === "acre")) ? "selected" : ""}>${UNITS[u]}</option>`).join("")}</select></div></div>
    <div id="gw"><label for="g">Vigha size</label><select id="g">${vighaOpts(ed ? ed.vigha_guntha || ME.farmer.vigha_guntha : ME.farmer.vigha_guntha)}</select></div>
    <div id="dl"><label for="sd" id="sdl">Planting date</label><input id="sd" type="date" max="${today()}" value="${ed && ed.start_date ? ed.start_date : ""}"></div>
    <p class="err" id="e" role="alert"></p>
    <button class="btn full" id="b">${ed ? "Save changes" : "Save field"}</button>${ed ? `<p style="margin-top:10px"><a href="#/field/${ed.id}">Cancel</a></p>` : ""}</form>`);
  const sync = () => { const c = crop($("#c").value); $("#dl").style.display = c.timing.mode === "days" ? "" : "none"; $("#sdl").textContent = c.timing.label || "Date"; $("#gw").style.display = $("#u").value === "vigha" ? "" : "none"; };
  $("#c").onchange = sync; $("#u").onchange = sync; sync();
  $("#f").onsubmit = async ev => {
    ev.preventDefault(); const c = crop($("#c").value);
    if (c.timing.mode === "days" && !$("#sd").value) { $("#e").textContent = "Please choose the date."; return; }
    if ($("#u").value === "vigha" && !$("#g").value) { $("#e").textContent = "Please choose your vigha size (24, 20, 16 or 13 guntha)."; return; }
    $("#b").disabled = true;
    const args = { p_token: TOKEN, p_name: $("#fn").value, p_area: $("#a").value ? Number($("#a").value) : null, p_unit: $("#u").value, p_guntha: $("#u").value === "vigha" ? +$("#g").value : null, p_start: c.timing.mode === "days" ? $("#sd").value : null };
    const { data, error } = ed ? await sb.rpc("hariyo_update_plot", Object.assign(args, { p_id: ed.id })) : await sb.rpc("hariyo_add_plot", Object.assign(args, { p_crop: c.slug }));
    if (error) { $("#e").textContent = "Could not save. Try again."; $("#b").disabled = false; return; }
    await loadMe(); go(ed ? `#/field/${ed.id}` : `#/field/${data}`);
  };
  if ($("#af")) bindAccount(q);
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm("Remove this field and its diary?")) return;
    await sb.rpc("hariyo_del_plot", { p_token: TOKEN, p_id: b.dataset.del }); await loadMe(); farm(q);
  });
}

/* ---------- Account: vigha size and delivery address ---------- */
const ADDR = [["name", "Full name", "name"], ["phone", "Mobile number", "tel"], ["alt", "Alternate mobile (optional)", "tel"], ["line1", "House / plot / street", "address-line1"], ["line2", "Area / landmark", "address-line2"],
  ["city", "Village / city", "address-level3"], ["taluka", "Taluka", ""], ["district", "District", "address-level2"], ["state", "State", "address-level1"], ["pin", "PIN code", "postal-code"]];
const addrLine = a => a && a.line1 ? [a.name, a.line1, a.line2, a.city, a.taluka && "Ta. " + a.taluka, a.district && "Dist. " + a.district, a.state, a.pin && "PIN " + a.pin, a.phone && "Mobile " + a.phone].filter(Boolean).join(", ") : "";
function accountCard() {
  const f = ME.farmer, a = f.address || {};
  const def = { name: f.name, phone: f.phone, city: f.village, district: f.district, state: f.state };
  return `<details class="card" ${!a.line1 ? "" : ""}><summary><strong>Delivery address and vigha size</strong><div class="small muted">${a.line1 ? esc(addrLine(a)) : "Add your postal or courier address for product delivery."}${f.vigha_guntha ? ` · Vigha: ${f.vigha_guntha} guntha` : ""}</div></summary>
  <form id="af"><label for="avg">Your vigha size</label><select id="avg">${vighaOpts(f.vigha_guntha)}</select>
  ${ADDR.map(([k, l, ac]) => `<label for="a_${k}">${l}</label><input id="a_${k}" ${ac ? `autocomplete="${ac}"` : ""} ${k === "pin" ? 'inputmode="numeric" maxlength="6"' : ""} ${k === "phone" || k === "alt" ? 'type="tel" inputmode="numeric"' : ""} value="${esc(a[k] ?? def[k] ?? "")}">`).join("")}
  <p class="err" id="ae" role="alert"></p><button class="btn full" id="ab">Save address</button></form></details>`;
}
function bindAccount(q) {
  $("#af").onsubmit = async ev => {
    ev.preventDefault(); const a = {}; ADDR.forEach(([k]) => a[k] = $("#a_" + k).value.trim());
    if (a.pin && !/^\d{6}$/.test(a.pin)) { $("#ae").textContent = "PIN code must be 6 digits."; return; }
    if (a.line1 && (!a.city || !a.district || !a.pin)) { $("#ae").textContent = "Please fill village/city, district and PIN code."; return; }
    $("#ab").disabled = true;
    const { error } = await sb.rpc("hariyo_save_account", { p_token: TOKEN, p_vigha: +$("#avg").value || null, p_address: a });
    if (error) { $("#ae").textContent = "Could not save. Try again."; $("#ab").disabled = false; return; }
    await loadMe(); farm(q);
  };
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
  <a class="btn tur" href="${wa(`Hi, I want to order ${p.name} for my ${c.name.toLowerCase()}. Please share price and delivery.${ME && ME.farmer.address && ME.farmer.address.line1 ? "\nDelivery address: " + addrLine(ME.farmer.address) : ""}`)}" target="_blank" rel="noopener">Order on WhatsApp</a></div></div>`;
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
  if (parts[0] === "profile") return profileForm(parts[1]);
  if (parts[0] === "obs") return obsForm(parts[1]);
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
