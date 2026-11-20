import { apiRequest } from "../../services/api/apiClient.js";
import { alertDialog, confirmDialog } from "../../services/ui/dialog.js";

const A = window.AgriSim;
const app = document.getElementById("app");
const fmt = (value) => Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const region = (value) => value === "CHAU_AU" ? "Châu Âu" : "Châu Á";
document.body.setAttribute("data-bg", "sunny-barn");

try {
  const gameResponse = await apiRequest("/game");
  const game = gameResponse.data;
  if (!game) window.location.replace("startgame.html");
  if (game.status === "ACTIVE") window.location.replace("../dashboard/dashboard.html");
  const summaryResponse = await apiRequest("/game/summary");
  const summary = summaryResponse.data;
  const lots = summary.remainingLots || [];
  const lotRows = lots.length ? lots.map((lot) => `<div class="row"><span>${lot.asset === "GOLD" ? "Vàng" : "Lúa"} · ${region(lot.region)} · ${lot.qualityPercent}%</span><b>${fmt(lot.quantity)} đơn vị</b></div>`).join("") : '<p class="hint">Không còn lô hàng khả dụng trong kho.</p>';
  app.className = "auth";
  app.innerHTML = `<div class="auth-card" style="max-width:860px"><div class="end-hero"><div><div style="opacity:.85">Lượt chơi đã kết thúc</div><div class="big">${fmt(summary.endNetWorth)} USDG</div><div style="opacity:.8;font-size:12px">Tài sản ròng cuối lượt · không phải điểm số</div></div><img src="../../assets/images/coins.png" alt="Xu AgriSim"></div><div class="end-stats" style="margin-top:16px"><div class="stat"><div class="lbl"><span>USDG còn lại</span><span class="chip">${A.icon("wallet")}</span></div><div class="val">${fmt(summary.walletUsdG)}<small> USDG</small></div></div><div class="stat"><div class="lbl"><span>Thay đổi ròng</span><span class="chip">${A.icon("calc")}</span></div><div class="val">${summary.netChange >= 0 ? "+" : ""}${fmt(summary.netChange)}<small> USDG</small></div></div><div class="stat"><div class="lbl"><span>Giao dịch</span><span class="chip">${A.icon("check")}</span></div><div class="val">${summary.transactionCount}<small> lần</small></div></div></div><div class="card" style="margin-top:16px"><div class="card-head"><h3>${A.icon("calc")} Tổng kết tài sản</h3><span class="badge b-muted">Vòng 6/6</span></div><div class="rows"><div class="row"><span>Ví USDG</span><b>${fmt(summary.walletUsdG)} USDG</b></div><div class="row"><span>Giá trị hàng còn trong kho</span><b>${fmt(summary.warehouseValue)} USDG</b></div><div class="row"><span>Tổng tiền nạp mô phỏng</span><b>${fmt(summary.totalTopups)} USDG</b></div><div class="row"><span>Phí swap đã quy đổi</span><b>${fmt(summary.totalSwapFeesUsdEquivalent)} USDG</b></div><div class="row"><span>Phí vận chuyển</span><b>${fmt(summary.totalShippingFeesUsd)} USDG</b></div></div><h4 style="margin:18px 0 8px">Hàng khả dụng còn lại</h4><div class="rows">${lotRows}</div><p class="help" style="margin-top:16px">Tài sản ròng chỉ gồm ví và các lô hàng khả dụng trong kho theo giá vòng 6; không tính pool, ruộng hoặc lúa chưa thu hoạch.</p><div class="acts" style="justify-content:flex-end"><button class="btn btn-outline" type="button" data-logout>Đăng xuất</button><button class="btn btn-primary" id="replay">Chơi lại</button></div><div class="note note-warn" id="replay-note" hidden></div></div></div>`;
  document.getElementById("replay").addEventListener("click", () => {
    const note = document.getElementById("replay-note");
    note.hidden = false;
    note.innerHTML = `${A.icon("alert")}<span>Tiến độ và lịch sử lượt cũ sẽ bị thay thế, không thể khôi phục.</span><div class="acts" style="margin-left:auto"><button class="btn btn-outline btn-sm" data-region="CHAU_A">Châu Á</button><button class="btn btn-outline btn-sm" data-region="CHAU_AU">Châu Âu</button></div>`;
    note.querySelectorAll("[data-region]").forEach((button) => button.addEventListener("click", async () => {
      const startRegion = button.dataset.region;
      if (!await confirmDialog({ title: "Xác nhận chơi lại", message: `Thay thế lượt chơi cũ và bắt đầu tại ${region(startRegion)}? Dữ liệu cũ không thể khôi phục.`, confirmLabel: "Bắt đầu lại", tone: "danger" })) return;
      button.disabled = true; button.innerHTML = '<span class="spin"></span>';
      try { await apiRequest("/game/restart", { method: "POST", body: JSON.stringify({ region: startRegion, confirmReplace: true, requestId: crypto.randomUUID() }) }); window.location.replace("../dashboard/dashboard.html"); }
      catch (error) { button.disabled = false; button.textContent = region(startRegion); await alertDialog({ title: "Chưa thể chơi lại", message: error.message || "Vui lòng thử lại." }); }
    }));
  });
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được tổng kết</h1><div class="banner banner-error">${A.icon("err")}<span>${error.message || "Không kết nối được dữ liệu lượt chơi."}</span></div><a class="btn btn-primary" href="../auth/login.html">Đến đăng nhập</a></div>`;
}
