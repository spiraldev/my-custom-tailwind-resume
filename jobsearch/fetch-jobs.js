#!/usr/bin/env node
/**
 * Daily remote-job fetcher — LinkedIn, Indeed, Dice.
 *
 *   node jobsearch/fetch-jobs.js [--out FILE] [--headless] [--max-details N] [--boards a,b]
 *
 * Emits one JSON document (see SHAPE below) to --out, or stdout when --out is absent.
 * Scoring happens downstream in DAILY_JOB_SEARCH.md — this file only gathers facts.
 *
 * Why a real browser: Indeed serves "Blocked - Indeed.com" to headless Chrome and to
 * plain fetch, and Dice's search page is a JS shell that renders nothing to a fetcher.
 * A headed Chrome with a persistent profile clears both. Run headed unless you are
 * debugging — --headless will silently cost you the whole Indeed board.
 *
 * Each board gets its own Chrome profile. Indeed's Cloudflare will flag a profile that
 * has been hit too often and then serve it "Just a moment..." forever; a wiped profile
 * clears the challenge on the first request. So a challenge is treated as recoverable:
 * wipe that board's profile, relaunch, and resume from what has already been collected.
 *
 * LinkedIn is the exception: its unauthenticated guest endpoints return both the result
 * cards and the full job description as plain HTML, so it needs no browser at all.
 *
 * SHAPE
 *   { ranAt, themes, boards: { <board>: { scanned, kept, ok, note } }, jobs: [ Job ] }
 *   Job = { source, term, title, company, location, posted, salary, employment, url, description }
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEEN_FILE = path.join(__dirname, "state", "seen.json");
const PROFILE_ROOT = path.join(process.env.HOME, ".cache", "jobsearch-chrome");

/* The four themes worth scanning, expanded into the phrasings each board indexes. */
const THEMES = [
  "coldfusion",
  "node.js",
  "nestjs",
  "staff engineer",
  "lead software engineer",
  "principal engineer",
];

/* Titles that can never clear the fit bar. Filtering here keeps us from spending a
   detail-page fetch on a job the rubric would hard-gate anyway. */
const TITLE_REJECT = new RegExp(
  [
    /* Wrong level or not an engineering seat at all. */
    "intern|internship|junior|jr\\.?|entry[- ]level|apprentice|graduate|associate engineer",
    "recruiter|sales|account executive|product manager|program manager|project manager",
    "scrum master|business analyst|qa (analyst|engineer|tester)|test engineer|sdet",
    /* Adjacent software disciplines he has not worked in. */
    "data scientist|machine learning|ml engineer|ai researcher|nlp engineer",
    "mobile|android|ios|salesforce|servicenow|workday|sap |wordpress|drupal|sharepoint",
    "power ?bi|tableau|databricks|game (developer|engineer)",
    "sre\\b|site reliability|devops engineer|security engineer|network engineer|dba\\b",
    /* Hardware and adjacent engineering — "staff engineer" drags these in by the dozen. */
    "electrical|electronics|hardware|silicon|serdes|asic|fpga|rtl\\b|analog|photonics",
    "semiconductor|compiler|robotics|thermal|mechanical|optical|firmware|embedded",
    "emulation|verification|validation|manufacturing|controls|aerospace|mission|rf\\b",
    /* IT/ops "systems engineer" outnumbers distributed-systems software roles. */
    "systems engineer|quality (design )?engineer|field|consultant|technician",
  ].join("|"),
  "i"
);

