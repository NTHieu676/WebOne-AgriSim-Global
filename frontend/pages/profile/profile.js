import { auth } from "../../services/firebase/firebase.js";
import { A, fmt, gameData, shell } from "../../services/ui/gameScreen.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { getRuntimeProfile } from "../../services/demo/demoSession.js";
import { alertDialog, confirmDialog, numberDialog } from "../../services/ui/dialog.js";

const app = document.getElementById("app");
app.className = "shell profile-shell";
app.innerHTML = '<main class="main"><section class="content"><div class="skel" style="height:360px;border-radius:24px"></div></section></main>';

function eventName(type) { return ({ GAME_STARTED: "Bắt đầu lượt", PLANTED: "Trồng lúa", HARVESTED: "Thu hoạch", PLOT_PURCHASED: "Mua ô ruộng", TOPPED_UP: "Nạp USDG", SWAPPED: "Đổi qua pool", SOLD: "Bán hàng", SHIPPED: "Gửi hàng", SHIPMENT_ARRIVED: "Hàng đã đến", ROUND_ADVANCED: "Chuyển vòng", GAME_FINISHED: "Kết thúc lượt" })[type] || type; }
function dateLabel(value) {
  const seconds = value?.seconds ?? value?._seconds;
  const date = value?.toDate ? value.toDate() : Number.isFinite(Number(seconds)) ? new Date(Number(seconds) * 1000) : value ? new Date(value) : null;
  return date && !Number.isNaN(date) ? date.toLocaleString("vi-VN") : "–";
}

