import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog } from "../../services/ui/dialog.js";
import { auth } from "../../services/firebase/firebase.js";

const A = window.AgriSim;
const app = document.getElementById("app");
const fmt = (value) => Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const regionName = (region) => String(region || "").includes("CHAU_A") ? "Châu Á" : "Châu Âu";

app.className = "shell farm-shell";
app.innerHTML = `<main class="main"><section class="content"><div class="skel" style="height:26rem;border-radius:1.5rem"></div></section></main>`;

function sidebar() {
  const links = [
    ["Trang chủ", "home", "../dashboard/dashboard.html"],
    ["Nông trại", "sprout", "farm.html"],
    ["Kho hàng", "box", "../inventory/inventory.html"],
    ["Trao đổi", "swap", "../pool/pool.html"],
    ["Thị trường & Vận chuyển", "truck", "../market/market.html"],
    ["Hồ sơ & Ngân hàng", "bank", "../profile/profile.html"]
  ];
  return `<aside class="sidebar"><a class="brand" href="../dashboard/dashboard.html"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a><nav class="nav">${links.map(([label, icon, href]) => `<a ${label === "Nông trại" ? 'aria-current="page"' : ""} href="${href}">${A.icon(icon)}<span>${label}</span></a>`).join("")}</nav><div class="promo"><div class="art">${A.icon("sprout")}</div><b>Hết diện tích để trồng?</b><p>Bạn có thể mở rộng nông trại tại đây.</p><button class="btn btn-accent btn-sm" type="button" data-buy-plot>Mua thêm nông trại</button></div></aside>`;
}

function mobileNav() {
  return `<nav class="tabbar" aria-label="Điều hướng chính"><a href="../dashboard/dashboard.html">${A.icon("home")}<span>Trang chủ</span></a><a aria-current="page" href="farm.html">${A.icon("sprout")}<span>Nông trại</span></a><a href="../inventory/inventory.html">${A.icon("box")}<span>Kho</span></a><a href="../pool/pool.html">${A.icon("swap")}<span>Trao đổi</span></a><a href="../market/market.html">${A.icon("truck")}<span>Thị trường</span></a></nav>`;
}

function toast(message, error = false) {
  let host = document.querySelector(".toast-host");
  if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.append(host); }
  const item = document.createElement("div");
  item.className = `toast${error ? " err" : ""}`;
  item.innerHTML = `${A.icon(error ? "err" : "check")}<span>${message}</span>`;
  host.append(item);
  window.setTimeout(() => item.remove(), 3600);
}

function plotCard(plot, round, region) {
  const empty = plot.status === "EMPTY";
  const ready = plot.status === "READY";
  const number = String(plot.id || "plot-1").replace("plot-", "");
  const title = empty ? "Đất trống sẵn sàng gieo" : ready ? `Đã trồng ở vòng ${plot.plantedRound}` : `Sẵn sàng ở vòng ${plot.readyRound}`;
  const badge = ready
    ? `<span class="farm-state ready">${A.icon("check")} Sẵn sàng thu hoạch</span>`
    : empty ? `<span class="farm-state empty">○ Trống</span>`
      : `<span class="farm-state growing">${A.icon("clock")} Đang sinh trưởng</span>`;
  const detail = empty
    ? `Chi phí 100 USDG · thu 20 lúa · chờ 1 vòng`
    : ready ? `20 lúa · chất lượng 100% · nhận tại ${regionName(region)}`
      : `Còn ${Math.max(0, Number(plot.readyRound) - Number(round))} vòng · thu 20 lúa`;
  const note = empty ? "Thu hoạch dự kiến vào vòng tiếp theo." : ready ? "Chất lượng chỉ bắt đầu giảm sau khi lúa vào kho." : "Bạn có thể chuyển vòng để cây tiếp tục phát triển.";
  const action = empty
    ? `<button class="btn btn-primary btn-block" type="button" data-plant-plot="${plot.id}">${A.icon("sprout")} Trồng lúa</button>`
    : ready
      ? `<button class="btn btn-primary btn-block" type="button" data-harvest-plot="${plot.id}">${A.icon("sprout")} Thu hoạch</button>`
      : `<button class="btn btn-soft btn-block" type="button" disabled>${A.icon("clock")} Chờ đến vòng sau</button>`;
  return `<article class="farm-plot ${empty ? "is-empty" : ready ? "is-ready" : "is-grow"}"><div class="farm-plot-top"><span class="farm-plot-icon">${A.icon(empty ? "sprout" : ready ? "sprout" : "clock")}</span>${badge}</div><div class="farm-plot-heading"><h2>Ô ruộng ${number}</h2><p>${title}</p></div><div class="farm-plot-detail"><b>${detail}</b><small>${note}</small></div>${action}</article>`;
}

