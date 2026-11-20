import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog } from "../../services/ui/dialog.js";

const A = window.AgriSim;
const app = document.getElementById("app");
const regionName = (region) => region === "CHAU_A" ? "Châu Á" : "Châu Âu";
app.className = "shell";
app.innerHTML = `<main class="main"><section class="content"><div class="skel" style="height:80px;border-radius:20px"></div><div class="stat-grid"><div class="skel" style="height:80px;border-radius:20px"></div><div class="skel" style="height:80px;border-radius:20px"></div><div class="skel" style="height:80px;border-radius:20px"></div><div class="skel" style="height:80px;border-radius:20px"></div></div><div class="plot-grid"><div class="skel" style="height:250px;border-radius:24px"></div><div class="skel" style="height:250px;border-radius:24px"></div></div></section></main>`;

function sidebar() {
  return `<aside class="sidebar"><a class="brand" href="../dashboard/dashboard.html"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a><nav class="nav"><a href="../dashboard/dashboard.html">${A.icon("home")}<span>Trang chủ</span></a><a aria-current="page" href="farm.html">${A.icon("sprout")}<span>Nông trại</span></a><a href="../inventory/inventory.html">${A.icon("box")}<span>Kho hàng</span></a><a href="../pool/pool.html">${A.icon("swap")}<span>Trao đổi</span></a><a href="../market/market.html">${A.icon("truck")}<span>Thị trường & Vận chuyển</span></a><a href="../profile/profile.html">${A.icon("bank")}<span>Hồ sơ & Ngân hàng</span></a></nav><div class="promo"><div class="art">${A.icon("sprout")}</div><b>Cần thêm diện tích?</b><p>Mở rộng nông trại để trồng thêm.</p><button class="btn btn-accent btn-sm" data-buy-plot>Mua thêm nông trại</button></div></aside>`;
}

function mobileNav() {
  return `<nav class="tabbar" aria-label="Điều hướng chính"><a href="../dashboard/dashboard.html">${A.icon("home")}<span>Trang chủ</span></a><a aria-current="page" href="farm.html">${A.icon("sprout")}<span>Nông trại</span></a><a href="../inventory/inventory.html">${A.icon("box")}<span>Kho</span></a><a href="../pool/pool.html">${A.icon("swap")}<span>Trao đổi</span></a><a href="../market/market.html">${A.icon("truck")}<span>Thị trường</span></a></nav>`;
}

function plotCard(plot, round, region) {
  const state = plot.status;
  const isEmpty = state === "EMPTY";
  const isReady = state === "READY";
  const badge = isReady ? `<span class="badge b-success">${A.icon("check")} Sẵn sàng thu hoạch</span>` : isEmpty ? `<span class="badge b-muted">○ Trống</span>` : `<span class="badge b-info">${A.icon("clock")} Đang sinh trưởng</span>`;
  const title = isReady ? `Đã trồng ở vòng ${plot.plantedRound}` : isEmpty ? "Đất trống sẵn sàng gieo" : `Sẵn sàng ở vòng ${plot.readyRound}`;
  const detail = isReady ? "20 lúa · chất lượng 100%" : isEmpty ? `Chi phí 100 USDG · thu 20 lúa · chờ 1 vòng` : `Còn ${Math.max(0, plot.readyRound - round)} vòng · thu 20 lúa`;
  const button = isEmpty ? `<button class="btn btn-primary btn-block" data-plant-plot="${plot.id}">${A.icon("sprout")} Trồng lúa</button>` : isReady ? `<button class="btn btn-primary btn-block" data-harvest-plot="${plot.id}">${A.icon("sprout")} Thu hoạch</button>` : `<button class="btn btn-soft btn-block" disabled>Chờ đến vòng sau</button>`;
  return `<article class="plot ${isReady ? "is-ready" : isEmpty ? "is-empty" : "is-grow"}"><div class="top"><span class="ico">${A.icon("sprout")}</span>${badge}</div><div><h3>Ô ruộng ${plot.id.replace("plot-", "")}</h3><div class="sub">${title}</div></div><div class="detail">${detail}<small>Nhận tại ${regionName(region)}.</small></div>${button}</article>`;
}

