(function () {
  const config = window.RAPID_FIRE_CONFIG || {};
  const state = {
    content: {},
    contentSource: "Local defaults",
    source: "Sample data",
    castSource: "Local defaults",
    shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
    editorShows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
    activeShowIndex: 0,
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

    const loadedShows =
      showsResult.status === "fulfilled" ? showsResult.value.shows : config.fallbackShows || [];
    state.editorShows = normalizeEditableShows(loadedShows);
    state.shows = normalizeShows(state.editorShows);
    state.source = showsResult.status === "fulfilled" ? showsResult.value.source : "Sample data";

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
    initAdminEditor();
  }

  function initBannerFade() {
    if (!document.body.classList.contains("home-page")) return;

    let ticking = false;
    const update = () => {
      const progress = Math.min(window.scrollY / 360, 1);
      const root = document.documentElement.style;
      const opacity = 1 - progress * 0.86;
      root.setProperty("--banner-opacity", opacity.toFixed(3));
      root.setProperty("--hero-top-wash", (progress * 0.52).toFixed(3));
      root.setProperty("--hero-mid-wash", (0.08 + progress * 0.62).toFixed(3));
      root.setProperty("--hero-bottom-wash", (0.86 + progress * 0.1).toFixed(3));
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
      "site.footer_text": "Lorem ipsum",
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
      "ticker.1": "Lorem ipsum",
      "ticker.2": "Dolor sit amet",
      "ticker.3": "Consectetur",
      "ticker.4": "Adipiscing elit",
      "shows.eyebrow": "Lorem ipsum",
      "shows.title": "Dolor Sit Amet",
      "shows.body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "shows.loading": "Lorem ipsum",
      "shows.empty": "Lorem ipsum dolor sit amet.",
      "shows.ticket_label": "Lorem ipsum",
      "shows.details_label": "Dolor sit",
      "team.eyebrow": "Consectetur",
      "team.title": "Adipiscing Elit",
      "team.body": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      "booking.eyebrow": "Sed do",
      "booking.title": "Eiusmod Tempor",
      "booking.body": "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "booking.button_label": "Lorem ipsum",
      "admin.meta.title": "Team Edit - Rapid Fire Improv",
      "admin.meta.description": "Rapid Fire Improv team editing hub.",
      "admin.nav.team_edit": "Team Edit",
      "admin.hero.eyebrow": "Team hub",
      "admin.hero.title": "Update the Site",
      "admin.hero.body": "Add and edit upcoming shows from the hidden team page.",
      "admin.hero.edit_shows_button": "Edit Shows",
      "admin.hero.view_public_button": "View Public Shows",
      "admin.editor.eyebrow": "Shows",
      "admin.editor.title": "Show Control",
      "admin.editor.list_title": "Upcoming Shows",
      "admin.editor.new_show": "New Show",
      "admin.editor.save_draft": "Save Draft",
      "admin.editor.delete_show": "Delete Show",
      "admin.editor.publish": "Publish Shows",
      "admin.editor.reload": "Reload",
      "admin.preview.eyebrow": "Preview",
      "admin.preview.title": "Current Feed",
      "admin.source.sample": "Sample data",
      "admin.source.google": "Google Sheet",
      "admin.source.site": "Site admin",
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
    if (config.showsDataUrl) {
      const shows = await fetchShowsJson(config.showsDataUrl);
      if (shows.length > 0) {
        return { shows, source: "Site admin" };
      }
    }

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

  async function fetchShowsJson(url) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load show data");
    }

    const data = await response.json();
    const shows = Array.isArray(data) ? data : data.shows;
    return Array.isArray(shows) ? shows : [];
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

  function normalizeEditableShows(shows) {
    return shows
      .filter(Boolean)
      .map((show) => ({
        date: String(show.date || "").trim(),
        time: String(show.time || "").trim(),
        title: String(show.title || "").trim(),
        venue: String(show.venue || "").trim(),
        address: String(show.address || "").trim(),
        ticket_url: String(show.ticket_url || show.ticketUrl || "").trim(),
        description: String(show.description || "").trim(),
        status: String(show.status || "").trim(),
        featured: isTruthy(show.featured)
      }))
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
      if (state.source === "Site admin") {
        source.textContent = getContent("admin.source.site");
      } else if (state.source === "Google Sheet") {
        source.textContent = getContent("admin.source.google");
      } else {
        source.textContent = getContent("admin.source.sample");
      }
    }
  }

  function initAdminEditor() {
    const form = document.querySelector("#admin-show-form");
    if (!form) return;

    const tokenInput = document.querySelector("#github-token");
    const rememberToken = document.querySelector("#remember-token");
    const savedToken = window.localStorage.getItem("rapidFireGithubToken") || "";

    if (tokenInput && savedToken) {
      tokenInput.value = savedToken;
      if (rememberToken) rememberToken.checked = true;
    }

    if (!state.editorShows.length) {
      state.editorShows.push(createBlankShow());
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCurrentAdminShow();
      setAdminStatus("Draft saved");
    });

    document.querySelector("#admin-new-show")?.addEventListener("click", () => {
      saveCurrentAdminShow({ silent: true });
      state.editorShows.push(createBlankShow());
      state.activeShowIndex = state.editorShows.length - 1;
      renderAdminEditor();
      setAdminStatus("New show ready");
    });

    document.querySelector("#admin-delete-show")?.addEventListener("click", () => {
      if (!state.editorShows.length) return;
      state.editorShows.splice(state.activeShowIndex, 1);
      if (!state.editorShows.length) {
        state.editorShows.push(createBlankShow());
      }
      state.activeShowIndex = Math.min(state.activeShowIndex, state.editorShows.length - 1);
      renderAdminEditor();
      syncAdminPreview();
      setAdminStatus("Show removed from draft");
    });

    document.querySelector("#admin-publish-shows")?.addEventListener("click", () => {
      publishAdminShows().catch((error) => {
        setAdminStatus(error.message || "Could not publish shows");
      });
    });

    document.querySelector("#admin-reload-shows")?.addEventListener("click", () => {
      reloadAdminShows().catch((error) => {
        setAdminStatus(error.message || "Could not reload shows");
      });
    });

    renderAdminEditor();
    syncAdminPreview();
  }

  function createBlankShow() {
    return {
      date: "",
      time: "7:00 PM",
      title: "New Show",
      venue: "Venue TBA",
      address: "",
      ticket_url: "#booking",
      description: "",
      status: "Details soon",
      featured: false
    };
  }

  function renderAdminEditor() {
    renderAdminShowList();
    populateAdminForm();
  }

  function renderAdminShowList() {
    const list = document.querySelector("#admin-show-list");
    if (!list) return;

    list.textContent = "";
    state.editorShows.forEach((show, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `admin-show-item${index === state.activeShowIndex ? " is-active" : ""}`;
      button.dataset.index = String(index);

      const title = document.createElement("strong");
      title.textContent = show.title || "Untitled show";

      const meta = document.createElement("span");
      meta.textContent = [show.date || "No date", show.time, show.status].filter(Boolean).join(" / ");

      button.append(title, meta);
      button.addEventListener("click", () => {
        saveCurrentAdminShow({ silent: true });
        state.activeShowIndex = index;
        renderAdminEditor();
      });

      list.append(button);
    });
  }

  function populateAdminForm() {
    const show = state.editorShows[state.activeShowIndex] || createBlankShow();
    setFieldValue("#admin-show-index", state.activeShowIndex);
    setFieldValue("#show-date", show.date);
    setFieldValue("#show-time", show.time);
    setFieldValue("#show-title-input", show.title);
    setFieldValue("#show-status", show.status);
    setFieldValue("#show-venue", show.venue);
    setFieldValue("#show-address", show.address);
    setFieldValue("#show-ticket-url", show.ticket_url);
    setFieldValue("#show-description", show.description);

    const featured = document.querySelector("#show-featured");
    if (featured) featured.checked = Boolean(show.featured);
  }

  function saveCurrentAdminShow(options = {}) {
    const index = Number.parseInt(document.querySelector("#admin-show-index")?.value || state.activeShowIndex, 10);
    if (!Number.isFinite(index) || index < 0 || index >= state.editorShows.length) return;

    state.editorShows[index] = {
      date: getFieldValue("#show-date"),
      time: getFieldValue("#show-time"),
      title: getFieldValue("#show-title-input"),
      venue: getFieldValue("#show-venue"),
      address: getFieldValue("#show-address"),
      ticket_url: getFieldValue("#show-ticket-url"),
      description: getFieldValue("#show-description"),
      status: getFieldValue("#show-status"),
      featured: document.querySelector("#show-featured")?.checked || false
    };

    syncAdminPreview();
    renderAdminShowList();
    if (!options.silent) setAdminStatus("Draft saved");
  }

  function syncAdminPreview() {
    state.shows = normalizeShows(state.editorShows);
    renderShows(state.shows);
    updateFeedLabels();
  }

  async function reloadAdminShows() {
    if (!config.showsDataUrl) throw new Error("No show data file configured");
    const shows = await fetchShowsJson(config.showsDataUrl);
    state.editorShows = normalizeEditableShows(shows);
    if (!state.editorShows.length) {
      state.editorShows.push(createBlankShow());
    }
    state.activeShowIndex = 0;
    state.source = "Site admin";
    renderAdminEditor();
    syncAdminPreview();
    setAdminStatus("Reloaded");
  }

  async function publishAdminShows() {
    saveCurrentAdminShow({ silent: true });

    const tokenInput = document.querySelector("#github-token");
    const rememberToken = document.querySelector("#remember-token");
    const token = String(tokenInput?.value || "").trim();
    const repo = config.github || {};

    if (!token) throw new Error("Add a GitHub save key");
    if (!repo.owner || !repo.repo || !repo.showsPath) throw new Error("GitHub publishing is not configured");

    if (rememberToken?.checked) {
      window.localStorage.setItem("rapidFireGithubToken", token);
    } else {
      window.localStorage.removeItem("rapidFireGithubToken");
    }

    setAdminStatus("Publishing...");

    const branch = repo.branch || "main";
    const fileUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(repo.showsPath)}?ref=${encodeURIComponent(branch)}`;
    const currentFile = await fetch(fileUrl, {
      headers: getGithubHeaders(token)
    });

    if (!currentFile.ok) {
      throw new Error(await getGithubError(currentFile, "Could not read show file"));
    }

    const current = await currentFile.json();
    const content = `${JSON.stringify({
      updated_at: new Date().toISOString(),
      shows: state.editorShows.map(prepareShowForSave)
    }, null, 2)}\n`;

    const update = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(repo.showsPath)}`, {
      method: "PUT",
      headers: getGithubHeaders(token),
      body: JSON.stringify({
        message: "Update shows from hidden admin page",
        content: toBase64Utf8(content),
        sha: current.sha,
        branch
      })
    });

    if (!update.ok) {
      throw new Error(await getGithubError(update, "Could not publish shows"));
    }

    state.source = "Site admin";
    syncAdminPreview();
    setAdminStatus("Published");
  }

  function prepareShowForSave(show) {
    return {
      date: String(show.date || "").trim(),
      time: String(show.time || "").trim(),
      title: String(show.title || "").trim(),
      venue: String(show.venue || "").trim(),
      address: String(show.address || "").trim(),
      ticket_url: String(show.ticket_url || "").trim(),
      description: String(show.description || "").trim(),
      status: String(show.status || "").trim(),
      featured: Boolean(show.featured)
    };
  }

  function getGithubHeaders(token) {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  async function getGithubError(response, fallback) {
    try {
      const data = await response.json();
      return data.message ? `${fallback}: ${data.message}` : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function encodePath(path) {
    return String(path).split("/").map(encodeURIComponent).join("/");
  }

  function toBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function setFieldValue(selector, value) {
    const field = document.querySelector(selector);
    if (field) field.value = value ?? "";
  }

  function getFieldValue(selector) {
    return String(document.querySelector(selector)?.value || "").trim();
  }

  function setAdminStatus(message) {
    const status = document.querySelector("#admin-edit-status");
    if (status) status.textContent = message;
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
