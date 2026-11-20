import { apiRequest } from "../../services/api/apiClient.js";

const A = window.AgriSim;
const app = document.getElementById("app");
let selectedRegion = null;

document.body.setAttribute("data-bg", "terrace");
app.className = "auth";
app.innerHTML = `
  <a class="brand" href="../landing/landing.html"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a>
  <div class="auth-card start-card"><div class="role"><span class="badge b-info">${A.icon("user")} Vai trò duy nhất</span><h1>Bạn là Nông dân</h1><p class="lead">Quản lý mùa vụ, vận chuyển liên khu vực và giao dịch qua pool trong 6 vòng.</p>
  <div class="step"><span class="ic">${A.icon("sprout")}</span><div><b>Trồng lúa và thu hoạch</b><small>Thu hoạch đúng vòng để giữ chất lượng 100%.</small></div></div>
  <div class="step"><span class="ic">${A.icon("clock")}</span><div><b>Chơi tối đa 6 vòng</b><small>Theo dõi biến động thị trường qua từng vòng.</small></div></div></div>
  <div><h2 style="font-size:19px;font-weight:800">Chọn khu vực khởi đầu</h2><p class="help">Lựa chọn này không thay đổi trong lượt chơi.</p><div class="banner banner-error" id="error" hidden></div>
  <div class="region-grid"><label class="region-opt" data-region="CHAU_A"><input type="radio" name="region">${A.icon("leaf")}<b>Châu Á</b><small>Vùng lúa đồng bằng.</small></label><label class="region-opt" data-region="CHAU_AU"><input type="radio" name="region">${A.icon("tag")}<b>Châu Âu</b><small>Thị trường xuất khẩu.</small></label></div>
  <div class="rows"><div class="row"><span>Tài sản ban đầu</span><b>2.000 USDG</b></div><div class="row"><span>Ô ruộng</span><b>1 ô trống</b></div><div class="row"><span>Kho</span><b>Trống</b></div><div class="row"><span>Pool</span><b>Lúa–USDG, Vàng–USDG</b></div></div>
  <div class="acts"><button class="btn btn-primary" id="start" disabled>Bắt đầu lượt chơi</button></div></div></div>`;

const startButton = document.getElementById("start");
document.querySelectorAll("[data-region]").forEach((option) => option.addEventListener("click", () => {
    selectedRegion = option.dataset.region;
    document.querySelectorAll("[data-region]").forEach((item) => item.classList.toggle("sel", item === option));
    option.querySelector("input").checked = true;
    startButton.disabled = false;
}));

startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    startButton.innerHTML = '<span class="spin"></span> Đang khởi tạo…';
    try {
        await apiRequest("/game/start", { method: "POST", body: JSON.stringify({ region: selectedRegion }) });
        window.location.replace("../dashboard/dashboard.html");
    } catch (error) {
        startButton.disabled = false;
        startButton.textContent = "Bắt đầu lượt chơi";
        const banner = document.getElementById("error");
        banner.hidden = false;
        banner.innerHTML = `${A.icon("err")}<span>${error.status === 409 ? "Tài khoản đã có lượt chơi. Đang chuyển đến trang chủ…" : "Chưa thể khởi tạo lượt chơi. Hãy kiểm tra backend rồi thử lại."}</span>`;
        if (error.status === 409) window.setTimeout(() => window.location.replace("../dashboard/dashboard.html"), 1000);
    }
});
