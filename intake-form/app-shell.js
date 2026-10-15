/* Shared chrome only. No customer data or credentials are persisted here. */
(() => {
  const BUILD = "10.13-R23"; // Single release identifier; the PDF generator reads this value.
  const buttonStyle = document.createElement("link");
  buttonStyle.rel = "stylesheet";
  buttonStyle.href = new URL(
    "button-refinement.css?v=1",
    document.currentScript.src,
  ).href;
  document.head.append(buttonStyle);
  const alignedSelects = document.createElement('script');
  alignedSelects.src = new URL('aligned-selects.js?v=2', document.currentScript.src).href;
  document.head.append(alignedSelects);
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    clients:
      '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4"/>',
    treatment:
      '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    intake:
      '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M8 11h8m-8 5h6"/>',
    messages:
      '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3 1-7a8 8 0 0 1-1-4 9 9 0 0 1 19 0Z"/><path d="M7 11h.01M12 11h.01M17 11h.01"/>',
    answers: '<path d="M4 3h12l4 4v14H4zM15 3v5h5M8 12h8m-8 4h5"/>',
    audit:
      '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/>',
    reports:
      '<path d="M4 20V10m5 10V4m5 16v-7m5 7V7M2 20h20"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  const icon = (key) =>
    '<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    (paths[key] || paths.treatment) +
    "</svg>";
  window.PreciseUI = { icon };
  const file =
    location.pathname
      .split("/")
      .pop()
      .replace(/\.html$/, "") || "index";
  const isIntake = file === "intake";
  document.body.classList.add(isIntake ? "intake-shell" : "crm-shell");
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  if (isIntake) {
    document.querySelectorAll('.intake-build').forEach(node => { node.textContent = 'BUILD ' + BUILD; });
    return;
  }
  const scenery = document.createElement('script');
  scenery.type = 'module';
  scenery.src = '/scene-rotation.mjs';
  document.head.append(scenery);
  const workspaceDate = document.createElement('script');
  workspaceDate.type = 'module';
  workspaceDate.src = '/workspace-date.mjs';
  document.head.append(workspaceDate);
  const nav = [
    ["index", "Overview", "home", "sea"],
    ["cloud-dashboard/?view=day", "Appointments", "bell", "violet"],
    ["dashboard", "Clients", "clients", "ocean"],
    ["communications", "Client follow-up", "messages", "violet"],
    ["treatment", "Treatments", "treatment", "coral"],
    ["chatbot", "Response engine", "answers", "gold"],
    ["offers", "Promotional Pop-Up", "treatment", "rose"],
    ["intake", "iPad intake", "intake", "sage"],
    ["reports", "Reports", "reports", "driftwood"],
    ["audit", "Access log", "audit", "slate"],
  ];
  const quotes = [
    "Slow down. Precision doesn't rush.",
    "Calm hands, steady care.",
    "One client, fully present.",
    "Consistency is the real glow-up.",
    "Care shows up in the details.",
    "A good day starts with a good welcome.",
    "Small routines build big trust.",
    "The best treatment room is a quiet one.",
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5,
  );
  const quoteToday = quotes[dayOfYear % quotes.length];
  const aside = document.createElement("aside");
  aside.className = "crm-sidebar";
  aside.innerHTML =
    '<a class="crm-brand" href="index.html" aria-label="Precise Laser Spa overview"><img src="logo.png" alt="Precise Laser Spa"><span>The coastal workspace</span></a><nav class="crm-nav" aria-label="Staff workspace">' +
    nav
      .map(
        ([href, label, key, color]) =>
          '<a href="' +
          href +
          (href === "intake" ? ".html?kiosk=1" : href.includes("/") ? "" : ".html") +
          '" data-color="' +
          color +
          '"' +
          (file === href ? ' aria-current="page"' : "") +
          ">" +
          icon(key) +
          "<span>" +
          label +
          "</span></a>",
      )
      .join("") +
    '</nav><div class="crm-sidebar-bottom"><p class="quote-of-day">' +
    quoteToday +
    '</p><span class="workspace-label">A little calmer. All connected.</span><p>Precise Laser Spa · Staff workspace</p><span class="build-label">BUILD ' + BUILD + '</span></div>';
  if (["127.0.0.1", "localhost"].includes(location.hostname)) {
    const sceneReviewHost = aside.querySelector('.crm-sidebar-bottom');
    if (sceneReviewHost?.append) {
    const sceneReview = document.createElement('a');
    sceneReview.href = '/scene-review.html';
    sceneReview.textContent = 'Review 20 scenic images';
    sceneReview.style.cssText = 'display:inline-flex;margin-top:10px;padding:5px 10px;border:1px solid #70438b;border-radius:999px;color:#70438b;background:#f7efff;font-size:11px;font-weight:800;text-decoration:none';
    sceneReviewHost.append(sceneReview);
    }
    const appointmentNav = aside.querySelector('a[href="cloud-dashboard/?view=day"]');
    if (appointmentNav) appointmentNav.href = "/square-preview/?source=production&view=day";
  }
  document.body.prepend(aside);
  const wrap = document.querySelector("body > .wrap");
  if (wrap) {
    const main = document.createElement("main");
    main.className = "crm-main";
    main.id = "main-content";
    const header = document.createElement("header");
    header.className = "page-header";
    header.innerHTML =
      '<p>Precise Laser Spa <span aria-hidden="true">/</span> ' +
      (nav.find((n) => n[0] === file)?.[1] || "Workspace") +
      '</p><div class="header-right"><p class="header-date"></p><a class="view-site" href="https://preciselaserspa.com/" title="Open the public website in this tab">View site &#8594;</a></div>';
    header.querySelector(".header-date").textContent = new Intl.DateTimeFormat(
      "en-US",
      { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" },
    ).format(new Date());
    // In the local Site Preview, open the local website preview instead of the live site.
    if (["127.0.0.1", "localhost"].includes(location.hostname))
      header.querySelector(".view-site").href = "http://127.0.0.1:8804/";
    wrap.before(main);
    main.append(header, wrap);
    if (file === "index") {
      // Square is the source of truth: a top-bar link and a freshness bar that
      // home-appointments.mjs fills in (amber once the copy is over six hours old).
      const squareLive = document.createElement("a");
      squareLive.className = "square-live";
      squareLive.href = "https://app.squareup.com/dashboard/appointments/calendar";
      squareLive.target = "_blank";
      squareLive.rel = "noopener noreferrer";
      squareLive.textContent = "Open Squareup Calendar \u2197";
      header.querySelector(".header-right").prepend(squareLive);
      const freshness = document.createElement("p");
      freshness.id = "square-freshness";
      freshness.className = "square-freshness";
      freshness.setAttribute("role", "status");
      freshness.textContent = "Checking when Square last synced\u2026";
      header.after(freshness);
      const build = document.createElement("span");
      build.className = "build-label";
      build.textContent = "BUILD " + BUILD;
      header.insertBefore(build, header.querySelector(".header-right"));
      aside.querySelector(".build-label").textContent = build.textContent;
    }
    if (["127.0.0.1", "localhost"].includes(location.hostname)) {
      const banner = document.createElement("div");
      banner.className = file === "reports" ? "preview-ribbon preview-ribbon--report" : "preview-ribbon";
      banner.textContent = file === "reports"
      ? "LOCAL DESIGN PREVIEW · This report uses live Search Console data · CRM sample records are fictional · Nothing sent or deployed · BUILD " + BUILD
      : "BUILD " + BUILD;
    header.after(banner);
    }
  }
  const skip = document.createElement("a");
  skip.href = "#main-content";
  skip.className = "visually-hidden";
  skip.textContent = "Skip to workspace";
  skip.addEventListener("focus", () =>
    skip.classList.remove("visually-hidden"),
  );
  skip.addEventListener("blur", () => skip.classList.add("visually-hidden"));
  document.body.prepend(skip);
  if (file === "chatbot") {
    const title = document.querySelector("h1");
    if (title) title.textContent = "Response engine";
    document.title = "Response Engine — Precise Laser Spa";
  }
  document.querySelectorAll(".btn").forEach((el) => {
    if (/intake/i.test(el.getAttribute("href") || "")) el.classList.add("rose");
  });
  if (file === "dashboard") {
    const id = new URLSearchParams(location.search).get("client");
    if (id && /^\d+$/.test(id) && typeof window.loadClient === "function")
      window.loadClient(Number(id));
  }
})();
