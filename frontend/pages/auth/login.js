import { login, logout } from "../../services/firebase/auth.js";
import { apiRequest } from "../../services/api/apiClient.js";
import { clearDemoSession, startDemoSession } from "../../services/demo/demoSession.js";

const A = window.AgriSim;
document.body.setAttribute("data-bg", "terrace");
const app = document.getElementById("app");
app.className = "auth";
app.innerHTML = `
  <main class="login-stage"><a class="login-brand" href="../landing/landing.html" aria-label="Về trang giới thiệu"><span class="mark"><img src="../../assets/images/SVG.svg" alt=""></span><span><b>AGRISIM</b><small>GLOBAL</small></span></a><form class="auth-card login-card" id="login-form" novalidate>
    <div class="login-card-heading"><h2>Đăng nhập</h2><p>Tiếp tục lượt chơi của bạn</p></div>
    <div class="banner banner-error" id="global-error" role="alert" hidden></div>
    <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email" placeholder="Nhập email của bạn"><div class="err-text" id="email-error" hidden></div></div>
    <div class="field"><label for="password">Mật khẩu</label><div class="input-wrap"><input class="input" id="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"><button type="button" class="eye" id="toggle-password" aria-label="Hiện mật khẩu">${A.icon("eye")}</button></div><div class="err-text" id="password-error" hidden></div></div>
    <button class="btn btn-primary btn-block btn-lg" id="submit" type="submit">Đăng nhập</button>
    <div class="login-divider"><span>hoặc</span></div>
    <button class="btn btn-outline btn-block login-demo-button" id="demo-login" type="button">${A.icon("sprout")} Dùng thử bằng tài khoản mẫu</button>
    <div class="login-demo-note">${A.icon("info")}<span>Dữ liệu dùng thử chỉ tồn tại trong phiên duyệt web này và sẽ không được lưu.</span></div>
    <div class="foot">Chưa có tài khoản? <a href="register.html">Đăng ký</a></div>
  </form></main>`;

const $ = (id) => document.getElementById(id);
function setFieldError(errorId, inputId, message) { const element = $(errorId); element.hidden = !message; element.innerHTML = message ? `${A.icon("err")}${message}` : ""; $(inputId).classList.toggle("is-invalid", Boolean(message)); return Boolean(message); }
function setBusy(busy, text = "Đăng nhập") { $("submit").disabled = busy; $("submit").innerHTML = busy ? `<span class="spin"></span> ${text}` : "Đăng nhập"; }
function setDemoBusy(busy) { $("demo-login").disabled = busy; $("demo-login").innerHTML = busy ? '<span class="spin"></span> Đang mở lượt dùng thử…' : `${A.icon("sprout")} Dùng thử bằng tài khoản mẫu`; }
function showGlobalError(message) { $("global-error").hidden = false; $("global-error").innerHTML = `${A.icon("err")}<span>${message}</span>`; }
function firebaseMessage(error) { switch (error.code) { case "auth/invalid-email": return "Email chưa đúng định dạng."; case "auth/user-not-found": case "auth/invalid-credential": return "Email hoặc mật khẩu không đúng."; case "auth/too-many-requests": return "Bạn đã thử quá nhiều lần. Hãy chờ rồi thử lại."; case "auth/network-request-failed": return "Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại."; default: return "Chưa đăng nhập được. Vui lòng thử lại."; } }

$("toggle-password").addEventListener("click", () => { const input = $("password"); const reveal = input.type === "password"; input.type = reveal ? "text" : "password"; $("toggle-password").innerHTML = A.icon(reveal ? "eyeoff" : "eye"); });
$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault(); $("global-error").hidden = true;
  const email = $("email").value.trim(), password = $("password").value;
  const invalid = [setFieldError("email-error", "email", !email ? "Vui lòng nhập email." : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Email chưa đúng định dạng." : ""), setFieldError("password-error", "password", !password ? "Vui lòng nhập mật khẩu." : "")].some(Boolean);
  if (invalid) return;
  setBusy(true, "Đang đăng nhập…");
  try { clearDemoSession(); await login(email, password); await apiRequest("/player/profile", { forceTokenRefresh: true }); const current = await apiRequest("/game"); window.location.replace(!current.data ? "../game/startgame.html" : current.data.status === "FINISHED" ? "../game/endgame.html" : "../dashboard/dashboard.html"); }
  catch (error) { setBusy(false); if (error.code) showGlobalError(firebaseMessage(error)); else if (error.status === 401) { await logout(); showGlobalError("Backend không xác minh được ID Token mới. Hãy khởi động lại backend rồi thử lại."); } else showGlobalError("Đăng nhập Firebase thành công nhưng chưa kết nối được API backend. Hãy kiểm tra backend đang chạy tại cổng 3000."); }
});
$("demo-login").addEventListener("click", async () => { $("global-error").hidden = true; setDemoBusy(true); try { await logout(); startDemoSession(); window.location.replace("../game/startgame.html"); } catch { setDemoBusy(false); showGlobalError("Chưa thể mở lượt dùng thử. Vui lòng thử lại."); } });
