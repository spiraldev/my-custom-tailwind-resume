/**
 * Shared résumé data for Matt Graf.
 *
 * One career history, three targeted versions. Edit content here — never in the
 * generated docs/*.html files (those are overwritten by `node generate.js`).
 *
 * Rules honored:
 *  - Same employers/dates across all versions; only emphasis/bullets change.
 *  - Skills listed are backed by experience bullets.
 *  - No invented employers or dates.
 */

const identity = {
  name: "Matt Graf",
  email: "matt.graf@gmail.com",
  phone: "(916)-207-5146",
  github: "github.com/spiraldev",
  githubUrl: "https://www.github.com/spiraldev",
  // Engineering since 1997; deep ColdFusion + modern Node/AWS.
  since: 1997,
};

/* Version metadata for nav + routing. */
const versions = [
  { slug: "coldfusion", file: "coldfusion.html", nav: "ColdFusion / Legacy" },
  { slug: "full-stack", file: "full-stack.html", nav: "Full Stack" },
  { slug: "staff-engineer", file: "staff-engineer.html", nav: "Staff Engineer" },
];

/* ------------------------------------------------------------------ */
/* Version 1 — ColdFusion / Legacy Modernization                       */
/* ------------------------------------------------------------------ */
const coldfusion = {
  slug: "coldfusion",
  title: "Senior ColdFusion Engineer / Legacy Modernization Engineer",
  headline: "Senior ColdFusion & Legacy Modernization Engineer",
  summary:
    "Software engineer since 1997 with deep ColdFusion (CFML) experience across healthcare, payments, events, and enterprise systems. I keep mission-critical monoliths running while incrementally modernizing them — extracting services, hardening SQL, and re-platforming ColdFusion workloads onto Node.js and AWS without disrupting the business. Comfortable owning production support, debugging, and refactoring on systems that have run for a decade or more.",
  skills: [
    {
      group: "ColdFusion & Backend",
      items: ["ColdFusion / CFML", "Node.js", "NestJS", "REST API development", "Legacy refactoring", "Production support & debugging"],
    },
    {
      group: "Databases",
      items: ["SQL Server (MSSQL)", "MySQL", "PostgreSQL", "Query tuning & reporting", "Data workflows & migrations"],
    },
    {
      group: "Modernization & Cloud",
      items: ["Monolith-to-service migration", "ColdFusion → Node.js/AWS", "AWS Lambda", "API Gateway", "S3", "Serverless"],
    },
    {
      group: "Security & Domains",
      items: ["Authentication & session security", "Payments & recurring billing", "Healthcare (HIPAA-aware)", "Reporting", "Events & membership systems"],
    },
  ],
  experience: [
    {
      company: "iQuiq",
      role: "Founder / Owner / Senior Software Engineer",
      dates: "2006 – Present",
      location: "Remote",
      bullets: [
        "Founded and run a bootstrapped SaaS platform, personally owning ColdFusion and Node.js codebases in production for 15+ years — from data model to deployment.",
        "Modernized legacy ColdFusion features into AWS-hosted Node.js services (Lambda, S3) while keeping paying customers live throughout the migration.",
        "Built and maintain payments, recurring billing, forms, and member portals backed by SQL Server / PostgreSQL, processing over $2M in transactions across 50 clients.",
        "Provide ongoing production support: debugging, refactoring, and hardening authentication and data workflows on long-lived code.",
      ],
    },
    {
      company: "Xenegrade",
      role: "Senior Software Engineer",
      dates: "2021 – 2023",
      location: "Remote",
      bullets: [
        "Modernized a ColdFusion student/registration platform, extracting business logic into Node.js and AWS Lambda services behind REST APIs.",
        "Refactored and tuned MySQL queries and reporting, cutting response times roughly 65% on high-traffic pages.",
        "Handled production support and bug triage on the ColdFusion monolith while incrementally shifting workloads off it.",
      ],
    },
    {
      company: "Cavulus",
      role: "Senior Software Engineer / Lead Engineer",
      dates: "2016 – 2021",
      location: "Hilton Head Island, SC",
      bullets: [
        "Led modernization of a HIPAA-aware healthcare ColdFusion monolith into microservices using Node.js, NestJS, AWS Lambda, and AWS AppSync.",
        "Migrated relational data across MSSQL, PostgreSQL, and MongoDB, preserving audit and reporting requirements for regulated Medicare data.",
        "Led a team of 8 engineers, owning production debugging and refactoring of legacy CFML and cutting recurring support incidents through targeted rewrites.",
        "Built REST/GraphQL APIs that let modern Angular dashboards consume data still served in part by the legacy system.",
      ],
    },
    {
      company: "MeetingPlay",
      role: "Software Engineer",
      dates: "2013 – 2016",
      location: "Frederick, MD",
      bullets: [
        "Architected and built event-registration and attendee-workflow features on a ColdFusion + MSSQL platform serving live enterprise events.",
        "Exposed REST APIs over legacy data so JavaScript (Backbone.js) front ends could deliver real-time attendee experiences.",
        "Debugged and stabilized production during high-load live events where downtime was not an option.",
      ],
    },
    {
      company: "Haemonetics",
      role: "Software Engineer",
      dates: "2011 – 2013",
      location: "Sacramento, CA",
      bullets: [
        "Maintained and extended ColdFusion/SQL enterprise medical-technology applications under regulated documentation standards.",
        "Resolved production-support cases and modified existing software to correct defects and adapt to new interfaces.",
        "Analyzed complex data models and technical documents to keep changes compliant and low-risk.",
      ],
    },
    {
      company: "EventReady",
      role: "Senior Application Developer",
      dates: "2008 – 2011",
      location: "Roseville, CA",
      bullets: [
        "Built and supported database-backed ColdFusion event-management web applications backed by SQL Server.",
        "Owned production support, defect resolution, and interface upgrades across a maturing codebase.",
      ],
    },
    {
      company: "Western Health Advantage",
      role: "Programmer / Analyst",
      dates: "2005 – 2007",
      location: "Sacramento, CA",
      bullets: [
        "Developed ColdFusion/classic web applications and SQL reporting for a healthcare payer.",
        "Built data workflows and internal reporting used by business stakeholders.",
      ],
    },
    {
      company: "Vanir Construction Management",
      role: "ColdFusion Developer",
      dates: "2001 – 2004",
      location: "Sacramento, CA",
      bullets: [
        "Developed enterprise ColdFusion applications with SQL Server for project reporting and internal operations.",
      ],
    },
  ],
  highlights: [
    "CPAP Data Management API — ColdFusion-era patient data workflows re-implemented as a secure Node.js/NestJS API with JWT auth, guards, and custom decorators.",
    "Payment Processing API — secure recurring-payments and reporting service, migrating billing logic off a legacy stack onto AWS.",
    "Repeated pattern across roles: strangle the ColdFusion monolith one service at a time, keeping SQL Server/MySQL data authoritative until cutover.",
  ],
};

