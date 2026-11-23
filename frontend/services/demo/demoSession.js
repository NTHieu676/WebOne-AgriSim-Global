const KEY = "agrisim.demo-session.v1";
const ROUNDS = [
  { RICE: { CHAU_A: 10, CHAU_AU: 13 }, GOLD: { CHAU_A: 42, CHAU_AU: 47 } },
  { RICE: { CHAU_A: 11, CHAU_AU: 14 }, GOLD: { CHAU_A: 43, CHAU_AU: 48 } },
  { RICE: { CHAU_A: 12, CHAU_AU: 15 }, GOLD: { CHAU_A: 44, CHAU_AU: 49 } },
  { RICE: { CHAU_A: 9, CHAU_AU: 12 }, GOLD: { CHAU_A: 41, CHAU_AU: 46 } },
  { RICE: { CHAU_A: 13, CHAU_AU: 16 }, GOLD: { CHAU_A: 45, CHAU_AU: 51 } },
  { RICE: { CHAU_A: 14, CHAU_AU: 17 }, GOLD: { CHAU_A: 47, CHAU_AU: 53 } }
];

const now = () => new Date().toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const bodyOf = (options) => {
  if (!options?.body) return {};
  try { return typeof options.body === "string" ? JSON.parse(options.body) : options.body; } catch { return {}; }
};

export function isDemoSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null")?.mode === "demo"; } catch { return false; }
}

export function getDemoSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; }
}

function save(session) { sessionStorage.setItem(KEY, JSON.stringify(session)); return session; }

export function startDemoSession() {
  return save({
    mode: "demo",
    profile: { uid: "demo-local", displayName: "Nông dân dùng thử", email: "" },
    game: null,
    plots: [], lots: [], shipments: [],
    pools: [
      { asset: "RICE", assetReserve: 1200, usdgReserve: 14400, feeRate: 0.003 },
      { asset: "GOLD", assetReserve: 300, usdgReserve: 13500, feeRate: 0.003 }
    ],
    history: []
  });
}

export function clearDemoSession() { sessionStorage.removeItem(KEY); }
export function getRuntimeProfile() { return getDemoSession()?.profile || null; }

function state() { const value = getDemoSession(); if (!value) throw error("Phiên dùng thử đã kết thúc. Hãy bắt đầu lại.", 401); return value; }
function event(session, type, fields = {}) { session.history.unshift({ id: `demo-${Date.now()}-${session.history.length}`, type, round: session.game?.currentRound || 1, createdAt: now(), ...fields }); }
function prices(round) { return ROUNDS[Math.max(0, Math.min(ROUNDS.length - 1, Number(round || 1) - 1))]; }
function activeGame(session) { if (!session.game) throw error("Bạn chưa khởi tạo lượt chơi.", 404); return session.game; }
function dashboard(session) {
  const game = session.game;
  if (!game) return null;
  return { game: clone(game), plots: clone(session.plots), lots: clone(session.lots), shipments: clone(session.shipments), pools: clone(session.pools), recentHistory: clone(session.history.slice(0, 8)) };
}
function qualityLot(asset, quantity, region, round) {
  return { id: `lot-demo-${Date.now()}`, asset, quantity: Number(quantity), qualityPercent: 100, region, status: "AVAILABLE", receivedRound: round, createdAt: now() };
}
function totalAmount(list, asset) { return list.filter((item) => item.asset === asset && item.status === "AVAILABLE").reduce((sum, item) => sum + Number(item.quantity || 0), 0); }

