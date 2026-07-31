(function () {
  const config = window.RAPID_FIRE_CONFIG || {};
  const state = {
    content: {},
    contentSource: "Local defaults",
    source: "Sample data",
    castSource: "Local defaults",
    shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
    cast: Array.isArray(config.cast) ? config.cast : []
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    state.content = {
      ...getDefaultContent(),
      ...(config.content || {})
    };

    applyConfig();
    applyContent();
    initBannerFade();

    const [contentResult, showsResult, castResult] = await Promise.allSettled([
      loadContent(),
      loadShows(),
      loadCast()
    ]);

    if (contentResult.status === "fulfilled") {
      state.content = {
        ...state.content,
        ...contentResult.value.content
      };
      state.contentSource = contentResult.value.source;
    }

    if (showsResult.status === "fulfilled") {
      state.shows = normalizeShows(showsResult.value.shows);
      state.source = showsResult.value.source;
    } else {
      state.shows = normalizeShows(config.fallbackShows || []);
      state.source = "Sample data";
    }

    if (castResult.status === "fulfilled") {
      state.cast = normalizeCast(castResult.value.cast);
      state.castSource = castResult.value.source;
    } else {
      state.cast = normalizeCast(config.cast || []);
      state.castSource = "Local defaults";
    }

    applyConfig();
    applyContent();
    renderCast();
    renderShows(state.shows);
    updateFeedLabels();
  }

  function initBannerFade() {
    if (!document.body.classList.contains("home-page")) return;

    let ticking = false;
    const update = () => {
      const progress = Math.min(window.scrollY / 520, 1);
      const opacity = 0.78 - progress * 0.62;
      document.documentElement.style.setProperty("--banner-opacity", opacity.toFixed(3));
      ticking = false;
    };

    update();
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
  }

  function getDefaultContent() {
    return {
      "site.name": config.teamName || "Rapid Fire Improv",
      "site.logo_alt": "",
      "site.footer_text": "lorem ipsum...",
      "meta.title": "Rapid Fire Improv",
      "meta.description":
        "Rapid Fire Improv brings comedy without borders, in-fighting, and the greatest comedy on planet earth.",
      "meta.og_title": "Rapid Fire Improv",
      "meta.og_description": "Upcoming shows, booking, and team updates for Rapid Fire Improv.",
      "nav.shows": "Shows",
      "nav.team": "Team",
      "nav.booking": "Booking",
      "hero.logo_alt": "Rapid Fire Improv neon logo",
      "hero.eyebrow": "Live improv comedy",
      "hero.tagline": config.tagline || "Comedy without borders. In-fighting. Greatest comedy on planet earth.",
      "hero.primary_button": "Upcoming Shows",
      "hero.secondary_button": "Book the Team",
      "hero.show_count_label_singular": "upcoming show",
      "hero.show_count_label_plural": "upcoming shows",
      "photo.alt": "Rapid Fire Improv performers lying shoulder to shoulder and smiling at the camera",
      "ticker.1": "lorem ipsum...",
      "ticker.2": "lorem ipsum...",
      "ticker.3": "lorem ipsum...",
      "ticker.4": "lorem ipsum...",
      "shows.eyebrow": "lorem ipsum...",
      "shows.title": "lorem ipsum...",
      "shows.body": "lorem ipsum...",
      "shows.loading": "lorem ipsum...",
      "shows.empty": "lorem ipsum...",
      "shows.ticket_label": "lorem ipsum...",
      "shows.details_label": "lorem ipsum...",
      "team.eyebrow": "lorem ipsum...",
      "team.title": "lorem ipsum...",
      "team.body": "lorem ipsum...",
      "booking.eyebrow": "lorem ipsum...",
      "booking.title": "lorem ipsum...",
      "booking.body": "lorem ipsum...",
      "booking.button_label": "lorem ipsum...",
      "admin.meta.title": "Team Edit - Rapid Fire Improv",
      "admin.meta.description": "Rapid Fire Improv team editing hub.",
      "admin.nav.team_edit": "Team Edit",
      "admin.hero.eyebrow": "Team hub",
      "admin.hero.title": "Update the Site",
      "admin.hero.body": "Open the shared control sheet, make the change, and the public page will follow that feed.",
      "admin.hero.open_sheet_button": "Open Site Sheet",
      "admin.hero.view_public_button": "View Public Shows",
      "admin.preview.eyebrow": "Preview",
      "admin.preview.title": "Current Feed",
      "admin.source.sample": "Sample data",
      "admin.source.google": "Google Sheet",
      "admin.footer.public_site": "Public Site"
    };
  }

  function applyConfig() {
    document.querySelectorAll("[data-logo]").forEach((image) => {
      if (config.logoUrl) {
        image.src = config.logoUrl;
      }
    });

    const bookingEmail = document.querySelector("#booking-email");
    if (bookingEmail && config.contactEmail) {
      bookingEmail.href = `mailto:${config.contactEmail}`;
    }

    const sheetLink = document.querySelector("#admin-sheet-link");
    if (sheetLink && config.adminSheetUrl) {
      sheetLink.href = config.adminSheetUrl;
      sheetLink.classList.remove("is-disabled");
      sheetLink.removeAttribute("aria-disabled");
      sheetLink.target = "_blank";
      sheetLink.rel = "noopener";
    }
  }

  function applyContent() {
    setAll("[data-team-name]", getContent("site.name"));
    setAll("[data-tagline]", getContent("hero.tagline"));

    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = getContent(element.dataset.content);
      if (value !== "") {
        element.textContent = value;
      }
    });

    document.querySelectorAll("[data-content-attr]").forEach((element) => {
      const pairs = element.dataset.contentAttr.split(";").map((item) => item.trim()).filter(Boolean);
      pairs.forEach((pair) => {
        const separator = pair.indexOf(":");
        if (separator === -1) return;
        const attr = pair.slice(0, separator).trim();
        const key = pair.slice(separator + 1).trim();
        const value = getContent(key);
        if (attr && value !== "") {
          element.setAttribute(attr, value);
        }
      });
    });
  }

  async function loadContent() {
    if (config.contentSheetCsvUrl) {
      const response = await fetch(config.contentSheetCsvUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load content sheet");
      }
      const rows = parseCsv(await response.text());
      const content = rowsToContent(rows);
      if (Object.keys(content).length > 0) {
        return { content, source: "Google Sheet" };
      }
    }

    return { content: {}, source: "Local defaults" };
  }

  async function loadShows() {
    if (config.googleSheetCsvUrl) {
      const response = await fetch(config.googleSheetCsvUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load shows sheet");
      }
      const rows = parseCsv(await response.text());
      const shows = rowsToObjects(rows);
      if (shows.length > 0) {
        return { shows, source: "Google Sheet" };
      }
    }

    return {
      shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
      source: "Sample data"
    };
  }

  async function loadCast() {
    if (config.castSheetCsvUrl) {
      const response = await fetch(config.castSheetCsvUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load cast sheet");
      }
      const rows = parseCsv(await response.text());
      const cast = rowsToObjects(rows);
      if (cast.length > 0) {
        return { cast, source: "Google Sheet" };
      }
    }

    return {
      cast: Array.isArray(config.cast) ? config.cast : [],
      source: "Local defaults"
    };
  }

  function normalizeShows(shows) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return shows
      .filter((show) => show && String(show.status || "").toLowerCase() !== "hidden")
      .map((show) => ({
        date: String(show.date || "").trim(),
        time: String(show.time || "").trim(),
        title: String(show.title || "Rapid Fire Show").trim(),
        venue: String(show.venue || "Venue TBA").trim(),
        address: String(show.address || "").trim(),
        ticket_url: String(show.ticket_url || show.ticketUrl || "").trim(),
        description: String(show.description || "").trim(),
        status: String(show.status || "Details soon").trim(),
        featured: isTruthy(show.featured)
      }))
      .filter((show) => {
        const date = getShowDate(show.date);
        return !date || date >= today;
      })
      .sort((a, b) => {
        const dateA = getShowDate(a.date);
        const dateB = getShowDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      });
  }

  function normalizeCast(cast) {
    return cast
      .filter((person) => person && String(person.status || "").toLowerCase() !== "hidden")
      .map((person, index) => ({
        name: String(person.name || "Rapid Fire Player").trim(),
        role: String(person.role || "Performer").trim(),
        bio: String(person.bio || "").trim(),
        sort_order: Number.parseFloat(person.sort_order || person.order || index + 1) || index + 1
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function renderShows(shows) {
    const grid = document.querySelector("#shows-grid");
    if (!grid) return;

    grid.textContent = "";

    if (!shows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = getContent("shows.empty");
      grid.append(empty);
      updateCount(0);
      return;
    }

    shows.forEach((show) => grid.append(createShowCard(show)));
    updateCount(shows.length);
  }

  function createShowCard(show) {
    const card = document.createElement("article");
    card.className = `show-card${show.featured ? " featured" : ""}`;

    const date = getShowDate(show.date);
    const dateBlock = document.createElement("div");
    dateBlock.className = "date-block";

    const day = document.createElement("span");
    day.textContent = date ? formatDatePart(date, { weekday: "short" }) : "TBA";

    const monthDay = document.createElement("strong");
    monthDay.textContent = date
      ? formatDatePart(date, { month: "short", day: "numeric" })
      : "Soon";

    dateBlock.append(day, monthDay);

    const body = document.createElement("div");
    body.className = "show-body";

    const meta = document.createElement("p");
    meta.className = "show-meta";
    meta.textContent = [show.time, show.status].filter(Boolean).join(" / ");

    const title = document.createElement("h3");
    title.textContent = show.title;

    const venue = document.createElement("p");
    venue.className = "venue";
    venue.textContent = [show.venue, show.address].filter(Boolean).join(" - ");

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = show.description || "More details coming soon.";

    const action = document.createElement("a");
    action.className = "show-link";
    const hasTicketUrl = show.ticket_url && !show.ticket_url.startsWith("#");
    action.href = show.ticket_url || "#booking";
    action.textContent = hasTicketUrl ? getContent("shows.ticket_label") : getContent("shows.details_label");
    if (hasTicketUrl) {
      action.target = "_blank";
      action.rel = "noopener";
    }

    body.append(meta, title, venue, description, action);
    card.append(dateBlock, body);

    return card;
  }

  function renderCast() {
    const grid = document.querySelector("#cast-grid");
    if (!grid) return;

    grid.textContent = "";

    state.cast.forEach((person) => {
      const card = document.createElement("article");
      card.className = "cast-card";

      const name = document.createElement("h3");
      name.textContent = person.name;

      const role = document.createElement("p");
      role.className = "cast-role";
      role.textContent = person.role;

      const bio = document.createElement("p");
      bio.textContent = person.bio;

      card.append(name, role, bio);
      grid.append(card);
    });
  }

  function updateCount(count) {
    const number = document.querySelector("#show-count-number");
    const label = document.querySelector("#show-count-label");
    if (number) number.textContent = String(count);
    if (label) {
      label.textContent =
        count === 1 ? getContent("hero.show_count_label_singular") : getContent("hero.show_count_label_plural");
    }
  }

  function updateFeedLabels() {
    const source = document.querySelector("#events-source");
    if (source) {
      source.textContent =
        state.source === "Google Sheet" ? getContent("admin.source.google") : getContent("admin.source.sample");
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    rows.push(row);

    return rows.filter((csvRow) => csvRow.some((value) => value.trim() !== ""));
  }

  function rowsToContent(rows) {
    const objects = rowsToObjects(rows);
    const content = {};

    objects.forEach((row) => {
      const key = String(row.key || "").trim();
      const value = String(row.value || row.text || "").trim();
      const status = String(row.status || "").trim().toLowerCase();
      if (key && status !== "hidden") {
        content[key] = value;
      }
    });

    return content;
  }

  function rowsToObjects(rows) {
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => mapHeader(header));

    return rows.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = row[index] || "";
      });
      return item;
    });
  }

  function mapHeader(header) {
    const key = String(header || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const aliases = {
      show: "title",
      show_title: "title",
      location: "venue",
      ticket: "ticket_url",
      tickets: "ticket_url",
      ticket_link: "ticket_url",
      ticket_url: "ticket_url",
      featured_show: "featured",
      sort: "sort_order",
      display_order: "sort_order",
      order: "sort_order",
      copy: "value",
      text: "value"
    };

    return aliases[key] || key;
  }

  function getShowDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDatePart(date, options) {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  function isTruthy(value) {
    return ["1", "true", "yes", "featured"].includes(String(value).trim().toLowerCase());
  }

  function getContent(key) {
    return String(state.content[key] ?? "");
  }

  function setAll(selector, text) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = text;
    });
  }
})();
