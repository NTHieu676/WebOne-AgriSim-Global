import { apiRequest } from "../../services/api/apiClient.js";
import { confirmDialog } from "../../services/ui/dialog.js";

const A = window.AgriSim;
const app = document.getElementById("app");
const fmt = (value) => Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const region = (value) => value === "CHAU_A" ? "Châu Á" : "Châu Âu";
app.className = "shell";
app.innerHTML = `<main class="main"><section class="content"><div class="skel" style="height:80px;border-radius:20px"></div><div class="dash-top"><div class="skel" style="height:280px;border-radius:24px"></div><div class="stat-grid"><div class="skel" style="height:130px;border-radius:20px"></div><div class="skel" style="height:130px;border-radius:20px"></div><div class="skel" style="height:130px;border-radius:20px"></div><div class="skel" style="height:130px;border-radius:20px"></div></div></div></section></main>`;

function side(active = "home") {
  const links = [["home", "Trang chủ", "home", "../dashboard/dashboard.html"], ["farm", "Nông trại", "sprout", "../farm/farm.html"], ["inventory", "Kho hàng", "box", "../inventory/inventory.html"], ["pool", "Trao đổi", "swap", "../pool/pool.html"], ["market", "Thị trường & Vận chuyển", "truck", "../market/market.html"], ["profile", "Hồ sơ & Ngân hàng", "bank", "../profile/profile.html"]];
  return `<aside class="sidebar"><a class="brand" href="dashboard.html"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a><nav class="nav">${links.map(([id, title, icon, href]) => `<a ${id === active ? 'aria-current="page"' : ""} href="${href}">${A.icon(icon)}<span>${title}</span></a>`).join("")}</nav><div class="promo"><div class="art">${A.icon("sprout")}</div><b>Hết diện tích để trồng?</b><p>Mở rộng nông trại tại đây.</p><a class="btn btn-accent btn-sm" href="../farm/farm.html">Mở Nông trại</a></div></aside>`;
}

