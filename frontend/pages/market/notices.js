import { A, gameData, shell } from "../../services/ui/gameScreen.js";

const app = document.getElementById("app");
app.className = "shell";
app.innerHTML = '<main class="main"><section class="content"><div class="skel" style="height:360px;border-radius:24px"></div></section></main>';

try {
  const { game } = await gameData();
  const notices = [
    ["Khởi động mùa vụ", "Chọn khu vực và gieo lúa để bắt đầu lượt chơi."],
    ["Thị trường biến động", "Giá hàng hóa thay đổi theo từng vòng và theo khu vực."],
    ["Vận chuyển liên khu vực", "Chuyến hàng sẽ xuất hiện tại Thị trường khi API vận chuyển được mở."],
    ["Cập nhật pool thanh khoản", "Kiểm tra phí và dự trữ trước khi xác nhận trao đổi."],
    ["Giai đoạn cuối mùa", "Cân nhắc số dư và hàng tồn trước vòng cuối."],
    ["Tổng kết mùa vụ", "Bảng tổng kết sẽ mở khi lượt chơi hoàn thành."]
  ];
  const body = `<div class="card"><div class="notice-list">${notices.map(([title, detail], index) => { const round = index + 1; const current = round === game.currentRound; const locked = round > game.currentRound; return `<div class="notice-row ${current ? "cur" : ""} ${locked ? "lock" : ""}"><span class="r">Vòng ${round}</span><div style="flex:1"><b>${locked ? "Chưa mở" : title}${current ? ' <span class="badge b-warning" style="margin-left:6px">Hiện tại</span>' : ""}</b><span>${locked ? "Thông báo này sẽ hiển thị khi bạn chuyển tới vòng tương ứng." : detail}</span></div>${locked ? A.icon("lock") : ""}</div>`; }).join("")}</div></div>`;
  app.innerHTML = shell("market", "Thông báo thị trường", "Các cập nhật được mở dần theo tiến trình mùa vụ.", body);
} catch (error) {
  app.className = "auth";
  app.innerHTML = `<div class="auth-card"><h1>Chưa tải được Thông báo</h1><div class="banner banner-error">${A.icon("err")}<span>Không kết nối được API.</span></div><a class="btn btn-primary" href="market.html">Về Thị trường</a></div>`;
}
