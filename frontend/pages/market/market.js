import { A, fmt, gameData, shell } from "../../services/ui/gameScreen.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog, numberDialog } from "../../services/ui/dialog.js";

const app = document.getElementById("app");
app.className = "shell";
app.innerHTML = '<main class="main"><section class="content"><div class="skel" style="height:420px;border-radius:24px"></div></section></main>';
function toast(message, isError = false) { let host = document.querySelector(".toast-host"); if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.append(host); } const node = document.createElement("div"); node.className = `toast${isError ? " err" : ""}`; node.innerHTML = `${A.icon(isError ? "err" : "check")}<span>${message}</span>`; host.append(node); setTimeout(() => node.remove(), 3600); }

try {
  const { game, lots = [], shipments = [] } = await gameData();
  let prices = {};
  try { prices = (await apiRequest(`/config/rounds/${game.currentRound}`, { requireAuth: false })).data?.prices || {}; } catch { /* Market still displays owned lots during a config restart. */ }
  let tab = new URLSearchParams(location.search).get("tab") === "ship" ? "ship" : "market";
  let selectedRegion = game.startRegion || "CHAU_A";
  const regionName = (value) => value === "CHAU_AU" ? "Châu Âu" : "Châu Á";
  const assetName = (value) => value === "GOLD" ? "Vàng" : "Lúa";
  const priceText = (value) => Number.isFinite(Number(value)) ? fmt(value) : "–";
  const setUrl = () => history.replaceState(null, "", `${location.pathname}${tab === "ship" ? "?tab=ship" : ""}`);
  function shipmentTable() {
    if (!shipments.length) return `<div class="empty"><div class="ic">${A.icon("truck")}</div><h3>Chưa có chuyến hàng nào</h3><p>Gửi lô hàng từ Kho để vận chuyển sang khu vực còn lại.</p><a class="btn btn-outline" href="../inventory/inventory.html">Mở Kho hàng</a></div>`;
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Mã chuyến</th><th>Hàng hóa</th><th>Từ → Đến</th><th>Gửi / đến</th><th>Phí</th><th class="r">Trạng thái</th></tr></thead><tbody>${shipments.map((shipment) => { const transit = shipment.status === "IN_TRANSIT"; const remaining = transit ? Math.max(0, Number(shipment.arrivalRound) - Number(game.currentRound)) : 0; return `<tr><td><b>${shipment.id.slice(0, 8)}</b></td><td>${assetName(shipment.asset)} · ${fmt(shipment.quantity)}${shipment.asset === "RICE" ? ` · ${shipment.qualityPercent}%` : ""}</td><td>${regionName(shipment.origin)} → ${regionName(shipment.destination)}</td><td>V${shipment.sentRound} / V${shipment.arrivalRound}</td><td>${fmt(shipment.shippingFeeUsd)} USDG</td><td class="r">${transit ? `<span class="badge b-info">Còn ${remaining} vòng</span>` : '<a class="badge b-success" href="../inventory/inventory.html">Đã đến kho</a>'}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  function render() {
    const regionLots = lots.filter((lot) => lot.region === selectedRegion && lot.status === "AVAILABLE");
    const ricePrice = prices.RICE?.[selectedRegion], goldPrice = prices.GOLD?.[selectedRegion];
    const canSell = Number.isFinite(Number(ricePrice)) && Number.isFinite(Number(goldPrice));
    const market = `<div class="region-cards">${["CHAU_A", "CHAU_AU"].map((value) => `<button class="region-card ${selectedRegion === value ? "on" : ""}" data-region="${value}"><b>${regionName(value)}</b><div class="goods"><div class="good"><small>Lúa</small><b>${priceText(prices.RICE?.[value])} USDG</b></div><div class="good"><small>Vàng</small><b>${priceText(prices.GOLD?.[value])} USDG</b></div></div><span class="hint">Giá vòng ${game.currentRound} · bấm để xem hàng</span></button>`).join("")}</div><div class="card"><div class="card-head"><div><h3>Các lô có thể bán tại ${regionName(selectedRegion)}</h3><span class="hint">Giá hiện tại: Lúa ${priceText(ricePrice)} · Vàng ${priceText(goldPrice)} USDG</span></div></div>${regionLots.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Mã lô</th><th>Loại</th><th class="r">Số lượng</th><th>Chất lượng</th><th class="r">Thao tác</th></tr></thead><tbody>${regionLots.map((lot) => `<tr><td><b>${lot.id.slice(0, 8)}</b></td><td>${assetName(lot.asset)}</td><td class="r">${fmt(lot.quantity)}</td><td>${lot.qualityPercent}%</td><td class="r"><button class="btn btn-primary btn-sm" data-sell-lot="${lot.id}" data-sell-quantity="${lot.quantity}" ${canSell && lot.qualityPercent > 0 ? "" : "disabled"}>Bán</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><div class="ic">${A.icon("box")}</div><h3>Chưa có hàng khả dụng tại khu vực này</h3><p>Hãy thu hoạch hoặc gửi hàng từ khu vực khác.</p><a class="btn btn-primary" href="../farm/farm.html">Đến Nông trại</a></div>`}</div>`;
    const shipmentsHtml = `<div class="card"><div class="card-head"><div><h3>Chuyến hàng của bạn</h3><span class="hint">Mỗi chuyến đến sau đúng một lần chuyển vòng.</span></div><span class="badge b-muted">${shipments.length} chuyến</span></div>${shipmentTable()}</div>`;
    app.innerHTML = shell("market", "Thị trường & Vận chuyển", "Giá hai khu vực, bán hàng và theo dõi lô đang di chuyển.", `<div class="seg" aria-label="Nội dung thị trường"><button data-tab="market" class="${tab === "market" ? "on" : ""}">Thị trường</button><button data-tab="ship" class="${tab === "ship" ? "on" : ""}">Chuyến hàng (${shipments.length})</button></div>${tab === "ship" ? shipmentsHtml : market}`);
    app.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.tab; setUrl(); render(); }));
    app.querySelectorAll("[data-region]").forEach((button) => button.addEventListener("click", () => { selectedRegion = button.dataset.region; render(); }));
    app.querySelectorAll("[data-sell-lot]").forEach((button) => button.addEventListener("click", async () => {
      const max = Number(button.dataset.sellQuantity);
      const quantity = await numberDialog({ title: "Bán hàng", message: "Doanh thu được tính theo giá và chất lượng hiện tại.", label: "Số lượng muốn bán", initial: max, min: 0.00000001, max, confirmLabel: "Tiếp tục" });
      if (quantity === null) return;
      if (!await confirmDialog({ title: "Xác nhận bán hàng", message: `Bán ${fmt(quantity)} đơn vị hàng?`, confirmLabel: "Bán hàng" })) return;
      button.disabled = true; button.innerHTML = '<span class="spin"></span>';
      try { await apiRequest(`/market/lots/${encodeURIComponent(button.dataset.sellLot)}/sell`, { method: "POST", body: JSON.stringify({ quantity, requestId: crypto.randomUUID() }) }); toast("Bán hàng thành công."); setTimeout(() => window.__agrisimRefresh?.() ?? location.reload(), 500); }
      catch (error) { button.disabled = false; button.textContent = "Bán"; toast(error.message || "Chưa thể bán lô hàng này.", true); }
    }));
  }
  render();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Thị trường</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><a class="btn btn-primary" href="../dashboard/dashboard.html">Về Trang chủ</a></div>`;
}
