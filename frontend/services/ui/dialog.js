function close(backdrop, resolve, value) {
  document.removeEventListener("keydown", backdrop.__onKey);
  backdrop.remove();
  resolve(value);
}

export function confirmDialog({ title, message, confirmLabel = "Xác nhận", tone = "primary" }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-back";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-head"><div><h3 id="dialog-title">${title}</h3></div><button class="x" type="button" data-close aria-label="Đóng">×</button></div><div class="modal-body"><p>${message}</p></div><div class="modal-foot"><button class="btn btn-outline" type="button" data-cancel>Hủy</button><button class="btn btn-${tone}" type="button" data-confirm>${confirmLabel}</button></div></section>`;
    backdrop.__onKey = (event) => { if (event.key === "Escape") close(backdrop, resolve, false); };
    document.addEventListener("keydown", backdrop.__onKey);
    document.body.append(backdrop);
    backdrop.querySelector("[data-close]").onclick = () => close(backdrop, resolve, false);
    backdrop.querySelector("[data-cancel]").onclick = () => close(backdrop, resolve, false);
    backdrop.querySelector("[data-confirm]").onclick = () => close(backdrop, resolve, true);
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(backdrop, resolve, false); });
    backdrop.querySelector("[data-confirm]").focus();
  });
}

export function alertDialog({ title = "Thông báo", message, label = "Đã hiểu" }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-back";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-head"><div><h3 id="dialog-title">${title}</h3></div><button class="x" type="button" data-close aria-label="Đóng">×</button></div><div class="modal-body"><p>${message}</p></div><div class="modal-foot"><button class="btn btn-primary" type="button" data-close>${label}</button></div></section>`;
    backdrop.__onKey = (event) => { if (event.key === "Escape" || event.key === "Enter") close(backdrop, resolve); };
    document.addEventListener("keydown", backdrop.__onKey);
    document.body.append(backdrop);
    backdrop.querySelectorAll("[data-close]").forEach((button) => { button.onclick = () => close(backdrop, resolve); });
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(backdrop, resolve); });
    backdrop.querySelector(".btn").focus();
  });
}

export function logoutDialog() {
  return new Promise((resolve) => {
    let seconds = 5;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-back";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div class="modal-head"><div><h3 id="logout-title">Xác nhận đăng xuất</h3><div class="sub">Tiến độ lượt chơi được giữ nguyên.</div></div><button class="x" type="button" data-cancel aria-label="Đóng">×</button></div><div class="modal-body"><p>Bạn có chắc muốn kết thúc phiên đăng nhập này?</p><p class="help" data-countdown>Vui lòng đọc xác nhận trong ${seconds} giây.</p></div><div class="modal-foot"><button class="btn btn-outline" type="button" data-cancel>Ở lại</button><button class="btn btn-danger" type="button" data-confirm disabled>Đăng xuất (${seconds})</button></div></section>`;
    let timer;
    const finish = (value) => { clearInterval(timer); close(backdrop, resolve, value); };
    const confirm = backdrop.querySelector("[data-confirm]"), countdown = backdrop.querySelector("[data-countdown]");
    timer = setInterval(() => { seconds -= 1; if (seconds <= 0) { clearInterval(timer); confirm.disabled = false; confirm.textContent = "Đăng xuất"; countdown.textContent = "Bạn có thể xác nhận đăng xuất hoặc ở lại."; } else { confirm.textContent = `Đăng xuất (${seconds})`; countdown.textContent = `Vui lòng đọc xác nhận trong ${seconds} giây.`; } }, 1000);
    backdrop.__onKey = (event) => { if (event.key === "Escape") finish(false); };
    document.addEventListener("keydown", backdrop.__onKey);
    document.body.append(backdrop);
    backdrop.querySelectorAll("[data-cancel]").forEach((button) => { button.onclick = () => finish(false); });
    confirm.onclick = () => finish(true);
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) finish(false); });
    backdrop.querySelector("[data-cancel]").focus();
  });
}

export function openNoticeDrawer({ round = "" } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "drawer-back";
    backdrop.innerHTML = `<aside class="notice-drawer" role="dialog" aria-modal="true" aria-labelledby="notice-title"><header class="drawer-head"><div><p class="eyebrow">THỊ TRƯỜNG · ${round ? `VÒNG ${round}` : "CẬP NHẬT"}</p><h2 id="notice-title">Thông báo thị trường</h2><p>Diễn biến của lượt chơi hiện tại</p></div><button class="x" type="button" data-close aria-label="Đóng">×</button></header><div class="drawer-content"><section class="drawer-notice"><span class="notice-label">Diễn biến thị trường</span><strong>Đại dịch toàn cầu</strong><p>Giá hàng hóa và chi phí logistics thay đổi theo kịch bản từng vòng.</p></section><section class="drawer-tip"><b>Gợi ý giao dịch</b><p>So sánh giá tại Châu Á và Châu Âu trước khi bán hoặc gửi hàng.</p></section><button class="btn btn-outline btn-block" type="button" data-close>Đã hiểu</button></div></aside>`;
    const finish = () => { document.removeEventListener("keydown", backdrop.__onKey); backdrop.remove(); resolve(); };
    backdrop.__onKey = (event) => { if (event.key === "Escape") finish(); };
    document.addEventListener("keydown", backdrop.__onKey);
    document.body.append(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("is-open"));
    backdrop.querySelectorAll("[data-close]").forEach((button) => { button.onclick = finish; });
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) finish(); });
    backdrop.querySelector(".x").focus();
  });
}

export function numberDialog({ title, message, label, initial, min, max, confirmLabel = "Tiếp tục" }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-back";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-head"><div><h3 id="dialog-title">${title}</h3><div class="sub">${message}</div></div><button class="x" type="button" data-close aria-label="Đóng">×</button></div><div class="modal-body"><div class="field"><label for="dialog-number">${label}</label><input id="dialog-number" class="input num" inputmode="decimal" min="${min}" max="${max}" value="${initial}"><div class="help">Từ ${min.toLocaleString("vi-VN")} đến ${max.toLocaleString("vi-VN")}</div><div class="err-text" data-error hidden></div></div></div><div class="modal-foot"><button class="btn btn-outline" type="button" data-cancel>Hủy</button><button class="btn btn-primary" type="button" data-confirm>${confirmLabel}</button></div></section>`;
    const validate = () => {
      const input = backdrop.querySelector("#dialog-number"), error = backdrop.querySelector("[data-error]");
      const value = Number(input.value);
      if (!Number.isFinite(value) || value <= 0 || value < min || value > max) { error.hidden = false; error.textContent = `Nhập số hợp lệ từ ${min.toLocaleString("vi-VN")} đến ${max.toLocaleString("vi-VN")}.`; return null; }
      return value;
    };
    backdrop.__onKey = (event) => { if (event.key === "Escape") close(backdrop, resolve, null); if (event.key === "Enter") { const value = validate(); if (value !== null) close(backdrop, resolve, value); } };
    document.addEventListener("keydown", backdrop.__onKey);
    document.body.append(backdrop);
    backdrop.querySelector("[data-close]").onclick = () => close(backdrop, resolve, null);
    backdrop.querySelector("[data-cancel]").onclick = () => close(backdrop, resolve, null);
    backdrop.querySelector("[data-confirm]").onclick = () => { const value = validate(); if (value !== null) close(backdrop, resolve, value); };
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(backdrop, resolve, null); });
    backdrop.querySelector("#dialog-number").select();
    backdrop.querySelector("#dialog-number").focus();
  });
}
