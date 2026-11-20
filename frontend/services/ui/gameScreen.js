import { apiRequest } from "../api/apiClient.js";

export const A = window.AgriSim;
export const fmt = (n) => Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export async function gameData() {
  const result = await apiRequest("/game/dashboard");
  if (!result.data) window.location.replace(new URL("../../pages/game/startgame.html", import.meta.url));
  if (result.data?.game?.status === "FINISHED") window.location.replace(new URL("../../pages/game/endgame.html", import.meta.url));
  return result.data;
}
export function shell(active, title, sub, body) {
  const links = [["home","Trang chủ","home","../dashboard/dashboard.html"],["farm","Nông trại","sprout","../farm/farm.html"],["inventory","Kho hàng","box","../inventory/inventory.html"],["pool","Trao đổi","swap","../pool/pool.html"],["market","Thị trường & Vận chuyển","truck","../market/market.html"],["profile","Hồ sơ & Ngân hàng","bank","../profile/profile.html"]];
  const nav = links.map(([id,label,icon,href]) => `<a ${id===active?'aria-current="page"':''} href="${href}">${A.icon(icon)}<span>${label}</span></a>`).join("");
  return `<aside class="sidebar"><a class="brand" href="../dashboard/dashboard.html"><span class="mark">${A.icon("leaf")}</span><div><b>AGRISIM</b><small>GLOBAL</small></div></a><nav class="nav">${nav}</nav><button class="sidebar-logout" type="button" data-logout>${A.icon("logout")}<span>Đăng xuất</span></button></aside><main class="main"><header class="topbar"><div class="ttl"><h1>${title}</h1><p>${sub}</p></div></header><section class="content">${body}</section></main><nav class="tabbar">${links.slice(0,5).map(([id,label,icon,href])=>`<a ${id===active?'aria-current="page"':''} href="${href}">${A.icon(icon)}<span>${label}</span></a>`).join("")}</nav>`;
}
