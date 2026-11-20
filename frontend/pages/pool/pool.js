import { A, fmt, gameData, shell } from "../../services/ui/gameScreen.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog } from "../../services/ui/dialog.js";

const app = document.getElementById("app");
app.className = "shell pool-shell";
app.innerHTML = '<main class="main"><section class="content"><div class="skel" style="height:420px;border-radius:24px"></div></section></main>';

function toast(message, isError = false) {
  let host = document.querySelector(".toast-host");
  if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.append(host); }
  const node = document.createElement("div");
  node.className = `toast${isError ? " err" : ""}`;
  node.innerHTML = `${A.icon(isError ? "err" : "check")}<span>${message}</span>`;
  host.append(node);
  window.setTimeout(() => node.remove(), 3600);
}

try {
  const { game, pools = [], lots = [] } = await gameData();
  let asset = pools[0]?.asset || "RICE";
  // A new game starts with USDG but no eligible warehouse lot, so BUY is the
  // actionable default. SELL remains available once the player owns a valid lot.
  let direction = "BUY";
  let amount = "";
  let selectedLotId = "";
  let targetRegion = game.startRegion || "CHAU_A";
  let quote = null, quoteError = "", quoteLoading = false, quoteSequence = 0, quoteTimer = null;
  const assetName = (value) => value === "GOLD" ? "Vàng" : "Lúa";
  const regionName = (value) => value === "CHAU_AU" ? "Châu Âu" : "Châu Á";
  const eligibleLots = () => lots.filter((lot) => lot.asset === asset && lot.status === "AVAILABLE" && Number(lot.quantity) > 0 && (asset !== "RICE" || Number(lot.qualityPercent) === 100));
  const currentLot = () => eligibleLots().find((lot) => lot.id === selectedLotId) || eligibleLots()[0];
  const numericAmount = () => Number(amount);
  const canQuote = () => Number.isFinite(numericAmount()) && numericAmount() > 0 && (direction === "BUY" ? Boolean(targetRegion) : Boolean(currentLot()));
  const payload = () => ({ asset, direction, quantityIn: numericAmount(), lotId: direction === "SELL" ? currentLot()?.id : undefined, targetRegion: direction === "BUY" ? targetRegion : undefined });

  async function refreshQuote() {
    const sequence = ++quoteSequence;
    quote = null; quoteError = "";
    window.clearTimeout(quoteTimer);
    if (!canQuote()) { quoteLoading = false; render(); return; }
    quoteLoading = true;
    document.getElementById("confirm-swap")?.setAttribute("disabled", "disabled");
    await new Promise((resolve) => { quoteTimer = window.setTimeout(resolve, 300); });
    if (sequence !== quoteSequence) return;
    try {
      const response = await apiRequest("/pool/quote", { method: "POST", body: JSON.stringify(payload()) });
      if (sequence !== quoteSequence) return;
      quote = response.data;
    } catch (error) {
      if (sequence !== quoteSequence) return;
      quoteError = error.message || "Chưa thể báo giá giao dịch này.";
    }
    if (sequence === quoteSequence) { quoteLoading = false; render(); }
  }

  function render() {
    const pool = pools.find((item) => item.asset === asset);
    const lot = currentLot();
    const value = numericAmount();
    const max = direction === "BUY" ? Number(game.walletUsdG) : Number(lot?.quantity || 0);
    const inputLabel = direction === "BUY" ? "USDG muốn dùng" : `${assetName(asset)} muốn bán`;
    const ready = Boolean(quote) && !quoteLoading;
    const receive = direction === "BUY" ? `${fmt(quote?.amountOut)} ${assetName(asset)}` : `${fmt(quote?.amountOut)} USDG`;
    const gives = direction === "BUY" ? `${fmt(value)} USDG` : `${fmt(value)} ${assetName(asset)}`;
    const options = eligibleLots().map((item) => `<option value="${item.id}" ${lot?.id === item.id ? "selected" : ""}>${item.id.slice(0, 8)} · ${fmt(item.quantity)} ${assetName(asset).toLowerCase()} · ${item.qualityPercent}% · ${regionName(item.region)}</option>`).join("");
    const text = quoteLoading ? "Đang lấy báo giá mới nhất..." : quoteError ? quoteError : ready ? `Bạn đưa ${gives} và dự kiến nhận ${receive}.` : "Nhập số lượng để lấy báo giá từ pool.";
    const body = `<div class="pool-grid"><section class="card"><div class="step-t">1. Chọn pool</div><div class="pool-opts">${pools.map((item) => `<button class="pool-opt ${asset === item.asset ? "on" : ""}" data-pool="${item.asset}"><b>Pool ${assetName(item.asset)}–USDG <span class="badge b-muted">Phí ${fmt(Number(item.feeRate) * 100)}%</span></b><small>Dự trữ: ${fmt(item.assetReserve)} ${assetName(item.asset).toLowerCase()} · ${fmt(item.usdgReserve)} USDG</small></button>`).join("") || '<p class="hint">Chưa có pool được cấu hình.</p>'}</div><div class="step-t">2. Chiều trao đổi</div><div class="seg seg--full"><button data-direction="SELL" class="${direction === "SELL" ? "on" : ""}">${A.icon("swap")} Bán hàng lấy USDG</button><button data-direction="BUY" class="${direction === "BUY" ? "on" : ""}">${A.icon("swap")} Mua hàng bằng USDG</button></div>${direction === "SELL" ? `<div class="field"><label for="swap-lot">Lô hàng đủ điều kiện</label><select class="input" id="swap-lot" ${options ? "" : "disabled"}><option value="">${options ? "Chọn lô hàng" : `Không có ${assetName(asset).toLowerCase()} phù hợp`}</option>${options}</select><div class="help">Pool chỉ nhận lô khả dụng; lúa phải có chất lượng 100%.</div></div>` : `<div class="field"><label>Khu vực nhận hàng</label><div class="seg seg--full"><button data-region="CHAU_A" class="${targetRegion === "CHAU_A" ? "on" : ""}">Châu Á</button><button data-region="CHAU_AU" class="${targetRegion === "CHAU_AU" ? "on" : ""}">Châu Âu</button></div></div>`}<div class="step-t">3. Số lượng</div><div class="field"><label for="swap-amount">${inputLabel}</label><input class="input num" id="swap-amount" inputmode="decimal" min="0" placeholder="0" value="${amount}"><div class="help">Tối đa: ${fmt(max)} ${direction === "BUY" ? "USDG" : assetName(asset).toLowerCase()}.</div></div><button class="btn btn-soft btn-sm" id="use-max" ${max > 0 ? "" : "disabled"}>Dùng tối đa</button></section><section class="card"><div class="card-head"><h3>Báo giá dự kiến</h3><span class="badge ${ready ? "b-info" : "b-muted"}">${quoteLoading ? "Đang tính" : ready ? "Sẵn sàng" : "Chờ nhập"}</span></div><div class="rows"><div class="row"><span>Bạn đưa vào</span><b>${value > 0 ? gives : "–"}</b></div><div class="row"><span>Bạn nhận về</span><b>${ready ? receive : "–"}</b></div><div class="row"><span>Phí pool</span><b>${ready ? `${fmt(quote.fee)} ${direction === "BUY" ? "USDG" : assetName(asset)}` : "–"}</b></div><div class="row"><span>Giá thực hiện</span><b>${ready ? `${fmt(quote.executionPrice)} USDG/${assetName(asset)}` : "–"}</b></div></div><div class="banner ${quoteError ? "banner-error" : ready ? "banner-info" : "banner-warn"}" style="margin-top:16px">${A.icon(quoteError ? "err" : "swap")}<span>${text}</span></div><button class="btn btn-primary btn-block" id="confirm-swap" ${ready ? "" : "disabled"}>Xác nhận swap</button><p class="help" style="margin-top:10px">Báo giá được lấy lại từ API trước khi xác nhận. Khi gửi lệnh, backend sẽ tính lại theo dự trữ mới nhất.</p></section></div>`;
    app.className = "shell pool-shell";
    app.innerHTML = shell("pool", "Trao đổi qua pool", "Đổi hàng lấy USDG hoặc dùng USDG mua hàng từ pool thanh khoản.", body);
    app.querySelector(".topbar")?.insertAdjacentHTML("beforeend", `<span class="page-round">Vòng ${game.currentRound}/6</span><span class="badge b-success">${fmt(game.walletUsdG)} USDG</span><span class="avatar pool-avatar">ND</span>`);
    app.querySelectorAll("[data-pool]").forEach((button) => button.addEventListener("click", () => { asset = button.dataset.pool; selectedLotId = ""; amount = ""; refreshQuote(); }));
    app.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => { direction = button.dataset.direction; selectedLotId = ""; amount = ""; refreshQuote(); }));
    app.querySelectorAll("[data-region]").forEach((button) => button.addEventListener("click", () => { targetRegion = button.dataset.region; refreshQuote(); }));
    document.getElementById("swap-lot")?.addEventListener("change", (event) => { selectedLotId = event.target.value; refreshQuote(); });
    document.getElementById("swap-amount")?.addEventListener("input", (event) => { amount = event.target.value.replace(/[^0-9.]/g, ""); refreshQuote(); });
    document.getElementById("use-max")?.addEventListener("click", () => { amount = String(max); refreshQuote(); });
    document.getElementById("confirm-swap")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!quote || !await confirmDialog({ title: "Xác nhận giao dịch pool", message: `Bạn đưa ${gives} và dự kiến nhận ${receive}. Báo giá sẽ được tính lại khi xác nhận.`, confirmLabel: "Xác nhận swap" })) return;
      button.disabled = true; button.innerHTML = '<span class="spin"></span> Đang xử lý';
      try {
        await apiRequest("/pool/swap", { method: "POST", body: JSON.stringify({ ...payload(), requestId: crypto.randomUUID() }) });
        toast("Đổi qua pool thành công. Số dư và kho đã được cập nhật.");
        window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 500);
      } catch (error) { toast(error.message || "Chưa thể thực hiện giao dịch này.", true); refreshQuote(); }
    });
  }
  render();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Trao đổi</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><a class="btn btn-primary" href="../dashboard/dashboard.html">Về Trang chủ</a></div>`;
}
