import { A, fmt, gameData, shell } from "../../services/ui/gameScreen.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog, numberDialog } from "../../services/ui/dialog.js";

const app = document.getElementById("app");
app.className = "shell inventory-shell";
app.innerHTML = '<main class="main"><section class="content"><div class="skel" style="height:420px;border-radius:24px"></div></section></main>';
function toast(message, isError = false) { let host = document.querySelector(".toast-host"); if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.append(host); } const node = document.createElement("div"); node.className = `toast${isError ? " err" : ""}`; node.innerHTML = `${A.icon(isError ? "err" : "check")}<span>${message}</span>`; host.append(node); setTimeout(() => node.remove(), 3600); }

try {
  const { lots = [], game } = await gameData();
  let type = "ALL", region = "ALL";
  const assetName = (asset) => asset === "GOLD" ? "Vàng" : "Lúa";
  const regionName = (value) => value === "CHAU_AU" ? "Châu Âu" : "Châu Á";
  function render() {
    const visible = lots.filter((lot) => (type === "ALL" || lot.asset === type) && (region === "ALL" || lot.region === region));
    const rows = visible.map((lot) => { const usable = lot.status === "AVAILABLE" && Number(lot.qualityPercent) > 0; return `<tr><td><b>${lot.id.slice(0, 8)}</b></td><td>${assetName(lot.asset)}</td><td class="r">${fmt(lot.quantity)}</td><td>${lot.qualityPercent}%</td><td>${regionName(lot.region)}</td><td>${usable ? '<span class="badge b-success">Khả dụng</span>' : '<span class="badge b-warning">Hỏng</span>'}</td><td class="r">${usable ? `<a class="btn btn-primary btn-sm" href="../market/market.html">Bán</a> <button class="btn btn-outline btn-sm" data-ship-lot="${lot.id}" data-ship-quantity="${lot.quantity}" data-ship-origin="${lot.region}">Gửi</button>` : "–"}</td></tr>`; }).join("");
    const list = visible.length ? `<div class="card"><div class="card-head"><div><h2>Danh sách lô hàng (${visible.length})</h2><span class="hint">Lô hỏng vẫn được hiển thị nhưng không thể bán hoặc gửi.</span></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Mã lô</th><th>Loại</th><th class="r">Số lượng</th><th>Chất lượng</th><th>Khu vực</th><th>Trạng thái</th><th class="r">Thao tác</th></tr></thead><tbody>${rows}</tbody></table></div></div>` : `<div class="card"><div class="empty"><div class="ic">${A.icon("box")}</div><h3>Không có lô hàng phù hợp</h3><p>Thu hoạch tại Nông trại hoặc mua hàng qua Pool để có hàng trong kho.</p><div class="acts"><a class="btn btn-primary" href="../farm/farm.html">Đến Nông trại</a><button class="btn btn-outline" id="clear-filter">Xóa bộ lọc</button></div></div></div>`;
    app.className = "shell inventory-shell";
    app.innerHTML = shell("inventory", "Kho hàng", "Các lô hàng bạn đang sở hữu; hàng đang vận chuyển được theo dõi riêng tại Thị trường.", `<div class="card"><div class="filters"><div class="seg" aria-label="Lọc loại hàng">${[["ALL", "Tất cả"], ["RICE", "Lúa"], ["GOLD", "Vàng"]].map(([value, label]) => `<button data-type="${value}" class="${type === value ? "on" : ""}">${label}</button>`).join("")}</div><select id="region-filter" class="select-pill" aria-label="Lọc khu vực"><option value="ALL">Tất cả khu vực</option><option value="CHAU_A">Châu Á</option><option value="CHAU_AU">Châu Âu</option></select></div></div>${list}`);
    const rice = lots.filter((lot) => lot.asset === "RICE" && lot.status === "AVAILABLE").reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
    const gold = lots.filter((lot) => lot.asset === "GOLD" && lot.status === "AVAILABLE").reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
    app.querySelector(".topbar")?.insertAdjacentHTML("beforeend", `<span class="page-round">Vòng ${game.currentRound}/6</span><span class="badge b-success">${fmt(game.walletUsdG)} USDG</span><span class="avatar inventory-avatar">ND</span>`);
    app.querySelector(".content")?.insertAdjacentHTML("afterbegin", `<section class="inventory-overview"><article><span class="inventory-kpi-icon rice">${A.icon("leaf")}</span><div><small>Lúa khả dụng</small><b>${fmt(rice)} <em>đơn vị</em></b></div></article><article><span class="inventory-kpi-icon gold">${A.icon("coin")}</span><div><small>Vàng khả dụng</small><b>${fmt(gold)} <em>đơn vị</em></b></div></article><article><span class="inventory-kpi-icon lots">${A.icon("box")}</span><div><small>Lô hàng trong kho</small><b>${lots.length} <em>lô</em></b></div></article></section>`);
    document.getElementById("region-filter").value = region;
    app.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => { type = button.dataset.type; render(); }));
    document.getElementById("region-filter").onchange = (event) => { region = event.target.value; render(); };
    document.getElementById("clear-filter")?.addEventListener("click", () => { type = "ALL"; region = "ALL"; render(); });
    app.querySelectorAll("[data-ship-lot]").forEach((button) => button.addEventListener("click", async () => {
      const max = Number(button.dataset.shipQuantity);
      const quantity = await numberDialog({ title: "Gửi hàng", message: "Hàng đến khu vực còn lại sau một lần chuyển vòng.", label: "Số lượng gửi", initial: max, min: 0.00000001, max, confirmLabel: "Tiếp tục" });
      if (quantity === null) return;
      const destination = button.dataset.shipOrigin === "CHAU_A" ? "CHAU_AU" : "CHAU_A";
      if (!await confirmDialog({ title: "Xác nhận gửi hàng", message: `Gửi ${fmt(quantity)} đơn vị sang ${regionName(destination)}? Phí và chất lượng được tính khi xác nhận.`, confirmLabel: "Gửi hàng" })) return;
      button.disabled = true; button.innerHTML = '<span class="spin"></span>';
      try { await apiRequest(`/market/lots/${encodeURIComponent(button.dataset.shipLot)}/ship`, { method: "POST", body: JSON.stringify({ quantity, destination, requestId: crypto.randomUUID() }) }); toast("Đã gửi hàng. Theo dõi chuyến tại Thị trường."); setTimeout(() => window.__agrisimRefresh?.() ?? location.reload(), 500); }
      catch (error) { button.disabled = false; button.textContent = "Gửi"; toast(error.message || "Chưa thể gửi hàng.", true); }
    }));
  }
  render();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Kho hàng</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><a class="btn btn-primary" href="../dashboard/dashboard.html">Về Trang chủ</a></div>`;
}