/* ------------------------------------------------------------------ */
/* Version 2 — Modern Full Stack (Node.js, NestJS, React, TypeScript)  */
/* ------------------------------------------------------------------ */
const fullstack = {
  slug: "full-stack",
  title: "Senior Full Stack Engineer — Node.js, NestJS, React, TypeScript",
  headline: "Senior Full Stack Engineer — Node.js · NestJS · React · TypeScript",
  summary:
    "Backend-heavy full stack engineer specializing in TypeScript on Node.js and NestJS, with React on the front end and AWS underneath. I design and ship REST and GraphQL APIs, model relational and document data, wire up secure auth, and automate delivery with Docker and CI/CD. Decades of production experience mean I ship features that hold up under real load and stay maintainable for the next engineer.",
  skills: [
    {
      group: "Languages",
      items: ["TypeScript", "JavaScript (ES6+)", "SQL", "GraphQL", "HTML", "CSS/Sass"],
    },
    {
      group: "Backend & APIs",
      items: ["Node.js", "NestJS", "Express", "REST APIs", "GraphQL / Apollo / AppSync", "JWT / OAuth / Cognito auth"],
    },
    {
      group: "Frontend",
      items: ["React", "Angular", "Vue.js", "Component architecture", "State management"],
    },
    {
      group: "Cloud & DevOps",
      items: ["AWS Lambda", "API Gateway", "AppSync", "ECS", "S3", "CloudFront", "Docker", "GitHub Actions / CI/CD"],
    },
    {
      group: "Databases",
      items: ["PostgreSQL", "MySQL", "MongoDB", "SQL Server", "Couchbase"],
    },
    {
      group: "Testing",
      items: ["Jest", "Puppeteer", "Integration testing"],
    },
  ],
  experience: [
    {
      company: "iQuiq",
      role: "Founder / Owner / Senior Software Engineer",
      dates: "2006 – Present",
      location: "Remote",
      bullets: [
        "Design and operate an AWS-hosted SaaS platform end to end: TypeScript/Node.js services, React front ends, and PostgreSQL/MySQL data.",
        "Built a secure payments and recurring-billing system with JWT-based auth and reporting APIs, processing over $2M in transactions across 50 clients.",
        "Ship features solo through the full lifecycle — API design, front end, Docker packaging, and CI/CD to AWS (Lambda, S3, CloudFront).",
        "Own reliability and cost in production: monitoring, refactoring, and incremental re-architecture of live customer-facing services.",
      ],
    },
    {
      company: "Xenegrade",
      role: "Senior Software Engineer",
      dates: "2021 – 2023",
      location: "Remote",
      bullets: [
        "Built Node.js and AWS Lambda services behind REST APIs, replacing legacy pages with modern, testable TypeScript code.",
        "Designed and tuned MySQL schemas and queries powering registration and reporting, cutting response times roughly 65%.",
        "Integrated serverless APIs with front-end clients and improved delivery through repeatable deploys.",
      ],
    },
    {
      company: "Cavulus",
      role: "Senior Software Engineer / Lead Engineer",
      dates: "2016 – 2021",
      location: "Hilton Head Island, SC",
      bullets: [
        "Led migration of a healthcare monolith to a microservice architecture on Node.js, NestJS, AWS Lambda, and AWS AppSync (GraphQL).",
        "Built REST and GraphQL APIs backed by PostgreSQL, MSSQL, and MongoDB, with JWT/OAuth-style authentication.",
        "Delivered Angular dashboards against the new API layer and mentored a team of 8 engineers on TypeScript and testing practices.",
        "Introduced Jest test coverage and CI to raise reliability across newly extracted services.",
      ],
    },
    {
      company: "MeetingPlay",
      role: "Software Engineer",
      dates: "2013 – 2016",
      location: "Frederick, MD",
      bullets: [
        "Built a scalable event-registration platform with JavaScript, Backbone.js, REST APIs, and SQL Server.",
        "Developed real-time attendee and event workflows for live, high-attendance conferences.",
        "Recruited, trained, and led developers while shipping features under tight event deadlines.",
      ],
    },
    {
      company: "Haemonetics",
      role: "Software Engineer",
      dates: "2011 – 2013",
      location: "Sacramento, CA",
      bullets: [
        "Built and maintained SQL-backed enterprise medical-technology web applications.",
        "Resolved production-support cases and adapted software to new interfaces and requirements.",
      ],
    },
    {
      company: "EventReady",
      role: "Senior Application Developer",
      dates: "2008 – 2011",
      location: "Roseville, CA",
      bullets: [
        "Developed database-backed event-management web applications and supported them in production.",
      ],
    },
  ],
  earlier: [
    { company: "Western Health Advantage", role: "Programmer / Analyst", dates: "2005 – 2007", location: "Sacramento, CA" },
    { company: "Vanir Construction Management", role: "ColdFusion Developer", dates: "2001 – 2004", location: "Sacramento, CA" },
  ],
  highlights: [
    "CPAP Data Management API — NestJS service for collecting and managing patient device data; JWT auth, route guards, custom decorators, and shared data-service libraries.",
    "Payment Processing API — secure Node.js payments service with recurring billing and reporting, deployed on AWS.",
    "Repeatable delivery — Dockerized services shipped through GitHub Actions CI/CD to AWS (Lambda, ECS, S3, CloudFront).",
  ],
};

