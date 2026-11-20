/* Lightweight in-app navigation for the static frontend.
 * Keeps the document shell alive and swaps only #app, avoiding a full-page flash.
 */
(function () {
  if (window.__agrisimNavigate) return;
  let navigating = false;
  const overlay = document.createElement("div");
  overlay.className = "route-loader";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = "<span></span>";

  function persistentRoute(url) {
    return /\/frontend\/pages\/(dashboard|farm|inventory|pool|market|profile)\//.test(url.pathname);
  }
  function syncSidebar(incoming) {
    const app = document.getElementById("app");
    const frame = document.getElementById("agrisim-sidebar-frame");
    const source = incoming || app?.querySelector(".sidebar");
    if (!source) return;
    let persistent = frame?.querySelector(".sidebar");
    if (!persistent) {
      const newFrame = document.createElement("aside");
      newFrame.id = "agrisim-sidebar-frame";
      newFrame.setAttribute("aria-label", "Điều hướng chính");
      source.remove();
      document.body.prepend(newFrame);
      newFrame.append(source);
      persistent = source;
      document.body.classList.add("has-persistent-sidebar");
    } else if (source !== persistent) {
      const targetActive = source.querySelector('.nav a[aria-current="page"]')?.getAttribute("href");
      persistent.querySelectorAll(".nav a").forEach((link) => {
        link.toggleAttribute("aria-current", Boolean(targetActive && new URL(link.href, location.href).pathname === new URL(targetActive, location.href).pathname));
        if (link.getAttribute("aria-current") === "") link.setAttribute("aria-current", "page");
      });
      source.remove();
    }
    if (!persistent.querySelector("[data-logout]")) {
      const logout = document.createElement("button");
      logout.type = "button";
      logout.className = "sidebar-logout";
      logout.dataset.logout = "";
      logout.textContent = "Đăng xuất";
      persistent.append(logout);
    }
    app?.querySelector("#logout.avatar")?.remove();
    persistent.querySelectorAll("a[href]").forEach((link) => { link.href = link.href; });
    app?.classList.add("sidebar-persisted");
  }
  function syncNoticeTrigger() {
    const app = document.getElementById("app");
    if (!app?.querySelector(".panel")) return;
    const topbar = app.querySelector(".topbar");
    if (!topbar || topbar.querySelector("[data-market-notices]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline btn-sm notice-trigger";
    button.dataset.marketNotices = "";
    button.innerHTML = `${window.AgriSim?.icon("bell") || ""}<span>Thông báo</span>`;
    const action = topbar.querySelector("#advance-round, .btn.btn-accent");
    if (action) topbar.insertBefore(button, action); else topbar.append(button);
  }

  function sameAppLink(anchor) {
    if (!anchor || anchor.target || anchor.hasAttribute("download") || anchor.dataset.noSpa !== undefined) return false;
    const url = new URL(anchor.href, location.href);
    return url.origin === location.origin && persistentRoute(url) && !url.hash;
  }
  async function navigate(url, replace = false, force = false) {
    if (navigating || (url.href === location.href && !force)) return;
    navigating = true;
    syncSidebar();
    document.body.classList.add("is-navigating");
    document.body.append(overlay);
    try {
      const response = await fetch(url.href, { headers: { "X-Requested-With": "AgriSim-Navigation" } });
      if (!response.ok) throw new Error(`Could not load page (${response.status})`);
      const next = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextApp = next.getElementById("app");
      const module = next.querySelector('script[type="module"][src]');
      if (!nextApp || !module) throw new Error("Invalid destination page");
      document.title = next.title || document.title;
      for (const attribute of [...document.body.attributes]) if (attribute.name.startsWith("data-")) document.body.removeAttribute(attribute.name);
      for (const attribute of [...next.body.attributes]) if (attribute.name.startsWith("data-")) document.body.setAttribute(attribute.name, attribute.value);
      const nextSidebar = nextApp.querySelector(".sidebar");
      const currentApp = document.getElementById("app");
      currentApp.replaceWith(nextApp);
      if (nextSidebar) syncSidebar(nextSidebar);
      if (replace) history.replaceState({ agrisim: true }, "", url.href); else history.pushState({ agrisim: true }, "", url.href);
      const moduleUrl = new URL(module.getAttribute("src"), url.href);
      await import(`${moduleUrl.href}${moduleUrl.search ? "&" : "?"}navigation=${Date.now()}`);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.location.assign(url.href);
      return;
    } finally {
      navigating = false;
      document.body.classList.remove("is-navigating");
      overlay.remove();
    }
  }
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest("a[href]");
    if (!sameAppLink(anchor)) return;
    event.preventDefault();
    navigate(new URL(anchor.href, location.href));
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-logout]");
    if (!button) return;
    event.preventDefault();
    if (!await import("../../services/ui/dialog.js").then(({ logoutDialog }) => logoutDialog())) return;
    button.disabled = true;
    const { logout } = await import("../../services/firebase/auth.js");
    await logout();
    window.location.replace(new URL("../../pages/auth/login.html", location.href));
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-market-notices]");
    if (!button) return;
    const round = document.querySelector(".topbar .badge")?.textContent?.match(/\d+/)?.[0] || "";
    const { openNoticeDrawer } = await import("../../services/ui/dialog.js");
    await openNoticeDrawer({ round });
  });
  window.addEventListener("popstate", () => navigate(new URL(location.href), true, true));
  new MutationObserver(() => { if (persistentRoute(new URL(location.href))) { syncSidebar(); syncNoticeTrigger(); } }).observe(document.body, { childList: true, subtree: true });
  window.__agrisimNavigate = navigate;
  window.__agrisimRefresh = () => { navigate(new URL(location.href), true, true); return true; };
})();