/* Primary stacks he has not shipped. A title leading with one of these is not his job. */
const STACK_REJECT =
  /\b(java|\.net|c#|c\+\+|python|golang|go developer|ruby|rails|php|laravel|kotlin|scala|rust|perl|cobol|abap|flutter|react native)\b/i;

/* Roles gated on an active security clearance are a hard no. The title never says so —
   only the description does — so this is applied after the detail fetch, in main().
   Kept tight to the gate wording: "Citizens Only" alone is fine, a clearance is not,
   so this matches clearance terms only, never citizenship or suitability language. */
const CLEARANCE_REJECT = new RegExp(
  [
    "security clearance",
    "\\bactive\\b[^.]{0,20}\\bclearance\\b",
    "\\bclearance\\b[^.]{0,15}\\b(is\\s+)?required\\b",
    "must[^.]{0,40}\\bclearance\\b",
    "(obtain|maintain|possess|hold|eligible for)[^.]{0,25}\\bclearance\\b",
    "ts/sci|top[- ]?secret\\s*/?\\s*sci|top[- ]?secret[^.]{0,20}clearance",
    "\\bsecret\\b[^.]{0,15}clearance",
    "polygraph",
  ].join("|"),
  "i"
);

function needsClearance(text) {
  return CLEARANCE_REJECT.test(text || "");
}

/* Postings older than this (in days) are dropped before scoring. Dice/Indeed
   often show a fresh "updated Nh ago" over a months-old post; we parse the
   original age, not the update. */
const MAX_AGE_DAYS = 30;

/* Best-effort age in days from a board's freeform "posted" string. Returns null
   when the format can't be read — callers must KEEP on null, never drop on a
   guess. The deceptive "(updated 3h ago)" suffix is stripped first so a stale
   post can't masquerade as fresh. */
function postedAgeDays(posted, now = new Date()) {
  if (!posted) return null;
  let s = String(posted).toLowerCase().replace(/\([^)]*\)/g, " ").trim();
  if (!s) return null;

  // Fresh: same-day / hours / minutes / "last 24h" phrasings.
  if (/\b(today|just posted|just now|posted today|active today|new)\b/.test(s)) return 0;
  if (/\b(hour|hours|minute|minutes|min|mins)\b|\bh\s*ago\b|last\s*24\s*h|24h\b/.test(s)) return 0;
  if (/\byesterday\b/.test(s)) return 1;

  const num = (m) => (/^an?$/.test(m) ? 1 : parseInt(m, 10));

  // "30+ days ago" — the plus means at least N, so push just past the boundary.
  let m = s.match(/(\d+)\s*\+\s*days?/);
  if (m) return parseInt(m[1], 10) + 1;

  m = s.match(/\b(\d+|an?)\s*years?\b/);
  if (m) return num(m[1]) * 365;
  m = s.match(/\b(\d+|an?)\s*months?\b/);
  if (m) return num(m[1]) * 31; // a month is ≥30d → over the gate
  m = s.match(/\b(\d+|an?)\s*weeks?\b/);
  if (m) return num(m[1]) * 7;
  m = s.match(/\b(\d+|an?)\s*days?\b/);
  if (m) return num(m[1]);

  // ISO date or parseable date string (LinkedIn datetime="…").
  const iso = s.match(/\d{4}-\d{2}-\d{2}(t[\d:.+z-]*)?/);
  const t = Date.parse(iso ? iso[0] : s);
  if (!Number.isNaN(t)) {
    const days = Math.floor((now.getTime() - t) / 86400000);
    return days >= 0 ? days : null; // future/garbage date → unknown, keep
  }
  return null;
}

function isStale(posted) {
  const age = postedAgeDays(posted);
  return age !== null && age > MAX_AGE_DAYS;
}

/* A title has to read like a software engineering role before it earns a detail fetch.
   "staff engineer" on Indeed matches field consultants and billing analysts otherwise. */
const TITLE_ACCEPT =
  /\b(engineer|engineering|developer|architect|programmer|swe|full[- ]?stack|fullstack|back[- ]?end|front[- ]?end|software|technical lead|tech lead)\b/i;

