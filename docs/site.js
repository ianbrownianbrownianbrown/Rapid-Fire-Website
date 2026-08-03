(function () {
  const config = window.RAPID_FIRE_CONFIG || {};
  const state = {
    content: {},
    defaultContent: {},
    editorContent: {},
    contentSource: "Local defaults",
    source: "Sample data",
    castSource: "Local defaults",
    shows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
    editorShows: Array.isArray(config.fallbackShows) ? config.fallbackShows : [],
    activeShowIndex: 0,
    cast: Array.isArray(config.cast) ? config.cast : []
  };

  const COPY_FIELD_GROUPS = [
    {
      title: "Site Basics",
      fields: [
        { key: "site.name", label: "Team name" },
        { key: "site.footer_text", label: "Footer text" },
        { key: "site.logo_alt", label: "Logo alt text" },
        { key: "photo.alt", label: "Team photo alt text", multiline: true }
      ]
    },
    {
      title: "Meta",
      fields: [
        { key: "meta.title", label: "Browser title" },
        { key: "meta.description", label: "Search description", multiline: true },
        { key: "meta.og_title", label: "Share title" },
        { key: "meta.og_description", label: "Share description", multiline: true }
      ]
    },
    {
      title: "Navigation",
      fields: [
        { key: "nav.shows", label: "Shows nav label" },
        { key: "nav.team", label: "Team nav label" },
        { key: "nav.booking", label: "Booking nav label" }
      ]
    },
    {
      title: "Social Links",
      fields: [
        { key: "social.facebook_url", label: "Facebook URL", type: "url" },
        { key: "social.facebook_label", label: "Facebook label" },
        { key: "social.instagram_url", label: "Instagram URL", type: "url" },
        { key: "social.instagram_label", label: "Instagram label" },
        { key: "social.google_reviews_url", label: "Google reviews URL", type: "url" },
        { key: "social.google_reviews_label", label: "Google reviews label" }
      ]
    },
    {
      title: "Hero",
      fields: [
        { key: "hero.eyebrow", label: "Small label" },
        { key: "hero.tagline", label: "Tagline", multiline: true },
        { key: "hero.primary_button", label: "Primary button" },
        { key: "hero.secondary_button", label: "Secondary button" },
        { key: "hero.show_count_label_singular", label: "Show count singular" },
        { key: "hero.show_count_label_plural", label: "Show count plural" },
        { key: "hero.logo_alt", label: "Hero logo alt text" }
      ]
    },
    {
      title: "Shows Section",
      fields: [
        { key: "shows.eyebrow", label: "Small label" },
        { key: "shows.title", label: "Heading" },
        { key: "shows.body", label: "Intro copy", multiline: true },
        { key: "shows.loading", label: "Loading text" },
        { key: "shows.empty", label: "Empty state" },
        { key: "shows.ticket_label", label: "Ticket link label" },
        { key: "shows.details_label", label: "Details link label" }
      ]
    },
    {
      title: "Ensemble Section",
      fields: [
        { key: "team.eyebrow", label: "Small label" },
        { key: "team.title", label: "Heading" },
        { key: "team.subhead", label: "Subheading", multiline: true },
        { key: "team.body", label: "Body copy", multiline: true }
      ]
    },
    {
      title: "Booking Section",
      fields: [
        { key: "booking.eyebrow", label: "Small label" },
        { key: "booking.title", label: "Heading" },
        { key: "booking.body", label: "Body copy", multiline: true },
        { key: "booking.email", label: "Booking email", type: "email" },
        { key: "booking.button_label", label: "Button label" }
      ]
    },
    {
      title: "Hidden Admin Page",
      fields: [
        { key: "admin.meta.title", label: "Admin browser title" },
        { key: "admin.meta.description", label: "Admin search description", multiline: true },
        { key: "admin.nav.team_edit", label: "Admin nav label" },
        { key: "admin.hero.eyebrow", label: "Admin hero small label" },
        { key: "admin.hero.title", label: "Admin hero heading" },
        { key: "admin.hero.body", label: "Admin hero body", multiline: true },
        { key: "admin.hero.edit_copy_button", label: "Edit copy button" },
        { key: "admin.hero.edit_shows_button", label: "Edit shows button" },
        { key: "admin.hero.view_public_button", label: "View public button" },
        { key: "admin.copy.eyebrow", label: "Copy editor small label" },
        { key: "admin.copy.title", label: "Copy editor heading" },
        { key: "admin.copy.body", label: "Copy editor body", multiline: true },
        { key: "admin.copy.save_draft", label: "Copy draft button" },
        { key: "admin.copy.publish", label: "Copy publish button" },
        { key: "admin.copy.reload", label: "Copy reload button" },
        { key: "admin.editor.eyebrow", label: "Show editor small label" },
        { key: "admin.editor.title", label: "Show editor heading" },
        { key: "admin.editor.list_title", label: "Show list title" },
        { key: "admin.editor.new_show", label: "New show button" },
        { key: "admin.editor.save_draft", label: "Show draft button" },
        { key: "admin.editor.delete_show", label: "Delete show button" },
        { key: "admin.editor.publish", label: "Show publish button" },
        { key: "admin.editor.reload", label: "Show reload button" },
        { key: "admin.preview.eyebrow", label: "Preview small label" },
        { key: "admin.preview.title", label: "Preview heading" },
        { key: "admin.footer.public_site", label: "Public site footer link" }
      ]
    }
  ];

  const COPY_FIELDS = COPY_FIELD_GROUPS.flatMap((group) => group.fields);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    state.defaultContent = getDefaultContent();
    state.content = {
      ...state.defaultContent,
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
    initContentEditor();
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
      "social.facebook_url": config.socials?.facebook || "",
      "social.facebook_label": "Facebook",
      "social.instagram_url": config.socials?.instagram || "",
      "social.instagram_label": "Instagram",
      "social.google_reviews_url": config.socials?.google_reviews || "",
      "social.google_reviews_label": "Google reviews",
      "hero.logo_alt": "Rapid Fire Improv neon logo",
      "hero.eyebrow": "Live improv comedy",
      "hero.tagline": config.tagline || "Comedy without borders. In-fighting. Greatest comedy on planet earth.",
      "hero.primary_button": "Upcoming Shows",
      "hero.secondary_button": "Book the Team",
      "hero.show_count_label_singular": "upcoming show",
      "hero.show_count_label_plural": "upcoming shows",
      "photo.alt": "Rapid Fire Improv performers lying shoulder to shoulder and smiling at the camera",
      "shows.eyebrow": "Lorem ipsum",
      "shows.title": "Dolor Sit Amet",
      "shows.body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "shows.loading": "Lorem ipsum",
      "shows.empty": "Lorem ipsum dolor sit amet.",
      "shows.ticket_label": "Lorem ipsum",
      "shows.details_label": "Dolor sit",
      "team.eyebrow": "The ensemble",
      "team.title": "Stories Built in the Room",
      "team.subhead": "Narrative long-form improv that turns audience sparks into strange little worlds.",
      "team.body":
        "From one-shot DnD campaigns inspired by audience suggestions to interwoven stories about a made-up town, we take a narrative-driven approach to long-form improv that lets audiences watch a whole world snap into place in real time.",
      "booking.eyebrow": "Booking",
      "booking.title": "Bring Rapid Fire to the Room",
      "booking.body": "DM us on Instagram or reach out to",
      "booking.email": config.contactEmail || "booking@rapidfireimprov.com",
      "booking.button_label": "Email Booking",
      "admin.meta.title": "Team Edit - Rapid Fire Improv",
      "admin.meta.description": "Rapid Fire Improv team editing hub.",
      "admin.nav.team_edit": "Team Edit",
      "admin.hero.eyebrow": "Team hub",
      "admin.hero.title": "Update the Site",
      "admin.hero.body": "Edit upcoming shows and the words across the public page from this hidden team page.",
      "admin.hero.edit_copy_button": "Edit Copy",
      "admin.hero.edit_shows_button": "Edit Shows",
      "admin.hero.view_public_button": "View Public Shows",
      "admin.copy.eyebrow": "Site copy",
      "admin.copy.title": "Copy Control",
      "admin.copy.body": "Edit the headings, buttons, descriptions, and hidden-page labels across the site.",
      "admin.copy.save_draft": "Save Copy Draft",
      "admin.copy.publish": "Publish Copy",
      "admin.copy.reload": "Reload Copy",
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
      element.textContent = value;
    });

    document.querySelectorAll("[data-content-attr]").forEach((element) => {
      const pairs = element.dataset.contentAttr.split(";").map((item) => item.trim()).filter(Boolean);
      pairs.forEach((pair) => {
        const separator = pair.indexOf(":");
        if (separator === -1) return;
        const attr = pair.slice(0, separator).trim();
        const key = pair.slice(separator + 1).trim();
        const value = getContent(key);
        if (attr) {
          element.setAttribute(attr, value);
        }
      });
    });

    applySocialLinks();
    applyBookingEmail();
  }

  function applyBookingEmail() {
    const email = String(getContent("booking.email") || "").replace(/\s+/g, "");
    const mailto = email ? `mailto:${email}` : "#";
    const inlineEmail = document.querySelector("#booking-inline-email");
    const bookingButton = document.querySelector("#booking-email");

    if (inlineEmail) {
      inlineEmail.textContent = email;
      inlineEmail.href = mailto;
      inlineEmail.hidden = !email;
    }

    if (bookingButton) {
      bookingButton.href = mailto;
      bookingButton.classList.toggle("is-disabled", !email);
      if (email) {
        bookingButton.removeAttribute("aria-disabled");
        bookingButton.removeAttribute("tabindex");
      } else {
        bookingButton.setAttribute("aria-disabled", "true");
        bookingButton.setAttribute("tabindex", "-1");
      }
    }
  }

  function applySocialLinks() {
    document.querySelectorAll("[data-social-link]").forEach((link) => {
      const href = String(link.getAttribute("href") || "").trim();
      const disabled = !href || href === "#";

      link.classList.toggle("is-disabled", disabled);
      link.hidden = disabled;

      if (disabled) {
        link.setAttribute("href", "#");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
        link.removeAttribute("target");
        link.removeAttribute("rel");
      } else {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
      }
    });

    document.querySelectorAll(".social-links").forEach((container) => {
      const hasVisibleLink = Boolean(container.querySelector("[data-social-link]:not([hidden])"));
      container.hidden = !hasVisibleLink;
    });
  }

  async function loadContent() {
    if (config.contentDataUrl) {
      const content = await fetchContentJson(config.contentDataUrl);
      if (Object.keys(content).length > 0) {
        return { content, source: "Site admin" };
      }
    }

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

  async function fetchContentJson(url) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load site copy");
    }

    const data = await response.json();
    const content = data && typeof data.content === "object" ? data.content : data;
    return content && !Array.isArray(content) ? content : {};
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

  function initContentEditor() {
    const form = document.querySelector("#admin-copy-form");
    if (!form) return;

    state.editorContent = {
      ...state.defaultContent,
      ...state.content
    };

    initStoredToken("#copy-github-token", "#copy-remember-token");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCurrentContentDraft();
    });

    document.querySelector("#admin-publish-copy")?.addEventListener("click", () => {
      publishAdminContent().catch((error) => {
        setAdminCopyStatus(error.message || "Could not publish copy");
      });
    });

    document.querySelector("#admin-reload-copy")?.addEventListener("click", () => {
      reloadAdminContent().catch((error) => {
        setAdminCopyStatus(error.message || "Could not reload copy");
      });
    });

    renderContentEditor();
  }

  function renderContentEditor() {
    const container = document.querySelector("#admin-copy-fields");
    if (!container) return;

    renderCopyMenu();
    container.textContent = "";

    COPY_FIELD_GROUPS.forEach((group, index) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "copy-group";
      fieldset.id = getCopyGroupId(group.title, index);
      fieldset.tabIndex = -1;

      const legend = document.createElement("legend");
      legend.textContent = group.title;
      fieldset.append(legend);

      group.fields.forEach((field) => {
        const label = document.createElement("label");
        label.className = "copy-field";

        const labelText = document.createElement("span");
        labelText.textContent = field.label;

        const keyText = document.createElement("span");
        keyText.className = "copy-field-key";
        keyText.textContent = field.key;

        const input = document.createElement(field.multiline ? "textarea" : "input");
        input.dataset.copyKey = field.key;
        input.value = String(state.editorContent[field.key] ?? "");
        if (field.multiline) {
          input.rows = 4;
        } else {
          input.type = field.type || "text";
        }

        label.append(labelText, keyText, input);
        fieldset.append(label);
      });

      container.append(fieldset);
    });
  }

  function renderCopyMenu() {
    const menu = document.querySelector("#admin-copy-menu");
    if (!menu) return;

    menu.textContent = "";

    COPY_FIELD_GROUPS.forEach((group, index) => {
      const link = document.createElement("a");
      link.href = `#${getCopyGroupId(group.title, index)}`;
      link.textContent = group.title;
      link.className = "copy-menu-link";
      menu.append(link);
    });
  }

  function getCopyGroupId(title, index) {
    const slug = String(title || "section")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `copy-group-${index + 1}-${slug || "section"}`;
  }

  function saveCurrentContentDraft(options = {}) {
    document.querySelectorAll("[data-copy-key]").forEach((field) => {
      state.editorContent[field.dataset.copyKey] = field.value;
    });

    const prepared = prepareContentForSave(state.editorContent);
    state.editorContent = {
      ...state.defaultContent,
      ...prepared
    };
    state.content = {
      ...state.defaultContent,
      ...prepared
    };

    applyContent();
    updateCount(state.shows.length);
    updateFeedLabels();

    if (!options.silent) setAdminCopyStatus("Copy draft saved");
  }

  async function reloadAdminContent() {
    if (!config.contentDataUrl) throw new Error("No site copy file configured");
    const content = await fetchContentJson(config.contentDataUrl);
    state.editorContent = {
      ...state.defaultContent,
      ...content
    };
    state.content = {
      ...state.defaultContent,
      ...content
    };
    applyContent();
    updateCount(state.shows.length);
    updateFeedLabels();
    renderContentEditor();
    setAdminCopyStatus("Copy reloaded");
  }

  async function publishAdminContent() {
    saveCurrentContentDraft({ silent: true });

    const token = getPublishToken("#copy-github-token", "#copy-remember-token");
    const repo = config.github || {};
    if (!token) throw new Error("Add a GitHub save key");
    if (!repo.contentPath) throw new Error("Copy publishing is not configured");

    setAdminCopyStatus("Publishing copy...");

    const content = `${JSON.stringify({
      updated_at: new Date().toISOString(),
      content: prepareContentForSave(state.editorContent)
    }, null, 2)}\n`;

    await publishJsonFile(repo.contentPath, content, token, "Update site copy from hidden admin page");
    state.contentSource = "Site admin";
    applyContent();
    setAdminCopyStatus("Copy published");
  }

  function prepareContentForSave(content) {
    return COPY_FIELDS.reduce((savedContent, field) => {
      savedContent[field.key] = String(content[field.key] ?? "").trim();
      return savedContent;
    }, {});
  }

  function initAdminEditor() {
    const form = document.querySelector("#admin-show-form");
    if (!form) return;

    initStoredToken("#github-token", "#remember-token");

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

    const repo = config.github || {};
    const token = getPublishToken("#github-token", "#remember-token");

    if (!token) throw new Error("Add a GitHub save key");
    if (!repo.owner || !repo.repo || !repo.showsPath) throw new Error("GitHub publishing is not configured");

    setAdminStatus("Publishing...");
    const content = `${JSON.stringify({
      updated_at: new Date().toISOString(),
      shows: state.editorShows.map(prepareShowForSave)
    }, null, 2)}\n`;

    await publishJsonFile(repo.showsPath, content, token, "Update shows from hidden admin page");

    state.source = "Site admin";
    syncAdminPreview();
    setAdminStatus("Published");
  }

  async function publishJsonFile(repoPath, content, token, message) {
    const repo = config.github || {};
    if (!repo.owner || !repo.repo || !repoPath) throw new Error("GitHub publishing is not configured");

    const branch = repo.branch || "main";
    const fileUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(repoPath)}?ref=${encodeURIComponent(branch)}`;
    const currentFile = await fetch(fileUrl, {
      headers: getGithubHeaders(token)
    });

    if (!currentFile.ok) {
      throw new Error(await getGithubError(currentFile, "Could not read site file"));
    }

    const current = await currentFile.json();
    const update = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(repoPath)}`, {
      method: "PUT",
      headers: getGithubHeaders(token),
      body: JSON.stringify({
        message,
        content: toBase64Utf8(content),
        sha: current.sha,
        branch
      })
    });

    if (!update.ok) {
      throw new Error(await getGithubError(update, "Could not publish site file"));
    }
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

  function initStoredToken(tokenSelector, rememberSelector) {
    const tokenInput = document.querySelector(tokenSelector);
    const rememberToken = document.querySelector(rememberSelector);
    const savedToken = window.localStorage.getItem("rapidFireGithubToken") || "";

    if (tokenInput && savedToken) {
      tokenInput.value = savedToken;
      if (rememberToken) rememberToken.checked = true;
    }
  }

  function getPublishToken(tokenSelector, rememberSelector) {
    const tokenInput = document.querySelector(tokenSelector);
    const rememberToken = document.querySelector(rememberSelector);
    const token = String(tokenInput?.value || "").trim();

    if (rememberToken?.checked && token) {
      window.localStorage.setItem("rapidFireGithubToken", token);
    } else if (rememberToken && !rememberToken.checked) {
      window.localStorage.removeItem("rapidFireGithubToken");
    }

    return token;
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

  function setAdminCopyStatus(message) {
    const status = document.querySelector("#admin-copy-status");
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