function bindActions() {
  app.querySelectorAll("[data-plant-plot]").forEach((button) => button.addEventListener("click", async () => {
    const id = button.dataset.plantPlot;
    button.disabled = true; button.innerHTML = '<span class="spin"></span> Đang gieo…';
    try {
      await apiRequest(`/plots/${encodeURIComponent(id)}/plant`, { method: "POST", body: JSON.stringify({ requestId: crypto.randomUUID() }) });
      toast("Đã gieo lúa. Nông trại đang được cập nhật.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 500);
    } catch (error) {
      button.disabled = false; button.innerHTML = `${A.icon("sprout")} Trồng lúa`;
      toast(error.message || "Chưa thể gieo lúa. Hãy thử lại.", true);
    }
  }));

  app.querySelectorAll("[data-harvest-plot]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "Xác nhận thu hoạch", message: "Bạn sẽ nhận 20 lúa chất lượng 100% vào Kho.", confirmLabel: "Thu hoạch" })) return;
    const id = button.dataset.harvestPlot;
    button.disabled = true; button.innerHTML = '<span class="spin"></span> Đang thu hoạch…';
    try {
      await apiRequest(`/plots/${encodeURIComponent(id)}/harvest`, { method: "POST", body: JSON.stringify({ requestId: crypto.randomUUID() }) });
      toast("Thu hoạch thành công. Lúa đã được đưa vào Kho.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 500);
    } catch (error) {
      button.disabled = false; button.innerHTML = `${A.icon("sprout")} Thu hoạch`;
      toast(error.message || "Chưa thể thu hoạch. Hãy thử lại.", true);
    }
  }));

  app.querySelectorAll("[data-buy-plot]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "Mua thêm ô ruộng", message: "Chi phí là 300 USDG. Ô mới sẽ ở trạng thái trống.", confirmLabel: "Mua ô ruộng" })) return;
    button.disabled = true; button.innerHTML = '<span class="spin"></span> Đang mua…';
    try {
      await apiRequest("/plots/buy", { method: "POST", body: JSON.stringify({ requestId: crypto.randomUUID() }) });
      toast("Đã mua thêm ô ruộng.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 500);
    } catch (error) {
      button.disabled = false; button.textContent = "Mua thêm nông trại";
      toast(error.message || "Chưa thể mua thêm ô ruộng.", true);
    }
  }));
}

function bindAdvanceRound(round) {
  const button = app.querySelector("[data-advance-round]");
  button?.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "Chuyển sang vòng tiếp theo", message: "Cây trồng và giá thị trường sẽ được cập nhật theo vòng mới.", confirmLabel: "Chuyển vòng" })) return;
    button.disabled = true; button.innerHTML = '<span class="spin"></span> Đang xử lý';
    try {
      await apiRequest("/game/advance", { method: "POST", body: JSON.stringify({ expectedRound: round, requestId: crypto.randomUUID() }) });
      toast("Đã chuyển vòng. Nông trại đang được cập nhật.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 500);
    } catch (error) {
      button.disabled = false; button.textContent = "Chuyển vòng →";
      toast(error.message || "Chưa thể chuyển vòng. Hãy thử lại.", true);
    }
  });
}

