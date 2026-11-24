import { register, logout } from "../../services/firebase/auth.js";

const A = window.AgriSim;
document.body.setAttribute("data-bg", "terrace");

const app = document.getElementById("app");
app.className = "auth";
app.innerHTML = `
  <main class="login-stage register-stage"><a class="login-brand" href="../landing/landing.html" aria-label="Về trang giới thiệu"><span class="mark"><img src="../../assets/images/SVG.svg" alt=""></span><span><b>AGRISIM</b><small>GLOBAL</small></span></a><form class="auth-card register-card" id="register-form" novalidate>
    <h1>Tạo tài khoản</h1><p class="lead">Tạo tài khoản qua Firebase Authentication.</p>
    <div class="banner banner-error" id="global-error" role="alert" hidden></div>
    <div class="field"><label for="name">Tên hiển thị</label><input class="input" id="name" autocomplete="name" placeholder="Ví dụ: Minh Anh" maxlength="40"><div class="err-text" id="name-error" hidden></div></div>
    <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email" placeholder="ten@example.com"><div class="err-text" id="email-error" hidden></div></div>
    <div class="field"><label for="password">Mật khẩu</label><div class="input-wrap"><input class="input" id="password" type="password" autocomplete="new-password" placeholder="Tối thiểu 8 ký tự"><button type="button" class="eye" data-password="password" aria-label="Hiện mật khẩu">${A.icon("eye")}</button></div><div class="help">Mật khẩu do Firebase Authentication quản lý.</div><div class="err-text" id="password-error" hidden></div></div>
    <div class="field"><label for="password-confirm">Xác nhận mật khẩu</label><div class="input-wrap"><input class="input" id="password-confirm" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu"><button type="button" class="eye" data-password="password-confirm" aria-label="Hiện mật khẩu">${A.icon("eye")}</button></div><div class="err-text" id="password-confirm-error" hidden></div></div>
    <button class="btn btn-primary btn-block btn-lg" id="submit" type="submit">Đăng ký</button>
    <div class="foot">Đã có tài khoản? <a href="login.html">Đăng nhập</a></div>
  </form></main>`;

const $ = (id) => document.getElementById(id);

function setFieldError(errorId, inputId, message) {
    const error = $(errorId);
    error.hidden = !message;
    error.innerHTML = message ? `${A.icon("err")}${message}` : "";
    $(inputId).classList.toggle("is-invalid", Boolean(message));
    return Boolean(message);
}

function setBusy(busy) {
    $("submit").disabled = busy;
    $("submit").innerHTML = busy ? '<span class="spin"></span> Đang tạo tài khoản…' : "Đăng ký";
}

function firebaseMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use": return "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.";
        case "auth/invalid-email": return "Email chưa đúng định dạng.";
        case "auth/weak-password": return "Mật khẩu chưa đáp ứng yêu cầu của Firebase.";
        case "auth/network-request-failed": return "Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại.";
        default: return "Chưa tạo được tài khoản. Vui lòng thử lại.";
    }
}

document.querySelectorAll("[data-password]").forEach((button) => {
    button.addEventListener("click", () => {
        const input = $(button.dataset.password);
        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.innerHTML = A.icon(reveal ? "eyeoff" : "eye");
    });
});

$("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("global-error").hidden = true;

    const displayName = $("name").value.trim();
    const email = $("email").value.trim();
    const password = $("password").value;
    const passwordConfirm = $("password-confirm").value;
    const hasError = [
        setFieldError("name-error", "name", displayName.length < 2 ? "Tên hiển thị tối thiểu 2 ký tự." : ""),
        setFieldError("email-error", "email", !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Email chưa đúng định dạng." : ""),
        setFieldError("password-error", "password", password.length < 8 ? "Mật khẩu tối thiểu 8 ký tự." : ""),
        setFieldError("password-confirm-error", "password-confirm", password !== passwordConfirm ? "Mật khẩu xác nhận chưa khớp." : "")
    ].some(Boolean);
    if (hasError) return;

    setBusy(true);
    try {
        await register(displayName, email, password);
        await logout();
        app.innerHTML = `<main class="login-stage register-stage"><a class="login-brand" href="../landing/landing.html"><span class="mark"><img src="../../assets/images/SVG.svg" alt=""></span><span><b>AGRISIM</b><small>GLOBAL</small></span></a><div class="auth-card register-card register-success"><div class="empty"><div class="ic" style="background:var(--success-bg);color:var(--success)">${A.icon("check")}</div><h3>Tạo tài khoản thành công</h3><p>Hãy đăng nhập để Firebase và backend xác minh phiên của bạn.</p><div class="acts"><a class="btn btn-primary" href="login.html">Đến trang đăng nhập</a></div></div></div></main>`;
    } catch (error) {
        setBusy(false);
        const banner = $("global-error");
        banner.hidden = false;
        banner.innerHTML = `${A.icon("err")}<span>${firebaseMessage(error)}</span>`;
    }
});
