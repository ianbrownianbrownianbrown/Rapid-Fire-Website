(function () {
  const config = window.RAPID_FIRE_CONFIG || {};
  const rolePlay = config.rolePlay || {};
  const state = { shows: [], editorShows: [], activeShowIndex: 0, sharedContent: {} };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    applyLogo();
    const [showsResult, contentResult] = await Promise.allSettled([loadShows(), loadSharedContent()]);
    state.editorShows = normalizeEditableShows(showsResult.status === "fulfilled" ? showsResult.value : []);
    state.shows = normalizeShows(state.editorShows);
    state.sharedContent = contentResult.status === "fulfilled" ? contentResult.value : {};
    applyBookingDetails();
    renderShows();
    initAdminEditor();
  }

  function applyLogo() {
    document.querySelectorAll("[data-logo]").forEach((image) => {
      if (config.logoUrl) image.src = config.logoUrl;
    });
  }

  async function loadShows() {
    const url = rolePlay.showsDataUrl || "data/role-play-shows.json";
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load Role Play, Play, Role schedule");
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data.shows) ? data.shows : [];
  }

  async function loadSharedContent() {
    if (!config.contentDataUrl) return {};
    const response = await fetch(`${config.contentDataUrl}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data.content === "object" ? data.content : {};
  }

  function applyBookingDetails() {
    const email = String(state.sharedContent["booking.email"] || config.contactEmail || "").trim();
    const phone = String(state.sharedContent["booking.phone"] || config.contactPhone || "").trim();
    const phoneIntro = String(state.sharedContent["booking.phone_intro"] || "or call/text").trim();
    const emailLink = document.querySelector("#role-play-email");
    const phoneLink = document.querySelector("#role-play-phone");
    const phoneIntroNode = document.querySelector("#role-play-phone-intro");
    const button = document.querySelector("#role-play-booking-button");

    if (emailLink) {
      emailLink.textContent = email;
      emailLink.href = email ? `mailto:${email}` : "#";
      emailLink.hidden = !email;
    }
    if (phoneLink) {
      phoneLink.textContent = phone;
      phoneLink.href = phone ? `tel:+${phone.replace(/\D/g, "")}` : "#";
      phoneLink.hidden = !phone;
    }
    if (phoneIntroNode) {
      phoneIntroNode.textContent = phoneIntro;
      phoneIntroNode.hidden = !phone;
    }
    if (button) {
      button.href = email ? `mailto:${email}` : "#";
      button.classList.toggle("is-disabled", !email);
    }
  }

  function normalizeEditableShows(shows) {
    return shows.filter(Boolean).map((show) => ({
      date: String(show.date || "").trim(),
      time: String(show.time || "").trim(),
      title: String(show.title || "").trim(),
      venue: String(show.venue || "").trim(),
      address: String(show.address || "").trim(),
      ticket_url: String(show.ticket_url || "").trim(),
      description: String(show.description || "").trim(),
      featured: Boolean(show.featured)
    })).sort(sortShows);
  }

  function normalizeShows(shows) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return normalizeEditableShows(shows).filter((show) => {
      const date = getShowDate(show.date);
      return !date || date >= today;
    });
  }

  function sortShows(left, right) {
    const leftDate = getShowDate(left.date);
    const rightDate = getShowDate(right.date);
    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    return leftDate - rightDate;
  }

  function renderShows() {
    const grid = document.querySelector("#role-play-shows-grid");
    if (!grid) return;
    grid.textContent = "";
    if (!state.shows.length) {
      const empty = document.createElement("p");
      empty.className = "role-play-empty";
      empty.textContent = "No quests are on the board yet. Check back soon.";
      grid.append(empty);
      return;
    }
    state.shows.forEach((show) => grid.append(createShowCard(show)));
  }

  function createShowCard(show) {
    const card = document.createElement("article");
    card.className = `role-play-show-card${show.featured ? " featured" : ""}`;
    const date = getShowDate(show.date);
    const dateBlock = document.createElement("div");
    dateBlock.className = "role-play-date";
    const weekday = document.createElement("span");
    weekday.textContent = date ? formatDate(date, { weekday: "short" }) : "TBA";
    const monthDay = document.createElement("strong");
    monthDay.textContent = date ? formatDate(date, { month: "short", day: "numeric" }) : "Soon";
    dateBlock.append(weekday, monthDay);

    const body = document.createElement("div");
    const time = document.createElement("p");
    time.className = "role-play-show-time";
    time.textContent = show.time;
    const title = document.createElement("h3");
    title.textContent = show.title || "Quest details coming soon";
    const venue = document.createElement("p");
    venue.className = "role-play-show-venue";
    venue.textContent = [show.venue, show.address].filter(Boolean).join(" - ");
    const description = document.createElement("p");
    description.className = "role-play-show-description";
    description.textContent = show.description;
    if (show.time) body.append(time);
    body.append(title, venue, description);
    if (show.ticket_url) {
      const link = document.createElement("a");
      link.className = "role-play-show-link";
      link.href = show.ticket_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Join the quest";
      body.append(link);
    }
    card.append(dateBlock, body);
    return card;
  }

  function initAdminEditor() {
    const form = document.querySelector("#role-play-show-form");
    if (!form) return;
    initializeToken();
    if (!state.editorShows.length) state.editorShows.push(createBlankShow());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCurrentShow();
      setAdminStatus("Draft saved");
    });
    document.querySelector("#role-play-new-show")?.addEventListener("click", () => {
      saveCurrentShow({ silent: true });
      state.editorShows.push(createBlankShow());
      state.activeShowIndex = state.editorShows.length - 1;
      renderAdminEditor();
      setAdminStatus("New quest ready");
    });
    document.querySelector("#role-play-delete-show")?.addEventListener("click", () => {
      state.editorShows.splice(state.activeShowIndex, 1);
      if (!state.editorShows.length) state.editorShows.push(createBlankShow());
      state.activeShowIndex = Math.min(state.activeShowIndex, state.editorShows.length - 1);
      renderAdminEditor();
      setAdminStatus("Quest removed from draft");
    });
    document.querySelector("#role-play-publish-shows")?.addEventListener("click", () => {
      publishShows().catch((error) => setAdminStatus(error.message || "Could not publish schedule"));
    });
    document.querySelector("#role-play-reload-shows")?.addEventListener("click", () => {
      reloadShows().catch((error) => setAdminStatus(error.message || "Could not reload schedule"));
    });
    renderAdminEditor();
  }

  function createBlankShow() {
    return { date: "", time: "7:30 PM", title: "New quest", venue: "Venue TBA", address: "", ticket_url: "", description: "", featured: false };
  }

  function renderAdminEditor() {
    const list = document.querySelector("#role-play-show-list");
    if (!list) return;
    list.textContent = "";
    state.editorShows.forEach((show, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `admin-show-item${index === state.activeShowIndex ? " is-active" : ""}`;
      const title = document.createElement("strong");
      title.textContent = show.title || "Untitled quest";
      const meta = document.createElement("span");
      meta.textContent = [show.date || "No date", show.time].filter(Boolean).join(" / ");
      item.append(title, meta);
      item.addEventListener("click", () => {
        saveCurrentShow({ silent: true });
        state.activeShowIndex = index;
        renderAdminEditor();
      });
      list.append(item);
    });
    const show = state.editorShows[state.activeShowIndex] || createBlankShow();
    setValue("#role-play-show-index", state.activeShowIndex);
    setValue("#role-play-show-date", show.date);
    setValue("#role-play-show-time", show.time);
    setValue("#role-play-show-title", show.title);
    setValue("#role-play-show-venue", show.venue);
    setValue("#role-play-show-address", show.address);
    setValue("#role-play-show-ticket-url", show.ticket_url);
    setValue("#role-play-show-description", show.description);
    const featured = document.querySelector("#role-play-show-featured");
    if (featured) featured.checked = Boolean(show.featured);
  }

  function saveCurrentShow(options = {}) {
    const index = Number.parseInt(document.querySelector("#role-play-show-index")?.value || state.activeShowIndex, 10);
    if (!Number.isFinite(index) || !state.editorShows[index]) return;
    state.editorShows[index] = {
      date: getValue("#role-play-show-date"),
      time: getValue("#role-play-show-time"),
      title: getValue("#role-play-show-title"),
      venue: getValue("#role-play-show-venue"),
      address: getValue("#role-play-show-address"),
      ticket_url: getValue("#role-play-show-ticket-url"),
      description: getValue("#role-play-show-description"),
      featured: Boolean(document.querySelector("#role-play-show-featured")?.checked)
    };
    state.shows = normalizeShows(state.editorShows);
    renderShows();
    renderAdminEditor();
    if (!options.silent) setAdminStatus("Draft saved");
  }

  async function reloadShows() {
    state.editorShows = normalizeEditableShows(await loadShows());
    if (!state.editorShows.length) state.editorShows.push(createBlankShow());
    state.activeShowIndex = 0;
    state.shows = normalizeShows(state.editorShows);
    renderShows();
    renderAdminEditor();
    setAdminStatus("Schedule reloaded");
  }

  async function publishShows() {
    saveCurrentShow({ silent: true });
    const token = String(document.querySelector("#role-play-github-token")?.value || "").trim();
    const repo = config.github || {};
    const path = rolePlay.showsPath || "docs/data/role-play-shows.json";
    if (!token) throw new Error("Add a GitHub save key");
    if (!repo.owner || !repo.repo || !path) throw new Error("GitHub publishing is not configured");
    setAdminStatus("Publishing schedule...");
    const content = `${JSON.stringify({ updated_at: new Date().toISOString(), shows: state.editorShows }, null, 2)}\n`;
    const branch = repo.branch || "main";
    const base = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodePath(path)}`;
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" };
    const currentResponse = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
    if (!currentResponse.ok) throw new Error("Could not read schedule file");
    const current = await currentResponse.json();
    const update = await fetch(base, { method: "PUT", headers, body: JSON.stringify({ message: "Update Role Play, Play, Role schedule", content: toBase64(content), sha: current.sha, branch }) });
    if (!update.ok) throw new Error("Could not publish schedule");
    setAdminStatus("Schedule published");
  }

  function initializeToken() {
    const saved = window.localStorage.getItem("rapidFireGithubToken") || "";
    const input = document.querySelector("#role-play-github-token");
    const remember = document.querySelector("#role-play-remember-token");
    if (input && saved) { input.value = saved; if (remember) remember.checked = true; }
    input?.addEventListener("input", () => {
      if (remember?.checked && input.value.trim()) window.localStorage.setItem("rapidFireGithubToken", input.value.trim());
    });
    remember?.addEventListener("change", () => {
      if (remember.checked && input?.value.trim()) window.localStorage.setItem("rapidFireGithubToken", input.value.trim());
      if (!remember.checked) window.localStorage.removeItem("rapidFireGithubToken");
    });
  }

  function setAdminStatus(message) { const node = document.querySelector("#role-play-admin-status"); if (node) node.textContent = message; }
  function setValue(selector, value) { const node = document.querySelector(selector); if (node) node.value = value ?? ""; }
  function getValue(selector) { return String(document.querySelector(selector)?.value || "").trim(); }
  function getShowDate(value) { const raw = String(value || "").trim(); const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw); return Number.isNaN(date.getTime()) ? null : date; }
  function formatDate(date, options) { return new Intl.DateTimeFormat("en-US", options).format(date); }
  function encodePath(value) { return String(value).split("/").map(encodeURIComponent).join("/"); }
  function toBase64(value) { const bytes = new TextEncoder().encode(value); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
})();