function showToast(message, isError = false) {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.append(host);
  }
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " err" : ""}`;
  toast.innerHTML = `${A.icon(isError ? "err" : "check")}<span>${message}</span>`;
  host.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function bindPlantActions() {
  app.querySelectorAll("[data-plant-plot]").forEach((button) => button.addEventListener("click", async () => {
    const plotId = button.dataset.plantPlot;
    button.disabled = true;
    button.classList.add("is-busy");
    button.innerHTML = '<span class="spin"></span> Đang gieo…';
    try {
      await apiRequest(`/plots/${encodeURIComponent(plotId)}/plant`, {
        method: "POST",
        body: JSON.stringify({ requestId: crypto.randomUUID() })
      });
      showToast("Đã gieo lúa. Dữ liệu nông trại đang được cập nhật.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 550);
    } catch (error) {
      button.disabled = false;
      button.classList.remove("is-busy");
      button.innerHTML = `${A.icon("sprout")} Trồng lúa`;
      showToast(error.message || "Chưa thể gieo lúa. Hãy thử lại.", true);
    }
  }));

  app.querySelectorAll("[data-harvest-plot]").forEach((button) => button.addEventListener("click", async () => {
    const plotId = button.dataset.harvestPlot;
    if (!await confirmDialog({ title: "Xác nhận thu hoạch", message: "Bạn sẽ nhận 20 lúa chất lượng 100% vào Kho.", confirmLabel: "Thu hoạch" })) return;
    button.disabled = true;
    button.classList.add("is-busy");
    button.innerHTML = '<span class="spin"></span> Đang thu hoạch…';
    try {
      await apiRequest(`/plots/${encodeURIComponent(plotId)}/harvest`, {
        method: "POST",
        body: JSON.stringify({ requestId: crypto.randomUUID() })
      });
      showToast("Thu hoạch thành công. Lúa đã được đưa vào Kho.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 550);
    } catch (error) {
      button.disabled = false;
      button.classList.remove("is-busy");
      button.innerHTML = `${A.icon("sprout")} Thu hoạch`;
      showToast(error.message || "Chưa thể thu hoạch. Hãy thử lại.", true);
    }
  }));

  app.querySelectorAll("[data-buy-plot]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "Mua thêm ô ruộng", message: "Chi phí là 300 USDG. Ô mới sẽ ở trạng thái trống.", confirmLabel: "Mua ô ruộng" })) return;
    button.disabled = true;
    button.classList.add("is-busy");
    button.innerHTML = '<span class="spin"></span> Đang mua…';
    try {
      await apiRequest("/plots/buy", { method: "POST", body: JSON.stringify({ requestId: crypto.randomUUID() }) });
      showToast("Đã mua thêm ô ruộng.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 550);
    } catch (error) {
      button.disabled = false;
      button.classList.remove("is-busy");
      button.textContent = "Mua thêm nông trại";
      showToast(error.message || "Chưa thể mua thêm ô ruộng.", true);
    }
  }));
}

function setupMarketPanel() {
  const panel = app.querySelector(".panel");
  if (!panel) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "panel-toggle";
  button.innerHTML = `${A.icon("bell")}<span class="toggle-label">Thông báo thị trường</span>`;
  panel.prepend(button);
  const setOpen = (open) => {
    panel.classList.toggle("is-collapsed", !open);
    app.classList.toggle("panel-collapsed", !open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Thu gọn thông báo thị trường" : "Mở thông báo thị trường");
    sessionStorage.setItem("agrisim-market-panel", open ? "open" : "closed");
  };
  setOpen(sessionStorage.getItem("agrisim-market-panel") === "open");
  button.addEventListener("click", () => setOpen(panel.classList.contains("is-collapsed")));
}

try {
  const [plotsResponse, dashboardResponse] = await Promise.all([apiRequest("/plots"), apiRequest("/game/dashboard")]);
  const { currentRound, status, plots } = plotsResponse.data;
  const game = dashboardResponse.data?.game;
  if (!game) window.location.replace("../game/startgame.html");
  if (status === "FINISHED") window.location.replace("../game/endgame.html");
  const empty = plots.filter((plot) => plot.status === "EMPTY").length;
  app.className = "shell has-panel";
  app.innerHTML = `${sidebar()}<main class="main"><header class="topbar"><div class="ttl"><h1>Nông trại</h1><p>Trồng lúa, thu hoạch và mở rộng diện tích.</p></div><span class="badge b-muted">Vòng ${currentRound}/6</span><span class="badge b-success">${Number(game.walletUsdG).toLocaleString("vi-VN")} USDG</span></header><section class="content"><div class="stat-grid"><div class="stat"><div class="lbl"><span>Số ô ruộng</span></div><div class="val">${plots.length}/4 <small>ô</small></div></div><div class="stat"><div class="lbl"><span>Chi phí trồng</span></div><div class="val">100 <small>USDG</small></div></div><div class="stat"><div class="lbl"><span>Sản lượng dự kiến</span></div><div class="val">20 <small>lúa / ô</small></div></div><div class="stat"><div class="lbl"><span>Thời gian chờ</span></div><div class="val">1 <small>vòng</small></div></div></div><div class="callout ${empty ? "ok" : ""}"><span class="ico">${A.icon(empty ? "check" : "alert")}</span><div class="t"><b>${empty ? "Nông trại sẵn sàng" : "Hết diện tích để trồng"}</b><span class="hint">${empty ? `Bạn còn ${empty} ô trống để gieo lúa.` : "Mua thêm nông trại hoặc chờ đến vòng sau."}</span></div><span class="badge b-${game.startRegion === "CHAU_A" ? "asia" : "europe"}">Khu vực: ${regionName(game.startRegion)}</span></div><div class="plot-grid">${plots.map((plot) => plotCard(plot, currentRound, game.startRegion)).join("")}</div></section></main><aside class="panel"><div class="scene" style="background-image:url('../../assets/images/bg-navy-panel.jpg')"></div><h4>Thông báo thị trường</h4><div class="pn-notice"><span class="badge b-warning">Vòng ${currentRound} · Đại dịch toàn cầu</span><p>Giá và chi phí thay đổi theo kịch bản từng vòng.</p></div><a class="link" href="../market/notices.html">Xem tất cả thông báo →</a></aside>${mobileNav()}`;
  if (plots.length < 4) {
    const mobileBuy = document.createElement("button");
    mobileBuy.className = "btn btn-outline btn-sm";
    mobileBuy.dataset.buyPlot = "";
    mobileBuy.textContent = "Mua thêm ô · 300 USDG";
    app.querySelector(".callout .t")?.append(mobileBuy);
  }
  bindPlantActions();
  setupMarketPanel();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Nông trại</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><a class="btn btn-primary" href="../dashboard/dashboard.html">Về Trang chủ</a></div>`;
}