function stateLabel(plot, round) {
  if (!plot) return "Chưa có ruộng";
  if (plot.status === "READY") return "Sẵn sàng thu hoạch";
  if (plot.status === "GROWING") return `Đang sinh trưởng · còn ${Math.max(0, plot.readyRound - round)} vòng`;
  return "Ô ruộng đang trống";
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
  const result = await apiRequest("/game/dashboard");
  const data = result.data;
  if (!data) window.location.replace("../game/startgame.html");
  if (data.game.status === "FINISHED") window.location.replace("../game/endgame.html");
  const { game, plots, lots, shipments, recentHistory } = data;
  const selected = plots[0];
  const rice = lots.filter((lot) => lot.asset === "RICE").reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  const gold = lots.filter((lot) => lot.asset === "GOLD").reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  const history = recentHistory.length ? recentHistory.map((event) => `<tr><td>V${event.round}</td><td><b>${event.type.replaceAll("_", " ")}</b></td><td>${event.asset || "–"}</td><td class="r ${event.usdDelta > 0 ? "pos" : event.usdDelta < 0 ? "neg" : ""}">${event.usdDelta ? `${event.usdDelta > 0 ? "+" : ""}${fmt(event.usdDelta)} USDG` : "–"}</td></tr>`).join("") : `<tr><td colspan="4" class="hint">Chưa có hoạt động nào ngoài lúc bắt đầu lượt chơi.</td></tr>`;
  app.className = "shell has-panel";
  app.innerHTML = `${side()}<main class="main"><header class="topbar"><div class="ttl"><small>Xin chào,</small><h1>Nông dân</h1></div><span class="badge b-muted">Vòng ${game.currentRound}/6</span><span class="badge b-success">Số dư ${fmt(game.walletUsdG)} USDG</span>${game.currentRound < 6 ? '<button class="btn btn-accent hide-m" id="advance-round">Chuyển vòng →</button>' : '<button class="btn btn-accent hide-m" disabled title="Chức năng kết thúc lượt đang được hoàn thiện">Kết thúc lượt</button>'}</header><section class="content"><div class="dash-top"><article class="card"><div class="card-head"><div><h2>Tiến trình mùa vụ</h2><div class="hint">Trạng thái nông trại của bạn ở vòng ${game.currentRound}</div></div><a class="btn btn-outline btn-sm" href="../farm/farm.html">Ô ruộng 1</a></div><div class="growth"><div class="line"></div><div class="stages"><div class="stage"><div style="height:22px"></div><div class="dot"></div><div class="ill">${A.icon("plus")}</div>Đã trồng</div><div class="stage cur"><span class="here">Bạn đang ở đây</span><div class="dot"></div><div class="ill">${A.icon("sprout")}</div>Sinh trưởng</div><div class="stage off"><div style="height:22px"></div><div class="dot"></div><div class="ill">${A.icon("leaf")}</div>Sẵn sàng</div></div></div><div class="note note-info">${A.icon("sprout")}<span>${stateLabel(selected, game.currentRound)} · ${selected?.status === "EMPTY" ? "Trồng lúa tại Nông trại để bắt đầu." : "Theo dõi ruộng tại Nông trại."}</span></div></article><div class="stat-grid"><a class="stat stat--usdg" href="../profile/profile.html"><div class="lbl"><span>Số dư USDG</span><span class="chip">${A.icon("wallet")}</span></div><div class="val num">${fmt(game.walletUsdG)}<small>USDG</small></div><div class="sub">Đã nạp thêm: ${fmt(game.totalTopups)} USDG</div></a><a class="stat stat--lua" href="../inventory/inventory.html"><div class="lbl"><span>Lúa trong kho</span><span class="chip">${A.icon("leaf")}</span></div><div class="val num">${fmt(rice)}<small>đơn vị</small></div><div class="sub">Hàng trong kho</div></a><a class="stat stat--vang" href="../inventory/inventory.html"><div class="lbl"><span>Vàng trong kho</span><span class="chip">${A.icon("coin")}</span></div><div class="val num">${fmt(gold)}<small>đơn vị</small></div><div class="sub">Hàng trong kho</div></a><a class="stat stat--ship" href="../market/market.html?tab=ship"><div class="lbl"><span>Đang vận chuyển</span><span class="chip">${A.icon("truck")}</span></div><div class="val num">${shipments.length}<small>chuyến</small></div><div class="sub">Theo dõi tại Thị trường</div></a></div></div><div class="dash-mid"><article class="card"><div class="card-head"><div><h2>Giá lúa qua các vòng</h2><div class="hint">Đơn vị: USDG / đơn vị · giá vòng tương lai được ẩn</div></div><div class="seg"><button class="on">Châu Á</button><button disabled>Châu Âu</button></div></div><div class="chart">${[1,2,3,4,5,6].map((round) => `<div class="b ${round === game.currentRound ? "cur" : round > game.currentRound ? "fut" : ""}"><span>${round <= game.currentRound ? "·" : "–"}</span><i style="height:${round <= game.currentRound ? 40 + round * 10 : 30}%"></i></div>`).join("")}</div><div class="chart-lbl">${[1,2,3,4,5,6].map((round) => `<span class="${round === game.currentRound ? "cur" : ""}">V${round}</span>`).join("")}</div></article><article class="card net"><div class="card-head"><div><h2 style="color:#fff">Tài sản ròng ước tính</h2><div class="sub">Không phải điểm số</div></div><span class="badge b-muted">${game.currentRound}/6 vòng</span></div><div class="row"><div class="ring" style="--p:${game.currentRound / 6 * 100}%"><span>${game.currentRound}/6</span></div><div><div class="big num">${fmt(game.walletUsdG)} USDG</div><span class="gain">${A.icon("up")} Vốn khả dụng</span></div></div><p class="sub" style="margin-top:12px">Gồm USDG, hàng trong kho và hàng đang vận chuyển. Hàng trong pool tính riêng.</p></article></div><article class="card"><div class="card-head"><h2>Hoạt động gần nhất</h2><a class="btn btn-outline btn-sm" href="../profile/profile.html?tab=history">Xem lịch sử</a></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Vòng</th><th>Thao tác</th><th>Hàng hóa</th><th class="r">USDG</th></tr></thead><tbody>${history}</tbody></table></div></article></section></main><aside class="panel"><div class="scene" style="background-image:url('../../assets/images/bg-navy-panel.jpg')"></div><h4>Thông báo thị trường</h4><div class="pn-notice"><span class="badge b-warning">Vòng ${game.currentRound} · Đại dịch toàn cầu</span><p>Thị trường thay đổi theo kịch bản từng vòng.</p></div><div class="pn-item"><span class="ic">${A.icon("sprout")}</span><div><b>${stateLabel(selected, game.currentRound)}</b><small>Khu vực ${region(game.startRegion)}</small></div></div><a class="link" href="../market/notices.html">Xem tất cả thông báo →</a></aside>`;
  app.insertAdjacentHTML("beforeend", `<nav class="tabbar" aria-label="Điều hướng chính"><a aria-current="page" href="dashboard.html">${A.icon("home")}<span>Trang chủ</span></a><a href="../farm/farm.html">${A.icon("sprout")}<span>Nông trại</span></a><a href="../inventory/inventory.html">${A.icon("box")}<span>Kho</span></a><a href="../pool/pool.html">${A.icon("swap")}<span>Trao đổi</span></a><a href="../market/market.html">${A.icon("truck")}<span>Thị trường</span></a></nav>`);
  const finishButton = [...app.querySelectorAll("button")].find((button) => button.textContent.includes("Kết thúc lượt"));
  if (finishButton) {
    finishButton.disabled = false;
    finishButton.removeAttribute("title");
    finishButton.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      if (!await confirmDialog({ title: "Kết thúc lượt chơi", message: "Sau khi xác nhận, dữ liệu lượt này chỉ còn để xem và không thể thao tác thêm.", confirmLabel: "Kết thúc lượt", tone: "danger" })) return;
      button.disabled = true;
      button.innerHTML = '<span class="spin"></span> Đang tổng kết…';
      try {
        await apiRequest("/game/finish", { method: "POST", body: JSON.stringify({ expectedRound: 6, requestId: crypto.randomUUID() }) });
        window.location.replace("../game/endgame.html");
      } catch (error) {
        button.disabled = false;
        button.textContent = "Kết thúc lượt";
        showToast(error.message || "Chưa thể kết thúc lượt chơi.", true);
      }
    });
  }
  document.getElementById("advance-round")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (!await confirmDialog({ title: "Chuyển sang vòng tiếp theo", message: "Lúa trong kho và chuyến đang đi sẽ giảm 5 điểm chất lượng; cây đủ kỳ sẽ sẵn sàng thu hoạch.", confirmLabel: "Chuyển vòng" })) return;
    button.disabled = true;
    button.classList.add("is-busy");
    button.innerHTML = '<span class="spin"></span> Đang chuyển…';
    try {
      await apiRequest("/game/advance", { method: "POST", body: JSON.stringify({ expectedRound: game.currentRound, requestId: crypto.randomUUID() }) });
      showToast("Đã chuyển vòng. Dữ liệu mới đang được tải.");
      window.setTimeout(() => window.__agrisimRefresh?.() ?? window.location.reload(), 550);
    } catch (error) {
      button.disabled = false;
      button.classList.remove("is-busy");
      button.textContent = "Chuyển vòng →";
      showToast(error.message || "Chưa thể chuyển vòng. Hãy tải lại dữ liệu.", true);
    }
  });
  setupMarketPanel();
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Dashboard</h1><div class="banner banner-error">${A.icon("err")}<span>${error.status ? `API trả lỗi HTTP ${error.status}.` : "Không kết nối được API Dashboard."}</span></div><button class="btn btn-primary" id="retry">Thử lại</button></div>`;
  document.getElementById("retry").onclick = () => window.__agrisimRefresh?.() ?? window.location.reload();
}