try {
  const [plotsResponse, dashboardResponse] = await Promise.all([apiRequest("/plots"), apiRequest("/game/dashboard")]);
  const { currentRound, status, plots = [] } = plotsResponse.data || {};
  const game = dashboardResponse.data?.game;
  if (!game) window.location.replace("../game/startgame.html");
  if (status === "FINISHED" || game?.status === "FINISHED") window.location.replace("../game/endgame.html");

  const playerName = auth.currentUser?.displayName?.trim() || auth.currentUser?.email?.split("@")[0] || "Nông dân";
  const emptyCount = plots.filter((plot) => plot.status === "EMPTY").length;
  const readyPlot = plots.find((plot) => plot.status === "READY");
  const farmStatus = readyPlot ? "Sẵn sàng thu hoạch" : emptyCount ? "Sẵn sàng gieo lúa" : "Đang sinh trưởng";
  const statusText = readyPlot ? `Có thể thu hoạch Ô ruộng ${String(readyPlot.id).replace("plot-", "")}.` : emptyCount ? `Bạn còn ${emptyCount} ô đất trống để gieo lúa.` : "Tất cả ô ruộng đang được chăm sóc.";

  app.className = "shell has-panel farm-shell";
  app.innerHTML = `${sidebar()}<main class="main farm-main"><header class="topbar farm-topbar"><div class="ttl"><h1>Nông trại</h1><p>Trồng lúa, thu hoạch và mở rộng diện tích.</p></div><span class="farm-round"><i></i><i></i><i></i><i></i><span>Vòng ${currentRound}/6</span></span><span class="badge b-success">Số dư ${fmt(game.walletUsdG)} USDG</span><button class="btn btn-accent farm-advance" type="button" data-advance-round>Chuyển vòng →</button><button class="iconbtn farm-bell" type="button" aria-label="Thông báo thị trường">${A.icon("bell")}</button><div class="userbox"><button class="avatar" id="farm-profile-menu" type="button" aria-expanded="false">${playerName.slice(0, 2).toUpperCase()}</button><div class="menu" id="farm-profile-dropdown" hidden><div class="who">${playerName}</div><button type="button" data-logout>${A.icon("logout")} Đăng xuất</button></div></div></header><section class="content farm-content"><section class="farm-metrics"><article><span class="metric-icon plots">${A.icon("qr")}</span><div><small>Số ô ruộng</small><b>${plots.length}/4 <em>ô</em></b></div></article><article><span class="metric-icon cost">${A.icon("wallet")}</span><div><small>Chi phí trồng</small><b>100 <em>USDG</em></b></div></article><article><span class="metric-icon yield">${A.icon("leaf")}</span><div><small>Sản lượng dự kiến</small><b>20 <em>lúa / ô</em></b></div></article><article><span class="metric-icon wait">${A.icon("clock")}</span><div><small>Thời gian chờ</small><b>1 <em>vòng</em></b></div></article></section><section class="farm-status"><span class="farm-status-icon">${A.icon("sprout")}</span><div><b>Trạng thái nông trại <span class="farm-state ready">${A.icon("check")} ${farmStatus}</span></b><p>${statusText}</p></div><span class="farm-region">Khu vực: ${regionName(game.startRegion)}</span></section><section class="farm-plots">${plots.map((plot) => plotCard(plot, currentRound, game.startRegion)).join("")}</section><div class="farm-landscape" aria-hidden="true"></div></section></main><aside class="panel farm-panel"><div class="farm-panel-art"></div><div class="farm-panel-title"><h2>Thông báo thị trường</h2><i></i></div><section class="farm-market-alert"><b>⚠ Vòng ${currentRound} · Đại dịch toàn cầu</b><p>Giá lúa, vàng và phí vận chuyển đang thay đổi.</p></section><small class="farm-panel-label">Lịch trình nông trại</small><section class="farm-schedule"><article><span>${A.icon("check")}</span><div><b>${readyPlot ? `Thu hoạch Ô ruộng ${String(readyPlot.id).replace("plot-", "")}` : "Theo dõi mùa vụ"}</b><small>${readyPlot ? "Sẵn sàng" : "Đang chăm sóc"} · Vòng ${currentRound}</small></div></article><article><span>${A.icon("sprout")}</span><div><b>${emptyCount ? `${emptyCount} ô ruộng đang trống` : "Các ô đã được gieo"}</b><small>${emptyCount ? "Sẵn sàng trồng" : "Chờ vòng tiếp theo"} · Vòng ${currentRound + 1}</small></div></article></section><a class="farm-all-notices" href="../market/notices.html">Xem thông báo thị trường →</a></aside>${mobileNav()}`;
  // Reuse the exact dashboard notification structure so both pages communicate
  // market state with the same hierarchy, colours and spacing.
  const marketPanel = app.querySelector(".farm-panel");
  marketPanel?.classList.add("dashboard-panel");
  if (marketPanel) marketPanel.innerHTML = `<div class="dashboard-panel-art"></div><h3>Thông báo thị trường</h3><div class="market-alert"><b>Vòng ${currentRound} · Đại dịch toàn cầu</b><p>Giá lúa, vàng và phí vận chuyển thay đổi theo từng vòng.</p></div><div class="panel-section-label">Lịch trình nông trại</div><div class="schedule-item"><span>${A.icon(readyPlot ? "check" : "sprout")}</span><div><b>${readyPlot ? `Thu hoạch Ô ruộng ${String(readyPlot.id).replace("plot-", "")}` : "Theo dõi mùa vụ"}</b><small>${readyPlot ? "Sẵn sàng thu hoạch" : "Đang chăm sóc"} · Vòng ${currentRound}</small></div></div><div class="schedule-item"><span>${A.icon("sprout")}</span><div><b>${emptyCount ? `${emptyCount} ô ruộng đang trống` : "Các ô đã được gieo"}</b><small>${emptyCount ? "Sẵn sàng trồng" : "Chờ vòng tiếp theo"} · Vòng ${currentRound + 1}</small></div></div><a class="panel-all-notices" href="../market/notices.html">Xem tất cả thông báo →</a>`;

  const menu = app.querySelector("#farm-profile-menu");
  const dropdown = app.querySelector("#farm-profile-dropdown");
  menu?.addEventListener("click", () => { const open = dropdown.hidden; dropdown.hidden = !open; menu.setAttribute("aria-expanded", String(open)); });
  document.addEventListener("click", (event) => { if (!event.target.closest(".userbox") && dropdown && !dropdown.hidden) { dropdown.hidden = true; menu?.setAttribute("aria-expanded", "false"); } });
  bindActions();
  bindAdvanceRound(currentRound);
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Nông trại</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><button class="btn btn-primary" id="retry">Thử lại</button></div>`;
  document.getElementById("retry").onclick = () => window.__agrisimRefresh?.() ?? window.location.reload();
}
