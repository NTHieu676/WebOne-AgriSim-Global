const KEY = "agrisim.demo-session.v1";
/* Đồng bộ với backend/sqlite/seed.sql (scenario_rounds) để phần xem trước của UI khớp với tài khoản mẫu. */
const ROUNDS = [
  { RICE: { CHAU_A: 10, CHAU_AU: 9 }, GOLD: { CHAU_A: 100, CHAU_AU: 100 }, shippingMultiplier: 1 },
  { RICE: { CHAU_A: 10, CHAU_AU: 9 }, GOLD: { CHAU_A: 102, CHAU_AU: 101 }, shippingMultiplier: 1 },
  { RICE: { CHAU_A: 13, CHAU_AU: 15 }, GOLD: { CHAU_A: 115, CHAU_AU: 118 }, shippingMultiplier: 2.5 },
  { RICE: { CHAU_A: 14, CHAU_AU: 15 }, GOLD: { CHAU_A: 118, CHAU_AU: 120 }, shippingMultiplier: 2.5 },
  { RICE: { CHAU_A: 11, CHAU_AU: 10 }, GOLD: { CHAU_A: 108, CHAU_AU: 106 }, shippingMultiplier: 1 },
  { RICE: { CHAU_A: 10, CHAU_AU: 9 }, GOLD: { CHAU_A: 105, CHAU_AU: 104 }, shippingMultiplier: 1 }
];
const PHASES = ["GĐ1", "GĐ1", "GĐ2", "GĐ2", "GĐ3", "GĐ3"];
const NOTICES = [
  { id: "ROUND_1", category: "INTRODUCTION", message: "Bắt đầu mô phỏng Đại dịch toàn cầu." },
  { id: "ROUND_2", category: "EARLY_WARNING", message: "Dịch lan, lương thực và vàng sắp tăng." },
  { id: "ROUND_3", category: "SURGE", message: "Biến động: giá tăng, cước vận chuyển ×2.5." },
  { id: "ROUND_4", category: "EARLY_WARNING", message: "Thị trường sắp phục hồi." },
  { id: "ROUND_5", category: "RECOVERY", message: "Biến động: giá giảm, cước trở về ×1." },
  { id: "ROUND_6", category: "FINISH_REMINDER", message: "Đây là vòng cuối, hãy chuẩn bị kết thúc lượt chơi." }
];
const DEMO_SIMULATION = {
  MAX_ROUND: 6, INITIAL_USDG: 2000, TOPUP_MIN: 100, TOPUP_MAX: 5000, INITIAL_PLOTS: 1, MAX_PLOTS: 4,
  BUY_PLOT_COST_USDG: 300, PLANT_COST_USDG: 100, HARVEST_YIELD_RICE: 20, GROWTH_ROUNDS: 1,
  RICE_QUALITY_LOSS_PP: 5, SWAP_FEE_RATE: 0.003, SHIPPING_COST_PER_UNIT: 0.5, SHIPPING_DELAY_ROUNDS: 1
};
const SHIPPING_COST_PER_UNIT = 0.5;
const RICE_QUALITY_LOSS_PP = 5;
const decay = (asset, quality) => (asset === "RICE" ? Math.max(0, Number(quality) - RICE_QUALITY_LOSS_PP) : 100);

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
      { asset: "RICE", assetReserve: 1000, usdgReserve: 10000, feeRate: 0.003 },
      { asset: "GOLD", assetReserve: 100, usdgReserve: 10000, feeRate: 0.003 }
    ],
    history: []
  });
}

export function clearDemoSession() { sessionStorage.removeItem(KEY); }
export function getRuntimeProfile() { return getDemoSession()?.profile || null; }

