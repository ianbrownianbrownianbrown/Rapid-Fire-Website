(function () {
  const config = window.RAPID_FIRE_CONFIG || {};
  const state = {
    source: "Sample data",
    shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : []
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    applyConfig();
    renderCast();
    loadShows()
      .then(({ shows, source }) => {
        state.shows = normalizeShows(shows);
        state.source = source;
        renderShows(state.shows);
        updateFeedLabels();
      })
      .catch(() => {
        state.shows = normalizeShows(config.fallbackShows || []);
        state.source = "Sample data";
        renderShows(state.shows);
        updateFeedLabels();
      });
  }

  function applyConfig() {
    setAll("[data-team-name]", config.teamName || "Rapid Fire Improv");
    setAll(
      "[data-tagline]",
      config.tagline || "Comedy without borders. In-fighting. Greatest comedy on planet earth."
    );

    document.querySelectorAll("[data-logo]").forEach((image) => {
      if (config.logoUrl) {
        image.src = config.logoUrl;
      }
      image.alt = image.alt || "";
    });

    const bookingEmail = document.querySelector("#booking-email");
    if (bookingEmail && config.contactEmail) {
      bookingEmail.href = `mailto:${config.contactEmail}`;
      bookingEmail.textContent = config.contactEmail;
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

  async function loadShows() {
    if (config.googleSheetCsvUrl) {
      const response = await fetch(config.googleSheetCsvUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load sheet");
      }
      const rows = parseCsv(await response.text());
      const shows = rowsToShows(rows);
      if (shows.length > 0) {
        return { shows, source: "Google Sheet" };
      }
    }

    return {
      shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
      source: "Sample data"
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

  function renderShows(shows) {
    const grid = document.querySelector("#shows-grid");
    if (!grid) return;

    grid.textContent = "";

    if (!shows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No upcoming shows are listed yet.";
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
    action.textContent = hasTicketUrl ? "Tickets" : "Details Soon";
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

    const cast = Array.isArray(config.cast) ? config.cast : [];
    grid.textContent = "";

    cast.forEach((person) => {
      const card = document.createElement("article");
      card.className = "cast-card";

      const name = document.createElement("h3");
      name.textContent = person.name || "Rapid Fire Player";

      const role = document.createElement("p");
      role.className = "cast-role";
      role.textContent = person.role || "Performer";

      const bio = document.createElement("p");
      bio.textContent = person.bio || "";

      card.append(name, role, bio);
      grid.append(card);
    });
  }

  function updateCount(count) {
    const number = document.querySelector("#show-count-number");
    const label = document.querySelector("#show-count-label");
    if (number) number.textContent = String(count);
    if (label) label.textContent = count === 1 ? "upcoming show" : "upcoming shows";
  }

  function updateFeedLabels() {
    const source = document.querySelector("#events-source");
    if (source) {
      source.textContent = state.source;
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

  function rowsToShows(rows) {
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => mapHeader(header));

    return rows.slice(1).map((row) => {
      const show = {};
      headers.forEach((header, index) => {
        if (header) show[header] = row[index] || "";
      });
      return show;
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
      featured_show: "featured"
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

  function setAll(selector, text) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = text;
    });
  }
})();
