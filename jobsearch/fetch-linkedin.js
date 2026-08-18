#!/usr/bin/env node
/**
 * LinkedIn remote-job fetcher (guest endpoint — no auth, no scraping of logged-in pages).
 *
 *   node jobsearch/fetch-linkedin.js "coldfusion" "nestjs" "staff engineer"
 *
 * Prints one JSON array of { source, title, company, location, posted, url } to stdout.
 * Filters: remote (f_WT=2), posted in the last 24h (f_TPR=r86400), United States.
 *
 * LinkedIn rate-limits aggressively. On a 429 the term is skipped, not retried —
 * a thin day is better than a blocked IP.
 */

const REMOTE = "2";
const LAST_24H = "r86400";
const PAGES = 3; // 10 results per page
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/* Each result is one <li> containing a title, subtitle (company), location, date, and link. */
function parseCards(html, term) {
  const out = [];
  for (const card of html.split("<li>").slice(1)) {
    const title = card.match(/base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/);
    const company = card.match(/base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/);
    const location = card.match(/job-search-card__location"[^>]*>([\s\S]*?)<\/span>/);
    const posted = card.match(/datetime="([^"]+)"/);
    const url = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^?"]+)/);
    if (!title || !url) continue;
    out.push({
      source: "linkedin",
      term,
      title: decode(title[1]),
      company: company ? decode(company[1]) : "",
      location: location ? decode(location[1]) : "",
      posted: posted ? posted[1] : "",
      url: url[1],
    });
  }
  return out;
}

async function search(term) {
  const results = [];
  for (let page = 0; page < PAGES; page++) {
    const url =
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?" +
      new URLSearchParams({
        keywords: term,
        location: "United States",
        f_WT: REMOTE,
        f_TPR: LAST_24H,
        start: String(page * 10),
      });

    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA } });
    } catch (err) {
      process.stderr.write(`linkedin "${term}" page ${page}: ${err.message}\n`);
      break;
    }
    if (!res.ok) {
      process.stderr.write(`linkedin "${term}" page ${page}: HTTP ${res.status}\n`);
      break;
    }

    const cards = parseCards(await res.text(), term);
    results.push(...cards);
    if (cards.length < 10) break; // last page
    await sleep(1500); // be a polite guest
  }
  return results;
}

(async () => {
  const terms = process.argv.slice(2);
  if (!terms.length) {
    process.stderr.write("usage: fetch-linkedin.js <term> [term ...]\n");
    process.exit(2);
  }

  const seen = new Set();
  const all = [];
  for (const term of terms) {
    for (const job of await search(term)) {
      if (seen.has(job.url)) continue;
      seen.add(job.url);
      all.push(job);
    }
    await sleep(1500);
  }
  process.stdout.write(JSON.stringify(all, null, 2) + "\n");
})();