function state() { const value = getDemoSession(); if (!value) throw error("Phiên dùng thử đã kết thúc. Hãy bắt đầu lại.", 401); return value; }
function event(session, type, fields = {}) { session.history.unshift({ id: `demo-${Date.now()}-${session.history.length}`, type, round: session.game?.currentRound || 1, createdAt: now(), ...fields }); }
function prices(round) { return ROUNDS[Math.max(0, Math.min(ROUNDS.length - 1, Number(round || 1) - 1))]; }
function dashboard(session) {
  const game = session.game;
  if (!game) return null;
  return { game: clone(game), plots: clone(session.plots), lots: clone(session.lots), shipments: clone(session.shipments), pools: clone(session.pools), recentHistory: clone(session.history.slice(0, 8)) };
}
let lotSequence = 0;
function qualityLot(asset, quantity, region, round, qualityPercent = 100) {
  lotSequence += 1;
  return { id: `lot-demo-${Date.now()}-${lotSequence}`, asset, quantity: Number(quantity), qualityPercent, region, status: qualityPercent === 0 ? "SPOILED" : "AVAILABLE", receivedRound: round, createdAt: now() };
}

export async function demoRequest(endpoint, options = {}) {
  const session = state();
  const request = bodyOf(options);
  const method = (options.method || "GET").toUpperCase();
  const game = session.game;

  if (/^\/config\/rounds\/\d+$/.test(endpoint)) {
    const round = Number(endpoint.split("/").pop());
    return { success: true, data: { round, prices: prices(round) } };
  }
  if (endpoint === "/config") return { success: true, data: { simulation: clone(DEMO_SIMULATION) } };
  if (endpoint === "/config/scenario") return { success: true, data: ROUNDS.map((item, index) => ({ round: index + 1, phase: PHASES[index], prices: { RICE: item.RICE, GOLD: item.GOLD }, shippingMultiplier: item.shippingMultiplier, notice: NOTICES[index] })) };
  if (endpoint === "/player/profile") return { success: true, data: clone(session.profile) };
  if (endpoint === "/game" && method === "GET") return { success: true, data: clone(game) };
  if (endpoint === "/game/dashboard") return { success: true, data: dashboard(session) };
  if (endpoint === "/game/start" && method === "POST") {
    if (game) throw error("Tài khoản đã có lượt chơi.", 409);
    if (!request.region) throw error("Hãy chọn khu vực khởi đầu.");
    session.game = { id: "demo-game", status: "ACTIVE", currentRound: 1, startRegion: request.region, walletUsdG: 2000, totalTopups: 0, initialWalletUsdG: 2000, createdAt: now() };
    session.plots = [{ id: "plot-1", status: "EMPTY" }];
    event(session, "GAME_STARTED", { asset: "USDG", usdDelta: 2000, details: { startRegion: request.region } });
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
    session.lots.forEach((lot) => { if (lot.status !== "AVAILABLE") return; lot.qualityPercent = decay(lot.asset, lot.qualityPercent); if (lot.qualityPercent === 0) lot.status = "SPOILED"; });
    session.shipments.forEach((shipment) => { if (shipment.status !== "IN_TRANSIT") return; shipment.qualityPercent = decay(shipment.asset, shipment.qualityPercent); if (Number(shipment.arrivalRound) <= game.currentRound) { shipment.status = "ARRIVED"; session.lots.push(qualityLot(shipment.asset, shipment.quantity, shipment.destination, game.currentRound, shipment.qualityPercent)); event(session, "SHIPMENT_ARRIVED", { asset: shipment.asset, quantity: shipment.quantity, details: { destination: shipment.destination, shipmentId: shipment.id } }); } });
    event(session, "ROUND_ADVANCED"); save(session);
    return { success: true, data: clone(game) };
  }
  if (endpoint === "/game/finish" && method === "POST") { game.status = "FINISHED"; event(session, "GAME_FINISHED"); save(session); return { success: true, data: clone(game) }; }
  if (endpoint === "/game/summary") {
    const remainingLots = session.lots.filter((lot) => lot.status === "AVAILABLE" && Number(lot.quantity) > 0);
    const warehouseValue = remainingLots.reduce((sum, lot) => sum + Number(lot.quantity) * Number(prices(6)[lot.asset]?.[lot.region] || 0) * Number(lot.qualityPercent || 100) / 100, 0);
    const totalShippingFeesUsd = session.history.filter((item) => item.type === "SHIPPED").reduce((sum, item) => sum + Number(item.shipmentFeeUsd || 0), 0);
    const totalSwapFeesUsdEquivalent = session.history.filter((item) => item.type === "SWAPPED").reduce((sum, item) => sum + Number(item.swapFeeUsdEquivalent || 0), 0);
    const endNetWorth = Number(game.walletUsdG) + warehouseValue;
    return { success: true, data: { walletUsdG: game.walletUsdG, warehouseValue, totalTopups: Number(game.totalTopups || 0), totalSwapFeesUsdEquivalent, totalShippingFeesUsd, remainingLots: clone(remainingLots), endNetWorth, netChange: endNetWorth - Number(game.initialWalletUsdG || 2000) - Number(game.totalTopups || 0), transactionCount: session.history.length } };
  }
  if (endpoint === "/game/restart" && method === "POST") {
    session.game = null; session.plots = []; session.lots = []; session.shipments = []; session.history = []; save(session);
    return demoRequest("/game/start", { method: "POST", body: JSON.stringify({ region: request.region || "CHAU_A" }) });
  }
  if (endpoint === "/game/topup" && method === "POST") { const amount = Number(request.amount); if (!Number.isInteger(amount) || amount < 100) throw error("Số USDG nạp chưa hợp lệ."); game.walletUsdG += amount; game.totalTopups += amount; event(session, "TOPPED_UP", { asset: "USDG", usdDelta: amount, requestId: request.requestId || null, details: { amount } }); save(session); return { success: true, data: clone(game) }; }
  if (endpoint === "/plots/buy" && method === "POST") { if (session.plots.length >= 4) throw error("Bạn đã có đủ 4 ô ruộng."); if (game.walletUsdG < 300) throw error("Không đủ USDG để mua ô ruộng."); game.walletUsdG -= 300; session.plots.push({ id: `plot-${session.plots.length + 1}`, status: "EMPTY" }); event(session, "PLOT_PURCHASED", { usdDelta: -300, entityIds: [`plot-${session.plots.length}`] }); save(session); return { success: true, data: clone(session.plots) }; }
  const plant = endpoint.match(/^\/plots\/([^/]+)\/plant$/);
  if (plant && method === "POST") { const plot = session.plots.find((item) => item.id === decodeURIComponent(plant[1])); if (!plot || plot.status !== "EMPTY") throw error("Ô ruộng này chưa sẵn sàng gieo.", 409); if (game.walletUsdG < 100) throw error("Không đủ 100 USDG để trồng lúa."); game.walletUsdG -= 100; plot.status = "GROWING"; plot.plantedRound = game.currentRound; plot.readyRound = game.currentRound + 1; event(session, "PLANTED", { usdDelta: -100, entityIds: [plot.id] }); save(session); return { success: true, data: clone(plot) }; }
  const harvest = endpoint.match(/^\/plots\/([^/]+)\/harvest$/);
  if (harvest && method === "POST") { const plot = session.plots.find((item) => item.id === decodeURIComponent(harvest[1])); if (!plot || plot.status !== "READY") throw error("Lúa chưa sẵn sàng thu hoạch.", 409); plot.status = "EMPTY"; delete plot.plantedRound; delete plot.readyRound; const lot = qualityLot("RICE", 20, game.startRegion, game.currentRound); session.lots.push(lot); event(session, "HARVESTED", { asset: "RICE", quantity: 20, entityIds: [plot.id, lot.id] }); save(session); return { success: true, data: clone(lot) }; }
  if (endpoint === "/pool/quote" && method === "POST") {
    const pool = session.pools.find((item) => item.asset === request.asset); const amount = Number(request.quantityIn); if (!pool || !amount || amount <= 0) throw error("Dữ liệu báo giá chưa hợp lệ."); const fee = amount * Number(pool.feeRate); const net = amount - fee; const k = pool.assetReserve * pool.usdgReserve; /* x·y = k, giống backend swapService và UI quoteSwap */ const amountOut = request.direction === "BUY" ? pool.assetReserve - k / (pool.usdgReserve + net) : pool.usdgReserve - k / (pool.assetReserve + net); const poolPriceBefore = pool.usdgReserve / pool.assetReserve; return { success: true, data: { asset: request.asset, direction: request.direction, amountIn: amount, amountOut: Math.round(Math.max(0, amountOut) * 1e8) / 1e8, fee, poolPriceBefore } };
  }
  if (endpoint === "/pool/swap" && method === "POST") {
    const quote = (await demoRequest("/pool/quote", { method: "POST", body: JSON.stringify(request) })).data; const pool = session.pools.find((item) => item.asset === request.asset);
    if (request.direction === "BUY") { if (game.walletUsdG < Number(request.quantityIn)) throw error("Không đủ USDG."); game.walletUsdG -= Number(request.quantityIn); pool.usdgReserve += Number(request.quantityIn); pool.assetReserve -= quote.amountOut; session.lots.push(qualityLot(request.asset, quote.amountOut, request.targetRegion || game.startRegion, game.currentRound)); event(session, "SWAPPED", { asset: request.asset, quantity: quote.amountOut, usdDelta: -Number(request.quantityIn), swapFeeUsdEquivalent: quote.fee, details: { direction: "BUY", amountOut: quote.amountOut } }); }
    else { const lot = session.lots.find((item) => item.id === request.lotId && item.status === "AVAILABLE"); if (!lot || Number(lot.quantity) < Number(request.quantityIn)) throw error("Lô hàng không đủ số lượng."); lot.quantity -= Number(request.quantityIn); if (!lot.quantity) lot.status = "SWAPPED"; game.walletUsdG += quote.amountOut; pool.assetReserve += Number(request.quantityIn); pool.usdgReserve -= quote.amountOut; event(session, "SWAPPED", { asset: request.asset, quantity: Number(request.quantityIn), usdDelta: quote.amountOut, swapFeeUsdEquivalent: quote.fee * quote.poolPriceBefore, details: { direction: "SELL", amountOut: quote.amountOut } }); }
    save(session); return { success: true, data: clone(quote) };
  }
  const sell = endpoint.match(/^\/market\/lots\/([^/]+)\/sell$/);
  if (sell && method === "POST") { const lot = session.lots.find((item) => item.id === decodeURIComponent(sell[1]) && item.status === "AVAILABLE"); const quantity = Number(request.quantity); if (!lot || quantity <= 0 || quantity > lot.quantity) throw error("Số lượng bán không hợp lệ."); const value = quantity * Number(prices(game.currentRound)[lot.asset][lot.region]) * Number(lot.qualityPercent || 100) / 100; lot.quantity -= quantity; if (!lot.quantity) lot.status = "SOLD"; game.walletUsdG += value; event(session, "SOLD", { asset: lot.asset, quantity, usdDelta: value, entityIds: [lot.id], details: { region: lot.region, qualityPercent: lot.qualityPercent } }); save(session); return { success: true, data: { revenueUsdG: value } }; }
  const ship = endpoint.match(/^\/market\/lots\/([^/]+)\/ship$/);
  if (ship && method === "POST") { const lot = session.lots.find((item) => item.id === decodeURIComponent(ship[1]) && item.status === "AVAILABLE"); const quantity = Number(request.quantity); if (!lot || quantity <= 0 || quantity > lot.quantity || !request.destination) throw error("Dữ liệu chuyến hàng không hợp lệ."); if (game.currentRound > 5) throw error("Hàng không kịp đến trước khi lượt chơi kết thúc.", 409); const shippingMultiplier = Number(prices(game.currentRound).shippingMultiplier || 1); const fee = quantity * SHIPPING_COST_PER_UNIT * shippingMultiplier; if (game.walletUsdG < fee) throw error("Không đủ USDG trả phí vận chuyển."); lot.quantity -= quantity; if (!lot.quantity) lot.status = "SHIPPED"; game.walletUsdG -= fee; const shipment = { id: `shipment-demo-${Date.now()}`, asset: lot.asset, quantity, qualityPercent: lot.qualityPercent, origin: lot.region, destination: request.destination, sentRound: game.currentRound, arrivalRound: game.currentRound + 1, shippingFeeUsd: fee, status: "IN_TRANSIT" }; session.shipments.push(shipment); event(session, "SHIPPED", { asset: lot.asset, quantity, usdDelta: -fee, shipmentFeeUsd: fee, details: { origin: lot.region, destination: request.destination, arrivalRound: shipment.arrivalRound, shippingFeeUsd: fee, shipmentId: shipment.id } }); save(session); return { success: true, data: { ...clone(shipment), shipmentId: shipment.id } }; }
  throw error(`Tính năng dùng thử chưa hỗ trợ ${endpoint}.`, 404);
}
