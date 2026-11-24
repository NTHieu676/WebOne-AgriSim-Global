const DEFAULT_DURATION = 3600;

export function toast(message, isError = false, duration = DEFAULT_DURATION) {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.append(host);
  }

  const item = document.createElement("div");
  item.className = `toast${isError ? " err" : ""}`;
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = window.AgriSim?.icon(isError ? "err" : "check") || "";
  const text = document.createElement("span");
  text.textContent = message;
  item.append(icon, text);
  host.append(item);
  window.setTimeout(() => item.remove(), duration);
}
