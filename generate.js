/**
 * Static résumé generator.
 *
 * Renders the landing page and three targeted résumé versions into docs/ as
 * plain, ATS-friendly HTML (no client-side rendering). Run:  node generate.js
 *
 * All content lives in resume-data.js. Do not hand-edit docs/*.html — this
 * script overwrites them.
 */
const fs = require("fs");
const path = require("path");
const { identity, versions, resumes } = require("./resume-data");

const DOCS = path.join(__dirname, "docs");

/* Escape user-facing text for safe HTML. */
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* ---- shared fragments ------------------------------------------------ */

function head(title, description) {
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="description" content="${esc(description)}" />
  <meta name="keywords" content="resume,cv,Matt Graf,software engineer" />
  <meta name="author" content="Matt Graf" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="ie=edge" />
  <link href="./build.css" rel="stylesheet" />
  <title>${esc(title)}</title>
</head>

<body>
  <main class="font-firago hyphens-manual">
    <div class="p-6 mx-auto page max-w-2xl print:max-w-letter md:max-w-letter xsm:p-8 sm:p-9 md:p-16 bg-white">`;
}

const foot = `    </div>
  </main>
</body>

</html>
`;

/* Print bar — no cross-links between versions, so knowing one URL does not
 * reveal the others. Hidden when printing so the printed résumé stays clean. */
function nav() {
  return `      <div class="print:hidden mb-8 pb-3 border-b border-gray-300 flex justify-end">
        <button type="button" onclick="window.print()" class="px-3 py-1 text-sm text-white bg-blue-800 hover:bg-blue-900 font-medium">Print / Save PDF</button>
      </div>`;
}

/* Name block + targeted title. */
function header(headlineTitle) {
  return `      <header class="mb-6 border-b-2 border-opacity-50 border-gray-400 pb-3">
        <h1 class="md:text-5xl text-3xl font-semibold text-gray-750 pb-px">${esc(identity.name)}</h1>
        <p class="text-blue-700 md:text-2xl text-xl font-hairline mt-1">${esc(headlineTitle)}</p>
      </header>`;
}

function contact() {
  return `      <section class="mb-8" id="contact" aria-label="Contact">
        <h2 class="mb-2 font-bold tracking-widest text-sm2 text-gray-550">CONTACT</h2>
        <ul class="flex flex-wrap flex-col sm:flex-row gap-x-8 gap-y-1 text-md text-gray-700 list-none">
          <li><a href="mailto:${identity.email}">${esc(identity.email)}</a></li>
          <li><a href="tel:+19162075146">${esc(identity.phone)}</a></li>
          <li><a href="${identity.githubUrl}" target="_blank" rel="noopener noreferrer">${esc(identity.github)}</a></li>
        </ul>
      </section>`;
}

function summary(text) {
  return `      <section class="mb-8" id="summary">
        <h2 class="mb-3 font-bold tracking-widest text-sm2 text-blue-700">SUMMARY</h2>
        <p class="leading-normal text-md text-gray-650">${esc(text)}</p>
      </section>`;
}

function skills(groups) {
  const blocks = groups
    .map(
      (g) => `        <div class="mb-3">
          <h3 class="text-lg font-semibold text-gray-700 leading-snugish">${esc(g.group)}</h3>
          <p class="text-md text-gray-700 leading-normal">${g.items.map(esc).join(" &middot; ")}</p>
        </div>`
    )
    .join("\n");
  return `      <section class="mb-8" id="skills">
        <h2 class="mb-3 font-bold tracking-widest text-sm2 text-blue-700">CORE SKILLS</h2>
${blocks}
      </section>`;
}

function job(j) {
  const bullets = j.bullets
    .map(
      (b) =>
        `          <li class="mt-2.1 ml-4 text-md text-gray-700 leading-normal list-disc">${esc(b)}</li>`
    )
    .join("\n");
  return `      <section class="mb-6">
        <header>
          <h3 class="text-lg font-semibold text-gray-700 leading-snugish">${esc(j.role)} <span class="text-gray-550">@ ${esc(j.company)}</span></h3>
          <p class="leading-normal text-sm text-gray-700 mt-1">${esc(j.dates)} &nbsp;//&nbsp; ${esc(j.location)}</p>
        </header>
        <ul class="mt-1">
${bullets}
        </ul>
      </section>`;
}

function experience(jobs, earlier) {
  let out = `      <section class="mb-8" id="experience">
        <h2 class="mb-4 font-bold tracking-widest text-sm2 text-blue-700">EXPERIENCE</h2>
${jobs.map(job).join("\n")}`;
  if (earlier && earlier.length) {
    const rows = earlier
      .map(
        (e) =>
          `          <li class="mt-2.1 ml-4 text-md text-gray-700 leading-normal list-disc">${esc(e.role)} <span class="text-gray-550">@ ${esc(e.company)}</span> — ${esc(e.dates)}, ${esc(e.location)}</li>`
      )
      .join("\n");
    out += `
      </section>
      <section class="mb-8" id="earlier-experience">
        <h2 class="mb-3 font-bold tracking-widest text-sm2 text-blue-700">EARLIER EXPERIENCE</h2>
        <ul class="mt-1">
${rows}
        </ul>
      </section>`;
  } else {
    out += `
      </section>`;
  }
  return out;
}

function highlights(items) {
  const rows = items
    .map(
      (h) =>
        `          <li class="mt-2.1 ml-4 text-md text-gray-700 leading-normal list-disc">${esc(h)}</li>`
    )
    .join("\n");
  return `      <section class="mb-4" id="highlights">
        <h2 class="mb-3 font-bold tracking-widest text-sm2 text-blue-700">SELECTED PROJECTS &amp; TECHNICAL HIGHLIGHTS</h2>
        <ul class="mt-1">
${rows}
        </ul>
      </section>`;
}

/* ---- page renderers -------------------------------------------------- */

function renderResume(data) {
  return [
    head(`Matt Graf — ${data.title}`, data.title),
    nav(),
    header(data.headline),
    contact(),
    summary(data.summary),
    skills(data.skills),
    experience(data.experience, data.earlier),
    highlights(data.highlights),
    foot,
  ].join("\n");
}

/* ---- write ----------------------------------------------------------- */

function write(file, html) {
  fs.writeFileSync(path.join(DOCS, file), html);
  console.log("wrote docs/" + file);
}

/* No index/landing page: the site has no discoverable home. Each résumé is
 * only reachable by knowing its slug. Remove any stale index.html. */
const indexPath = path.join(DOCS, "index.html");
if (fs.existsSync(indexPath)) {
  fs.unlinkSync(indexPath);
  console.log("removed docs/index.html (no home page)");
}

for (const v of versions) {
  write(v.file, renderResume(resumes[v.slug]));
}
console.log("done.");