/* Signals worth spending a detail fetch on, strongest first. */
const RELEVANCE = [
  [4, /\b(cold ?fusion|cfml|lucee)\b/i],
  [4, /\b(node\.?js|nest\.?js|typescript|javascript|react)\b/i],
  [3, /\b(staff|principal|distinguished)\b/i],
  [2, /\b(lead|senior|sr\.?)\b/i],
  [2, /\b(full[- ]?stack|fullstack|back[- ]?end|platform|api)\b/i],
  [1, /\b(engineer|developer|architect)\b/i],
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const HEADLESS = flag("--headless");
const MAX_DETAILS = Number(opt("--max-details", "22"));
const OUT = opt("--out", "");
const BOARDS = opt("--boards", "linkedin,indeed,dice").split(",").map((s) => s.trim());
const DESC_CHARS = 6000;
const WIPE = flag("--wipe");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => process.stderr.write(m.join(" ") + "\n");

function loadSeen() {
  try {
    const raw = JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
    /* The ledger has held both a bare URL array and {url,seen} records — accept either. */
    return new Set(raw.map((e) => (typeof e === "string" ? e : e.url)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveSeen(seen, jobs) {
  const day = new Date().toISOString().slice(0, 10);
  const merged = [...seen].map((url) => ({ url, seen: day }));
  const known = new Set(seen);
  for (const j of jobs) if (!known.has(j.url)) merged.push({ url: j.url, seen: day });
  fs.mkdirSync(path.dirname(SEEN_FILE), { recursive: true });
  fs.writeFileSync(SEEN_FILE, JSON.stringify(merged, null, 0) + "\n");
}

function clean(s) {
  return (s || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* Cheap pre-filter. Only the title is available at this point, so be conservative:
   reject on an unmistakable signal, let anything ambiguous through to scoring. */
function titlePlausible(title) {
  if (!title) return false;
  if (!TITLE_ACCEPT.test(title)) return false;
  if (TITLE_REJECT.test(title)) return false;
  /* ColdFusion runs on the JVM, so "Java" alongside CF is not a rejection. */
  if (STACK_REJECT.test(title) && !/cold ?fusion|cfml/i.test(title)) return false;
  return true;
}

function relevance(title) {
  return RELEVANCE.reduce((n, [w, re]) => n + (re.test(title) ? w : 0), 0);
}

/* The detail-fetch budget is the expensive resource, so spend it on the most
   promising titles rather than on whichever board happened to answer first. */
function dedupeKey(job) {
  return `${job.title} @ ${job.company}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shortlist(jobs, seen, limit) {
  const byRole = new Map();
  for (const job of jobs) {
    if (seen.has(job.url)) continue;
    if (!titlePlausible(job.title)) continue;
    /* Indeed in particular lists one job under several URLs. */
    if (!byRole.has(dedupeKey(job))) byRole.set(dedupeKey(job), job);
  }
  return [...byRole.values()]
    .sort((a, b) => relevance(b.title) - relevance(a.title))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* LinkedIn — unauthenticated guest endpoints, no browser needed        */
/* ------------------------------------------------------------------ */

async function linkedinCards(term) {
  const out = [];
  for (let page = 0; page < 3; page++) {
    const url =
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?" +
      new URLSearchParams({
        keywords: term,
        location: "United States",
        f_WT: "2", // remote
        f_TPR: "r86400", // last 24h
        start: String(page * 10),
      });

    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA } });
    } catch (err) {
      log(`linkedin "${term}" p${page}: ${err.message}`);
      break;
    }
    if (!res.ok) {
      log(`linkedin "${term}" p${page}: HTTP ${res.status}`);
      break;
    }

    const html = await res.text();
    let found = 0;
    for (const card of html.split("<li>").slice(1)) {
      const title = card.match(/base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/);
      const company = card.match(/base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/);
      const location = card.match(/job-search-card__location"[^>]*>([\s\S]*?)<\/span>/);
      const posted = card.match(/datetime="([^"]+)"/);
      const link = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^?"]+)/);
      if (!title || !link) continue;
      found++;
      out.push({
        source: "linkedin",
        term,
        title: clean(title[1]),
        company: company ? clean(company[1]) : "",
        location: location ? clean(location[1]) : "",
        posted: posted ? posted[1] : "",
        salary: "not listed",
        employment: "not listed",
        url: link[1],
      });
    }
    if (found < 10) break;
    await sleep(1500);
  }
  return out;
}

/* The guest jobPosting endpoint returns the full description without auth — the same
   HTML the public job page renders, minus the login wall. */
async function linkedinDescription(job) {
  const id = job.url.match(/(\d+)(?:\/)?$/);
  if (!id) return "";
  try {
    const res = await fetch(
      `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id[1]}`,
      { headers: { "User-Agent": UA } }
    );
    if (!res.ok) return "";
    const html = await res.text();

    /* Criteria carry seniority and employment type; the description carries the stack. */
    const criteria = [...html.matchAll(
      /description__job-criteria-subheader[^>]*>([\s\S]*?)<\/h3>[\s\S]*?description__job-criteria-text[^>]*>([\s\S]*?)<\/span>/g
    )]
      .map((m) => `${clean(m[1])}: ${clean(m[2])}`)
      .join(" · ");

    const body = html.match(/description__text[\s\S]*?<section[\s\S]*?>([\s\S]*?)<\/section>/);
    const text = clean(body ? body[1] : html);
    return (criteria ? criteria + "\n\n" : "") + text;
  } catch (err) {
    log(`linkedin detail ${job.url}: ${err.message}`);
    return "";
  }
}

async function runLinkedIn(seen, report) {
  let cards = [];
  for (const term of THEMES) {
    cards.push(...(await linkedinCards(term)));
    await sleep(1200);
  }

  const byUrl = new Map();
  for (const c of cards) if (!byUrl.has(c.url)) byUrl.set(c.url, c);
  report.scanned = byUrl.size;

  const fresh = shortlist([...byUrl.values()], seen, MAX_DETAILS);

  const jobs = [];
  for (const job of fresh) {
    job.description = (await linkedinDescription(job)).slice(0, DESC_CHARS);
    jobs.push(job);
    await sleep(900);
  }
  report.kept = jobs.length;
  report.ok = report.scanned > 0;
  if (!report.ok) report.note = "guest endpoint returned nothing (rate limited?)";
  return jobs;
}

/* ------------------------------------------------------------------ */
/* Indeed + Dice — real Chrome                                          */
/* ------------------------------------------------------------------ */

function profilePath(board) {
  return path.join(PROFILE_ROOT, board);
}

function wipeProfile(board) {
  fs.rmSync(profilePath(board), { recursive: true, force: true });
}

async function openBrowser(board) {
  const { chromium } = require("playwright");
  const ctx = await chromium.launchPersistentContext(profilePath(board), {
    channel: "chrome",
    headless: HEADLESS,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    args: ["--disable-blink-features=AutomationControlled", "--window-position=2600,60"],
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  return ctx;
}

function challenge(where) {
  const err = new Error(`bot challenge on ${where}`);
  err.code = "CHALLENGE";
  return err;
}

/* Cloudflare parks us on an interstitial that never resolves once the profile is
   flagged, so treat the title as the signal rather than waiting it out. */
async function assertNotChallenged(page, where) {
  const title = await page.title();
  if (/just a moment|blocked|verify you are human|are you a robot|access denied/i.test(title)) {
    throw challenge(`${where} (${title.trim()})`);
  }
}

/**
 * Run a board's work in its own Chrome profile. On a bot challenge, wipe that
 * profile once and re-run — `work` is expected to skip anything it already
 * recorded in its own accumulators, so the retry resumes rather than restarts.
 */
async function boardSession(board, work) {
  if (WIPE) wipeProfile(board);
  for (let attempt = 0; attempt < 2; attempt++) {
    let ctx;
    try {
      ctx = await openBrowser(board);
      const result = await work(ctx);
      await ctx.close();
      return result;
    } catch (err) {
      if (ctx) await ctx.close().catch(() => {});
      if (err.code === "CHALLENGE" && attempt === 0) {
        log(`${board}: ${err.message} — wiping profile and retrying`);
        wipeProfile(board);
        await sleep(4000);
        continue;
      }
      throw err;
    }
  }
}

async function indeedCards(page, term) {
  const url =
    "https://www.indeed.com/jobs?" +
    new URLSearchParams({ q: term, l: "Remote", fromage: "1" });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4000);
  await assertNotChallenged(page, `indeed search "${term}"`);

  return page.evaluate(() => {
    const text = (root, sel) => {
      const el = root.querySelector(sel);
      return el ? el.innerText.trim() : "";
    };
    return [...document.querySelectorAll(".job_seen_beacon")].map((card) => {
      const a = card.querySelector("h2 a, a.jcs-JobTitle");
      /* Indeed packs pay and job type into the same snippet element. */
      const attrs = [...card.querySelectorAll('[data-testid="attribute_snippet_testid"]')]
        .map((el) => el.innerText.trim());
      return {
        title: a ? a.innerText.trim() : "",
        company: text(card, '[data-testid="company-name"]'),
        location: text(card, '[data-testid="text-location"]'),
        salary: attrs.find((t) => t.includes("$")) || "",
        employment: attrs.find((t) => /time|contract|temporary|internship/i.test(t)) || "",
        posted: text(card, '[data-testid="myJobsStateDate"]'),
        url: a ? a.href : "",
      };
    });
  });
}

async function indeedDescription(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  await assertNotChallenged(page, "indeed detail");
  return page.evaluate(() => {
    const d = document.querySelector("#jobDescriptionText");
    const head = document.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]');
    return (head ? head.innerText.trim() + "\n\n" : "") + (d ? d.innerText.trim() : "");
  });
}

async function runIndeed(seen, report) {
  const byUrl = new Map();
  const searched = new Set();
  const jobs = [];
  const detailed = new Set();

  try {
    await boardSession("indeed", async (ctx) => {
      const page = await ctx.newPage();
      for (const term of THEMES) {
        if (searched.has(term)) continue;
        for (const c of await indeedCards(page, term)) {
          if (!c.url || byUrl.has(c.url)) continue;
          byUrl.set(c.url, { source: "indeed", term, ...c });
        }
        searched.add(term);
        await sleep(6000); // Indeed flags a profile that browses faster than a person
      }

      const fresh = shortlist([...byUrl.values()], seen, MAX_DETAILS);

      for (const job of fresh) {
        if (detailed.has(job.url)) continue;
        job.description = clean(await indeedDescription(page, job.url)).slice(0, DESC_CHARS);
        job.salary = job.salary || "not listed";
        job.employment = job.employment || "not listed";
        job.posted = job.posted || "last 24h (search filter)";
        detailed.add(job.url);
        jobs.push(job);
        await sleep(3000);
      }
    });
  } catch (err) {
    report.ok = false;
    report.note = err.message;
    log(`indeed: ${err.message}`);
  }

  report.scanned = byUrl.size;
  report.kept = jobs.length;
  if (report.ok !== false) report.ok = searched.size > 0;
  if (report.ok && report.scanned === 0) report.note = "no listings matched the themes";
  return jobs;
}

async function diceCards(page, term) {
  const url =
    "https://www.dice.com/jobs?" +
    new URLSearchParams({
      q: term,
      countryCode: "US",
      page: "1",
      pageSize: "20",
      "filters.postedDate": "ONE",
      "filters.workplaceTypes": "Remote",
      language: "en",
    });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(6000);
  await assertNotChallenged(page, `dice search "${term}"`);

  return page.evaluate(() => {
    const isTitleLink = (el) =>
      el.tagName === "A" &&
      el.href.includes("/job-detail/") &&
      el.innerText.trim().length > 0;

    /* Cards carry no stable test id, so climb from the title link to the smallest
       ancestor that still owns exactly one title link — that block is the card. */
    const links = [...document.querySelectorAll('a[href*="/job-detail/"]')].filter(isTitleLink);
    const out = [];
    const seen = new Set();
    for (const a of links) {
      if (seen.has(a.href)) continue;
      seen.add(a.href);
      let node = a;
      for (let i = 0; i < 10 && node.parentElement; i++) {
        const parent = node.parentElement;
        const owned = [...parent.querySelectorAll('a[href*="/job-detail/"]')].filter(isTitleLink);
        if (owned.length > 1) break;
        node = parent;
        if (node.innerText.trim().split("\n").length >= 3) break;
      }
      const title = a.innerText.trim();
      const lines = node.innerText.split("\n").map((s) => s.trim()).filter(Boolean);
      const rest = lines.filter((l) => l !== title);

      /* Cards render as title / company / "location • posted" / type / pay, but the
         company line drops out on some listings — classify by shape, not position. */
      const where = rest.find((l) => l.includes("•")) || "";
      const employment =
        rest.find((l) => /^(contract|full[- ]time|part[- ]time|third party|c2c|w2)/i.test(l)) || "";
      const salary =
        rest.find((l) => /\$|\busd\b|per year|per hour|hourly|compensation/i.test(l)) || "";
      const company =
        rest.find(
          (l) => l !== where && l !== employment && l !== salary && !/^remote\b/i.test(l)
        ) || "";

      out.push({
        title,
        company,
        location: where ? where.split("•")[0].trim() : rest.find((l) => /^remote\b/i.test(l)) || "",
        posted: where ? where.split("•").slice(1).join("•").trim() : "",
        salary,
        employment,
        url: a.href,
      });
    }
    return out;
  });
}

async function diceDescription(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3500);
  await assertNotChallenged(page, "dice detail");
  return page.evaluate(() => {
    const main =
      document.querySelector('[data-testid="jobDescriptionHtml"]') ||
      document.querySelector("#jobDescription") ||
      document.querySelector("main");
    return main ? main.innerText.trim() : "";
  });
}

async function runDice(seen, report) {
  const byUrl = new Map();
  const searched = new Set();
  const jobs = [];
  const detailed = new Set();

  try {
    await boardSession("dice", async (ctx) => {
      const page = await ctx.newPage();
      for (const term of THEMES) {
        if (searched.has(term)) continue;
        for (const c of await diceCards(page, term)) {
          if (!c.url || byUrl.has(c.url)) continue;
          byUrl.set(c.url, { source: "dice", term, ...c });
        }
        searched.add(term);
        await sleep(2500);
      }

      const fresh = shortlist([...byUrl.values()], seen, MAX_DETAILS);

      for (const job of fresh) {
        if (detailed.has(job.url)) continue;
        job.description = clean(await diceDescription(page, job.url)).slice(0, DESC_CHARS);
        job.salary = job.salary || "not listed";
        job.employment = job.employment || "not listed";
        detailed.add(job.url);
        jobs.push(job);
        await sleep(1500);
      }
    });
  } catch (err) {
    report.ok = false;
    report.note = err.message;
    log(`dice: ${err.message}`);
  }

  report.scanned = byUrl.size;
  report.kept = jobs.length;
  if (report.ok !== false) report.ok = searched.size > 0;
  if (report.ok && report.scanned === 0) report.note = "no listings matched the themes";
  return jobs;
}

/* ------------------------------------------------------------------ */

async function main() {
  const seen = loadSeen();
  const boards = {};
  const jobs = [];
  const mk = () => ({ scanned: 0, kept: 0, ok: true, note: "" });

  if (BOARDS.includes("linkedin")) {
    boards.linkedin = mk();
    try {
      jobs.push(...(await runLinkedIn(seen, boards.linkedin)));
    } catch (err) {
      boards.linkedin.ok = false;
      boards.linkedin.note = err.message;
      log(`linkedin: ${err.message}`);
    }
  }

  /* One board failing is a partial scan, not a failed run — keep going. */
  if (BOARDS.includes("indeed")) {
    boards.indeed = mk();
    jobs.push(...(await runIndeed(seen, boards.indeed)));
  }
  if (BOARDS.includes("dice")) {
    boards.dice = mk();
    jobs.push(...(await runDice(seen, boards.dice)));
  }

  /* Weed out anything gated on an active clearance before it reaches the scorer.
     They still go to the ledger (via saveSeen on the full list) so we don't re-fetch
     them tomorrow, but they never enter candidates.json or the report. */
  const cleared = jobs.filter((job) => {
    if (needsClearance(`${job.title} ${job.description}`)) {
      if (boards[job.source]) {
        boards[job.source].clearanceDropped = (boards[job.source].clearanceDropped || 0) + 1;
      }
      log(`drop (clearance): ${job.title} @ ${job.company}`);
      return false;
    }
    return true;
  });

  /* Drop stale postings (older than MAX_AGE_DAYS). Like clearance, they still go
     to the ledger so we don't re-fetch, but never reach the scorer. Unknown/
     unparseable dates are kept — we only drop when the age is positively old. */
  const timely = cleared.filter((job) => {
    if (isStale(job.posted)) {
      if (boards[job.source]) {
        boards[job.source].staleDropped = (boards[job.source].staleDropped || 0) + 1;
      }
      log(`drop (stale >${MAX_AGE_DAYS}d): ${job.title} @ ${job.company} [posted: ${job.posted}]`);
      return false;
    }
    return true;
  });

  /* The same role is often posted to two boards; keep whichever copy carries the
     fuller description so the scorer reads the best version available. */
  const best = new Map();
  for (const job of timely) {
    const key = dedupeKey(job);
    const prior = best.get(key);
    if (!prior || (job.description || "").length > (prior.description || "").length) {
      best.set(key, job);
    }
  }
  const deduped = [...best.values()];

  const doc = { ranAt: new Date().toISOString(), themes: THEMES, boards, jobs: deduped };
  const json = JSON.stringify(doc, null, 2);
  if (OUT) {
    fs.mkdirSync(path.dirname(path.resolve(ROOT, OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, OUT), json + "\n");
    log(`wrote ${OUT}: ${deduped.length} jobs (${jobs.length} before cross-board dedupe)`);
  } else {
    process.stdout.write(json + "\n");
  }

  /* Ledger last: a job is only "seen" once it has actually reached the scorer's input. */
  saveSeen(seen, jobs);
}

if (require.main === module) {
  main();
} else {
  /* Exported so the filters can be exercised without hitting the network. */
  module.exports = { titlePlausible, needsClearance, postedAgeDays, isStale, MAX_AGE_DAYS, relevance, shortlist, dedupeKey, clean, THEMES };
}