try {
  const { game, lots = [], shipments = [] } = await gameData();
  const user = getRuntimeProfile() || auth.currentUser;
  const displayName = user?.displayName || "Nông dân";
  const email = user?.email || "Chưa có email";
  const initials = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const region = game.startRegion === "CHAU_A" ? "Châu Á" : "Châu Âu";
  let tab = new URLSearchParams(location.search).get("tab") === "history" ? "history" : "profile";
  let filter = "";
  let historyEvents = [];

  async function loadHistory() {
    const query = filter ? `?type=${encodeURIComponent(filter)}` : "";
    const response = await apiRequest(`/game/history${query}`);
    historyEvents = response.data || [];
  }
  async function topup() {
    const amount = await numberDialog({ title: "Nạp USDG mô phỏng", message: "Thao tác này không phát sinh thanh toán thật.", label: "Số USDG muốn nạp", initial: 500, min: 100, max: 5000, confirmLabel: "Tiếp tục" });
    if (amount === null) return;
    if (!Number.isInteger(amount)) { await alertDialog({ title: "Số tiền chưa hợp lệ", message: "Số USDG nạp phải là số nguyên." }); return; }
    if (!await confirmDialog({ title: "Xác nhận nạp USDG", message: `Nạp mô phỏng ${fmt(amount)} USDG vào lượt chơi hiện tại?`, confirmLabel: "Nạp USDG" })) return;
    await apiRequest("/game/topup", { method: "POST", body: JSON.stringify({ amount, requestId: crypto.randomUUID() }) });
    window.__agrisimRefresh?.() ?? window.location.reload();
  }
  function render() {
    const tabs = `<div class="seg"><button data-tab="profile" class="${tab === "profile" ? "on" : ""}">Hồ sơ</button><button data-tab="history" class="${tab === "history" ? "on" : ""}">Hoạt động</button></div>`;
    const historyHtml = `<div class="card"><div class="card-head"><div><h3>Lịch sử hoạt động</h3><span class="hint">Các giao dịch thành công của lượt chơi hiện tại.</span></div><select class="input" id="history-filter" style="max-width:190px"><option value="">Tất cả thao tác</option><option value="PLANTED" ${filter === "PLANTED" ? "selected" : ""}>Trồng lúa</option><option value="HARVESTED" ${filter === "HARVESTED" ? "selected" : ""}>Thu hoạch</option><option value="SWAPPED" ${filter === "SWAPPED" ? "selected" : ""}>Đổi pool</option><option value="SOLD" ${filter === "SOLD" ? "selected" : ""}>Bán hàng</option><option value="SHIPPED" ${filter === "SHIPPED" ? "selected" : ""}>Gửi hàng</option><option value="TOPPED_UP" ${filter === "TOPPED_UP" ? "selected" : ""}>Nạp USDG</option></select></div>${historyEvents.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Thời điểm</th><th>Vòng</th><th>Thao tác</th><th>Hàng hóa</th><th class="r">USDG</th></tr></thead><tbody>${historyEvents.map((event) => `<tr><td>${dateLabel(event.createdAt)}</td><td>V${event.round || "–"}</td><td><b>${eventName(event.type)}</b></td><td>${event.asset || "–"}</td><td class="r ${Number(event.usdDelta) > 0 ? "pos" : Number(event.usdDelta) < 0 ? "neg" : ""}">${event.usdDelta ? `${Number(event.usdDelta) > 0 ? "+" : ""}${fmt(event.usdDelta)} USDG` : "–"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty"><div class="ic">' + A.icon("clock") + '</div><h3>Chưa có hoạt động phù hợp</h3><p>Hãy thao tác trong nông trại, kho, thị trường hoặc pool để tạo lịch sử.</p></div>'}</div>`;
    const profile = `<div class="profile-grid"><div class="card"><div class="card-head"><h3>Thông tin người chơi</h3><span class="badge b-success">Nông dân</span></div><div class="who"><span class="avatar">${initials || "ND"}</span><div><div class="hint">Tên hiển thị</div><b style="font-size:16px">${displayName}</b><div class="hint">${email}</div></div></div><div class="rows" style="margin-top:12px"><div class="row"><span>Khu vực khởi đầu</span><b>${region}</b></div><div class="row"><span>Trạng thái lượt chơi</span><b>Đang chơi</b></div></div></div><div class="card"><div class="card-head"><h3>Số dư USDG</h3><span class="badge b-muted">Vòng ${game.currentRound}/6</span></div><div class="bigmoney"><span>Số tiền còn lại</span><b class="num">${fmt(game.walletUsdG)} USDG</b></div><div class="note note-info" style="margin-top:12px">${A.icon("info")}<span>Nạp USDG là thao tác mô phỏng, không phát sinh thanh toán thật.</span></div><button class="btn btn-primary btn-block" id="topup">Nạp USDG</button></div></div>`;
    app.className = "shell profile-shell";
    app.innerHTML = shell("profile", "Hồ sơ & Ngân hàng", "Thông tin tài khoản, số dư và hoạt động của lượt chơi.", `${tabs}${tab === "history" ? historyHtml : profile}`);
    app.querySelector(".topbar")?.insertAdjacentHTML("beforeend", `<span class="page-round">Vòng ${game.currentRound}/6</span><span class="badge b-success">${fmt(game.walletUsdG)} USDG</span><span class="avatar profile-avatar">${initials || "ND"}</span>`);
    app.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", async () => { tab = button.dataset.tab; history.replaceState(null, "", `${location.pathname}${tab === "history" ? "?tab=history" : ""}`); if (tab === "history") await loadHistory(); render(); }));
    document.getElementById("topup")?.addEventListener("click", async (event) => { const button = event.currentTarget; button.disabled = true; try { await topup(); } catch (error) { button.disabled = false; await alertDialog({ title: "Chưa thể nạp USDG", message: error.message || "Vui lòng thử lại." }); } });
    document.getElementById("history-filter")?.addEventListener("change", async (event) => { filter = event.target.value; await loadHistory(); render(); });
  }
  if (tab === "history") await loadHistory();
  render();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Hồ sơ</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API."}</span></div><a class="btn btn-primary" href="../dashboard/dashboard.html">Về Trang chủ</a></div>`;
}