export async function demoRequest(endpoint, options = {}) {
  const session = state();
  const request = bodyOf(options);
  const method = (options.method || "GET").toUpperCase();
  const game = session.game;

  if (/^\/config\/rounds\/\d+$/.test(endpoint)) {
    const round = Number(endpoint.split("/").pop());
    return { success: true, data: { round, prices: prices(round) } };
  }
  if (endpoint === "/player/profile") return { success: true, data: clone(session.profile) };
  if (endpoint === "/game" && method === "GET") return { success: true, data: clone(game) };
  if (endpoint === "/game/dashboard") return { success: true, data: dashboard(session) };
  if (endpoint === "/game/start" && method === "POST") {
    if (game) throw error("Tài khoản đã có lượt chơi.", 409);
    if (!request.region) throw error("Hãy chọn khu vực khởi đầu.");
    session.game = { id: "demo-game", status: "ACTIVE", currentRound: 1, startRegion: request.region, walletUsdG: 2000, totalTopups: 0, initialWalletUsdG: 2000, createdAt: now() };
    session.plots = [{ id: "plot-1", status: "EMPTY" }];
    event(session, "GAME_STARTED", { asset: "USDG", usdDelta: 2000 });
    save(session);
    return { success: true, data: clone(session.game) };
  }
  if (!game) throw error("Bạn chưa khởi tạo lượt chơi.", 404);
  if (endpoint === "/plots" && method === "GET") return { success: true, data: { currentRound: game.currentRound, status: game.status, plots: clone(session.plots) } };
  if (endpoint === "/game/history" || endpoint.startsWith("/game/history?")) {
    const type = new URLSearchParams(endpoint.split("?")[1] || "").get("type");
    return { success: true, data: clone(type ? session.history.filter((item) => item.type === type) : session.history) };
  }
  if (endpoint === "/game/advance" && method === "POST") {
    if (game.status !== "ACTIVE") throw error("Lượt chơi đã kết thúc.", 409);
    if (Number(request.expectedRound) !== Number(game.currentRound)) throw error("Dữ liệu vòng đã thay đổi. Hãy thử lại.", 409);
    if (game.currentRound >= 6) throw error("Đây là vòng cuối cùng. Hãy kết thúc lượt chơi.", 409);
    game.currentRound += 1;
    session.plots.forEach((plot) => { if (plot.status === "GROWING" && Number(plot.readyRound) <= game.currentRound) plot.status = "READY"; });
    session.shipments.forEach((shipment) => { if (shipment.status === "IN_TRANSIT" && Number(shipment.arrivalRound) <= game.currentRound) { shipment.status = "ARRIVED"; session.lots.push(qualityLot(shipment.asset, shipment.quantity, shipment.destination, game.currentRound)); event(session, "SHIPMENT_ARRIVED", { asset: shipment.asset, quantity: shipment.quantity }); } });
    event(session, "ROUND_ADVANCED"); save(session);
    return { success: true, data: clone(game) };
  }
  if (endpoint === "/game/finish" && method === "POST") { game.status = "FINISHED"; event(session, "GAME_FINISHED"); save(session); return { success: true, data: clone(game) }; }
  if (endpoint === "/game/summary") {
    const remainingLots = session.lots.filter((lot) => lot.status === "AVAILABLE" && Number(lot.quantity) > 0);
    const warehouseValue = remainingLots.reduce((sum, lot) => sum + Number(lot.quantity) * Number(prices(6)[lot.asset]?.[lot.region] || 0) * Number(lot.qualityPercent || 100) / 100, 0);
    const totalShippingFeesUsd = Math.abs(session.history.filter((item) => item.type === "SHIPPED").reduce((sum, item) => sum + Number(item.usdDelta || 0), 0));
    const totalSwapFeesUsdEquivalent = 0;
    const endNetWorth = Number(game.walletUsdG) + warehouseValue;
    return { success: true, data: { walletUsdG: game.walletUsdG, warehouseValue, totalTopups: Number(game.totalTopups || 0), totalSwapFeesUsdEquivalent, totalShippingFeesUsd, remainingLots: clone(remainingLots), endNetWorth, netChange: endNetWorth - Number(game.initialWalletUsdG || 2000) - Number(game.totalTopups || 0), transactionCount: session.history.length } };
  }
  if (endpoint === "/game/restart" && method === "POST") {
    session.game = null; session.plots = []; session.lots = []; session.shipments = []; session.history = []; save(session);
    return demoRequest("/game/start", { method: "POST", body: JSON.stringify({ region: request.region || "CHAU_A" }) });
  }
  if (endpoint === "/game/topup" && method === "POST") { const amount = Number(request.amount); if (!Number.isInteger(amount) || amount < 100) throw error("Số USDG nạp chưa hợp lệ."); game.walletUsdG += amount; game.totalTopups += amount; event(session, "TOPPED_UP", { asset: "USDG", usdDelta: amount }); save(session); return { success: true, data: clone(game) }; }
  if (endpoint === "/plots/buy" && method === "POST") { if (session.plots.length >= 4) throw error("Bạn đã có đủ 4 ô ruộng."); if (game.walletUsdG < 300) throw error("Không đủ USDG để mua ô ruộng."); game.walletUsdG -= 300; session.plots.push({ id: `plot-${session.plots.length + 1}`, status: "EMPTY" }); event(session, "PLOT_PURCHASED", { usdDelta: -300 }); save(session); return { success: true, data: clone(session.plots) }; }
  const plant = endpoint.match(/^\/plots\/([^/]+)\/plant$/);
  if (plant && method === "POST") { const plot = session.plots.find((item) => item.id === decodeURIComponent(plant[1])); if (!plot || plot.status !== "EMPTY") throw error("Ô ruộng này chưa sẵn sàng gieo.", 409); if (game.walletUsdG < 100) throw error("Không đủ 100 USDG để trồng lúa."); game.walletUsdG -= 100; plot.status = "GROWING"; plot.plantedRound = game.currentRound; plot.readyRound = game.currentRound + 1; event(session, "PLANTED", { usdDelta: -100 }); save(session); return { success: true, data: clone(plot) }; }
  const harvest = endpoint.match(/^\/plots\/([^/]+)\/harvest$/);
  if (harvest && method === "POST") { const plot = session.plots.find((item) => item.id === decodeURIComponent(harvest[1])); if (!plot || plot.status !== "READY") throw error("Lúa chưa sẵn sàng thu hoạch.", 409); plot.status = "EMPTY"; delete plot.plantedRound; delete plot.readyRound; const lot = qualityLot("RICE", 20, game.startRegion, game.currentRound); session.lots.push(lot); event(session, "HARVESTED", { asset: "RICE", quantity: 20 }); save(session); return { success: true, data: clone(lot) }; }
  if (endpoint === "/pool/quote" && method === "POST") {
    const pool = session.pools.find((item) => item.asset === request.asset); const amount = Number(request.quantityIn); if (!pool || !amount || amount <= 0) throw error("Dữ liệu báo giá chưa hợp lệ."); const fee = amount * Number(pool.feeRate); const amountOut = request.direction === "BUY" ? (amount - fee) * (pool.assetReserve / pool.usdgReserve) : (amount - fee) * (pool.usdgReserve / pool.assetReserve); return { success: true, data: { asset: request.asset, direction: request.direction, amountIn: amount, amountOut: Math.max(0, amountOut), fee } };
  }
  if (endpoint === "/pool/swap" && method === "POST") {
    const quote = (await demoRequest("/pool/quote", { method: "POST", body: JSON.stringify(request) })).data; const pool = session.pools.find((item) => item.asset === request.asset);
    if (request.direction === "BUY") { if (game.walletUsdG < Number(request.quantityIn)) throw error("Không đủ USDG."); game.walletUsdG -= Number(request.quantityIn); pool.usdgReserve += Number(request.quantityIn); pool.assetReserve -= quote.amountOut; session.lots.push(qualityLot(request.asset, quote.amountOut, request.targetRegion || game.startRegion, game.currentRound)); event(session, "SWAPPED", { asset: request.asset, quantity: quote.amountOut, usdDelta: -Number(request.quantityIn) }); }
    else { const lot = session.lots.find((item) => item.id === request.lotId && item.status === "AVAILABLE"); if (!lot || Number(lot.quantity) < Number(request.quantityIn)) throw error("Lô hàng không đủ số lượng."); lot.quantity -= Number(request.quantityIn); if (!lot.quantity) lot.status = "SWAPPED"; game.walletUsdG += quote.amountOut; pool.assetReserve += Number(request.quantityIn); pool.usdgReserve -= quote.amountOut; event(session, "SWAPPED", { asset: request.asset, quantity: -Number(request.quantityIn), usdDelta: quote.amountOut }); }
    save(session); return { success: true, data: clone(quote) };
  }
  const sell = endpoint.match(/^\/market\/lots\/([^/]+)\/sell$/);
  if (sell && method === "POST") { const lot = session.lots.find((item) => item.id === decodeURIComponent(sell[1]) && item.status === "AVAILABLE"); const quantity = Number(request.quantity); if (!lot || quantity <= 0 || quantity > lot.quantity) throw error("Số lượng bán không hợp lệ."); const value = quantity * Number(prices(game.currentRound)[lot.asset][lot.region]) * Number(lot.qualityPercent || 100) / 100; lot.quantity -= quantity; if (!lot.quantity) lot.status = "SOLD"; game.walletUsdG += value; event(session, "SOLD", { asset: lot.asset, quantity: -quantity, usdDelta: value }); save(session); return { success: true, data: { revenueUsdG: value } }; }
  const ship = endpoint.match(/^\/market\/lots\/([^/]+)\/ship$/);
  if (ship && method === "POST") { const lot = session.lots.find((item) => item.id === decodeURIComponent(ship[1]) && item.status === "AVAILABLE"); const quantity = Number(request.quantity); if (!lot || quantity <= 0 || quantity > lot.quantity || !request.destination) throw error("Dữ liệu chuyến hàng không hợp lệ."); const fee = 15; if (game.walletUsdG < fee) throw error("Không đủ USDG trả phí vận chuyển."); lot.quantity -= quantity; if (!lot.quantity) lot.status = "SHIPPED"; game.walletUsdG -= fee; const shipment = { id: `shipment-demo-${Date.now()}`, asset: lot.asset, quantity, qualityPercent: lot.qualityPercent, origin: lot.region, destination: request.destination, sentRound: game.currentRound, arrivalRound: game.currentRound + 1, shippingFeeUsd: fee, status: "IN_TRANSIT" }; session.shipments.push(shipment); event(session, "SHIPPED", { asset: lot.asset, quantity: -quantity, usdDelta: -fee }); save(session); return { success: true, data: clone(shipment) }; }
  throw error(`Tính năng dùng thử chưa hỗ trợ ${endpoint}.`, 404);
}