/* ------------------------------------------------------------------ */
/* Version 3 — Staff / Principal Engineer                              */
/* ------------------------------------------------------------------ */
const staff = {
  slug: "staff-engineer",
  title: "Staff Software Engineer / Principal Engineer",
  headline: "Staff / Principal Software Engineer",
  summary:
    "Engineer and technical leader with founder-level ownership and a track record of taking legacy systems to modern, scalable platforms. I set architecture, lead cloud migrations, design API platforms, and mentor teams — while staying close enough to the code to be accountable for reliability and maintainability. I connect technical decisions to business impact, having built and run a SaaS company and led modernization in regulated healthcare.",
  skills: [
    {
      group: "Technical Leadership",
      items: ["Architecture & system design", "Legacy modernization strategy", "Cloud migration leadership", "Mentorship", "Cross-functional leadership", "Founder-level ownership"],
    },
    {
      group: "Platform & Architecture",
      items: ["API platform design", "Microservices", "REST & GraphQL", "Event-driven / serverless", "Scalability, reliability, maintainability"],
    },
    {
      group: "Core Stack",
      items: ["TypeScript / Node.js", "NestJS", "React / Angular", "ColdFusion (legacy)", "AWS (Lambda, AppSync, ECS, S3)"],
    },
    {
      group: "Data",
      items: ["PostgreSQL", "MySQL", "SQL Server", "MongoDB", "Data modeling & migration"],
    },
  ],
  experience: [
    {
      company: "iQuiq",
      role: "Founder / Owner / Principal Engineer",
      dates: "2006 – Present",
      location: "Remote",
      bullets: [
        "Own the full technical and business stack of a SaaS company: architecture, roadmap, delivery, reliability, and cost — for 15+ years in production.",
        "Set and executed a modernization strategy migrating a ColdFusion platform to AWS-hosted Node.js services without customer disruption.",
        "Designed the API platform behind payments, recurring billing, forms, member portals, and reporting — processing over $2M in transactions across 50 clients.",
        "Made pragmatic build/buy and architecture decisions balancing delivery speed, operational simplicity, and long-term maintainability.",
      ],
    },
    {
      company: "Cavulus",
      role: "Lead Engineer / Senior Software Engineer",
      dates: "2016 – 2021",
      location: "Hilton Head Island, SC",
      bullets: [
        "Led the architecture and execution of a healthcare monolith-to-microservices migration on Node.js, NestJS, AWS Lambda, and AppSync.",
        "Defined the API and data strategy across MSSQL, PostgreSQL, and MongoDB for HIPAA-aware, audit-sensitive workloads.",
        "Led a team of 8 engineers, setting standards for testing, code quality, and incremental delivery during a multi-year modernization.",
        "Partnered with product and business stakeholders to sequence the migration around risk and business priorities.",
      ],
    },
    {
      company: "Xenegrade",
      role: "Senior Software Engineer",
      dates: "2021 – 2023",
      location: "Remote",
      bullets: [
        "Drove incremental re-platforming of a legacy application onto Node.js and AWS serverless services.",
        "Designed API and data changes that improved reliability and cut response times roughly 65% while keeping the existing system running.",
      ],
    },
    {
      company: "MeetingPlay",
      role: "Software Engineer",
      dates: "2013 – 2016",
      location: "Frederick, MD",
      bullets: [
        "Architected a scalable event-registration platform and led developers delivering it under live-event deadlines.",
        "Recruited, hired, trained, and led staff, owning technical direction for attendee and event workflows.",
      ],
    },
    {
      company: "Haemonetics",
      role: "Software Engineer",
      dates: "2011 – 2013",
      location: "Sacramento, CA",
      bullets: [
        "Delivered and supported enterprise medical-technology applications under regulated standards.",
        "Collaborated across functions to align technical changes with compliance and product requirements.",
      ],
    },
  ],
  earlier: [
    { company: "EventReady", role: "Senior Application Developer", dates: "2008 – 2011", location: "Roseville, CA" },
    { company: "Western Health Advantage", role: "Programmer / Analyst", dates: "2005 – 2007", location: "Sacramento, CA" },
    { company: "Vanir Construction Management", role: "ColdFusion Developer", dates: "2001 – 2004", location: "Sacramento, CA" },
  ],
  highlights: [
    "Founder-level ownership at iQuiq — sole architect and operator of a live SaaS platform spanning payments, billing, portals, and reporting on AWS.",
    "Healthcare modernization at Cavulus — led a multi-year monolith-to-microservices migration in a HIPAA-aware domain.",
    "Modernization playbook — strangler-pattern migration of ColdFusion monoliths to Node.js/AWS, keeping data authoritative and downtime near zero.",
  ],
};

const resumes = { coldfusion, "full-stack": fullstack, "staff-engineer": staff };

module.exports = { identity, versions, resumes };
