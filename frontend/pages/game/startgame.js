import { apiRequest } from "../../services/api/apiClient.js";

const A = window.AgriSim;
const app = document.getElementById("app");
let selectedRegion = null;

document.body.setAttribute("data-bg", "terrace");
app.className = "auth";
app.innerHTML = `
  <main class="login-stage startgame-stage"><a class="login-brand" href="../landing/landing.html"><span class="mark"><img src="../../assets/images/SVG.svg" alt=""></span><span><b>AGRISIM</b><small>GLOBAL</small></span></a><div class="auth-card start-card">
    <section class="start-intro"><span class="start-role">${A.icon("user")} Vai trò duy nhất</span><h1>Bạn là Nông dân</h1><p>Trồng lúa, vận chuyển liên khu vực và giao dịch qua pool trong 6 vòng.</p>
      <div class="start-steps"><div class="step"><span class="ic"><img src="../../assets/images/grass.svg" alt=""></span><div><b><span class="step-number">1.</span> Trồng lúa và thu hoạch</b><small>Thu hoạch đúng vòng để giữ chất lượng 100%.</small></div></div><div class="step"><span class="ic"><img src="../../assets/images/trade.svg" alt=""></span><div><b><span class="step-number">2.</span> Bán, gửi hàng hoặc trao đổi qua pool</b><small>Lựa chọn thị trường và quản lý tài sản linh hoạt.</small></div></div><div class="step"><span class="ic"><img src="../../assets/images/time.svg" alt=""></span><div><b><span class="step-number">3.</span> Chuyển vòng · chơi tối đa 6 vòng</b><small>Theo dõi biến động thị trường qua từng vòng.</small></div></div></div>
    </section>
    <section class="start-selection"><div class="start-selection-heading"><h2>Chọn khu vực khởi đầu</h2><p>Hãy chọn một khu vực để tiếp tục.</p></div><div class="banner banner-error" id="error" hidden></div>
      <div class="region-grid"><label class="region-opt" data-region="CHAU_A"><input type="radio" name="region"><b>Châu Á</b><i aria-hidden="true"></i><div class="region-copy"><h3 style="font-size:16px">Vùng lúa đồng bằng</h3><p>Lúa được thu hoạch tại khu vực <p>này.</p></p></div></label><label class="region-opt" data-region="CHAU_AU"><input type="radio" name="region"><b>Châu Âu</b><i aria-hidden="true"></i><div class="region-copy"><h3 style="font-size:16px">Thị trường xuất khẩu</h3><p>Lúa được thu hoạch tại khu vực <p>này.</p></p></div></label></div>
      <div class="start-summary"><div><span>Tài sản ban đầu</span><b>2.000 USDG</b></div><div><span>Ô ruộng</span><b>1 ô trống</b></div><div><span>Kho hàng</span><b>Trống</b></div><div><span>Pool</span><b>2 pool khả dụng</b></div></div>
      <div class="start-actions"><button class="btn btn-primary" id="start" disabled>Bắt đầu</button></div>
    </section>
  </div></main>`;

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
        const detail = error.message || "Không nhận được phản hồi từ API.";
        banner.innerHTML = `${A.icon("err")}<span>${error.status === 409 ? "Tài khoản đã có lượt chơi. Đang chuyển đến trang chủ…" : `Chưa thể khởi tạo lượt chơi${error.status ? ` (HTTP ${error.status})` : ""}: ${detail}`}</span>`;
        if (error.status === 409) window.setTimeout(() => window.location.replace("../dashboard/dashboard.html"), 1000);
    }
});
