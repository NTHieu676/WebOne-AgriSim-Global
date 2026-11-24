import { observeAuth } from "../../services/firebase/auth.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { getRuntimeProfile } from "../../services/demo/demoSession.js";

const A = window.AgriSim;
const app = document.getElementById("app");
const imageRoot = "../../assets/images/";

function render(session = { signedIn: false, destination: "../auth/register.html", label: "Bắt đầu chơi" }) {
  const signedIn = session.signedIn;
  const destination = session.destination;
  const mainAction = signedIn ? "Tiếp tục chơi" : "Bắt đầu chơi";
  const authLinks = signedIn
    ? `<a class="btn btn-primary" href="${destination}">Vào game</a>`
    : `<a class="btn btn-outline" href="../auth/login.html">Đăng nhập</a><a class="btn btn-primary" href="../auth/register.html">Đăng ký</a>`;
  const cta = signedIn
    ? `<a class="btn btn-primary btn-lg" href="${destination}">${mainAction}</a>`
    : `<a class="btn btn-primary btn-lg" href="../auth/register.html">${mainAction}</a><a class="btn btn-outline btn-lg" href="../auth/login.html">Tôi đã có tài khoản</a>`;
  const bg = (file) => `style="background-image:url(${imageRoot}${file})"`;
  app.className = "lp";
  app.innerHTML = `<header class="lp-nav"><a class="brand" href="landing.html" aria-label="AgriSim Global"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a><nav><a class="lp-link" href="#how">Cách chơi</a>${authLinks}</nav></header><section class="lp-hero" ${bg("bg-terrace.jpg")}><div class="lp-shade"></div><div class="lp-hero-in"><span class="badge b-success">${A.icon("sprout")} Trò chơi mô phỏng nông nghiệp toàn cầu</span><h1>Gieo trồng, vận chuyển và giao thương cùng thế giới</h1><p>Làm nông dân trong 6 vòng chơi: trồng lúa, gửi hàng giữa Châu Á và Châu Âu, rồi trao đổi để tăng tài sản ròng.</p><div class="lp-cta">${cta}</div><div class="lp-note">${A.icon("info")}<span>Toàn bộ là tiền giả lập (USDG), không dùng tiền thật.</span></div></div></section><section class="lp-facts" aria-label="Thông tin nhanh"><div class="lp-fact"><span class="ic">${A.icon("clock")}</span><b>6</b><small>vòng chơi</small></div><div class="lp-fact"><span class="ic">${A.icon("coin")}</span><b>2.000</b><small>USDG vốn ban đầu</small></div><div class="lp-fact"><span class="ic">${A.icon("truck")}</span><b>2</b><small>khu vực giao thương</small></div><div class="lp-fact"><span class="ic">${A.icon("leaf")}</span><b>2</b><small>hàng hóa: Lúa · Vàng</small></div></section><section class="lp-sec" id="how"><h2>Cách chơi</h2><p class="lp-sub">Ba việc chính trong mỗi vòng</p><div class="lp-steps"><article class="lp-step" ${bg("card-lua-cream.jpg")}><span class="n">1</span><span class="ic">${A.icon("sprout")}</span><h3>Trồng và thu hoạch</h3><p>Dùng USDG để gieo lúa, sau một vòng thu về sản lượng và chất lượng tương ứng.</p></article><article class="lp-step" ${bg("card-vanchuyen-blue.jpg")}><span class="n">2</span><span class="ic">${A.icon("truck")}</span><h3>Vận chuyển và trao đổi</h3><p>Đưa hàng sang khu vực khác hoặc trao đổi qua pool thanh khoản.</p></article><article class="lp-step dark" ${bg("card-networth-dark.jpg")}><span class="n">3</span><span class="ic">${A.icon("chart")}</span><h3>Chốt tài sản ròng</h3><p>Sau vòng 6, hệ thống tổng kết USDG, hàng trong kho và hàng vận chuyển.</p></article></div></section><section class="lp-band" ${bg("illus-rice-banner.jpg")}><div><h2>Sẵn sàng làm nông dân?</h2><p>Tạo tài khoản miễn phí và bắt đầu lượt chơi đầu tiên.</p></div><div class="lp-cta">${cta}</div></section><footer class="lp-foot">AgriSim Global · Dự án học tập · Tiền trong game là tiền giả lập</footer>`;
}

render();
const demoProfile = getRuntimeProfile();
if (demoProfile) {
  let destination = "../game/startgame.html";
  try {
    const result = await apiRequest("/game/dashboard");
    const game = result.data?.game;
    if (game) destination = game.status === "FINISHED" ? "../game/endgame.html" : "../dashboard/dashboard.html";
  } catch { /* A fresh demo session can always start a new game. */ }
  render({ signedIn: true, destination });
}
observeAuth(async (user) => {
  if (getRuntimeProfile()) return;
  if (!user) return render();
  let destination = "../game/startgame.html";
  try {
    const result = await apiRequest("/game/dashboard");
    const game = result.data?.game;
    if (game) destination = game.status === "FINISHED" ? "../game/endgame.html" : "../dashboard/dashboard.html";
  } catch {
    // The landing page remains usable even while the game API is restarting.
  }
  render({ signedIn: true, destination });
});
