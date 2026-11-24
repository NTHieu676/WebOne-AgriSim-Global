/*
 * Runtime adapter for the ZIP UI.
 * It keeps the UI data shape but never persists or mutates a game locally.
 * (Chỉ lưu nhãn hiển thị L-0001/T-0001 và đơn nạp giả lập ở trình duyệt; trạng thái lượt chơi luôn lấy từ backend.)
 */
(function (w) {
  var A = w.AgriSim = w.AgriSim || {};
  var S = A.store = {};
  var restartKey = "agrisim.restart-intent.v1";

  A.CFG = {
    rounds: 6, startUSDG: 2000, plantCost: 100, plantYield: 20,
    growRounds: 1, plotPrice: 300, maxPlots: 4, initPlots: 1,
    shipFeePerUnit: 0.5, shipRounds: 1, swapFee: 0.003,
    decayPerRound: 5, topupMin: 100, topupMax: 5000,
    topupSteps: [100, 500, 1000, 5000],
    qrTtlSec: 300, payMaxTry: 3
  };
  /* Cổng thanh toán giả lập (components/payment/payment.js) */
  A.PAY_METHODS = { qr: "Chuyển khoản QR", card: "Thẻ ngân hàng", wallet: "Ví AgriPay" };
  A.PAY_BANKS = ["AgriBank", "GreenBank", "SunRice Bank", "Delta Bank", "Harvest Bank"];

  var cache = null;
  var gameLoaded = false;
  var scenario = [];
  var configLoaded = false;

  /* Tiêu đề thông báo thị trường theo mã category của backend (notices.category). */
  var NOTICE_TITLES = {
    INTRODUCTION: "Thị trường bình thường",
    EARLY_WARNING: "Cảnh báo sớm",
    SURGE: "Đỉnh giá — Đại dịch toàn cầu",
    RECOVERY: "Giá hạ nhiệt",
    FINISH_REMINDER: "Vòng cuối"
  };

  function region(value) { return value === "CHAU_AU" || value === "europe" ? "europe" : "asia"; }
  function asset(value) { return String(value || "RICE").toLowerCase() === "gold" ? "gold" : "rice"; }
  function number(value, fallback) { value = Number(value); return Number.isFinite(value) ? value : (fallback || 0); }
  function round2(value) { return Math.round((number(value) + Number.EPSILON) * 100) / 100; }
  function qty(value) { value = number(value); return A.fmt ? A.fmt.num(value, value % 1 ? 2 : 0) : String(value); }
  function goodName(type) { return A.fmt ? A.fmt.good(type).toLowerCase() : type; }
  function regionName(value) { return A.fmt ? A.fmt.region(region(value)) : value; }
  function plotNo(id) { return String(id || "").replace(/^plot-/, ""); }

  function gameStateKey() { var uid = S.session(); return uid ? "agrisim.game-state." + uid : null; }
  S.session = function () { var user = A.auth && A.auth.user ? A.auth.user() : null; return user && user.uid; };
  S.peek = function () { return cache; };
  S.set = function (game) { cache = game || null; gameLoaded = true; var key = gameStateKey(); if (key) sessionStorage.setItem(key, game ? game.status : "nogame"); return cache; };
  S.clear = function () { var key = gameStateKey(); if (key) sessionStorage.removeItem(key); cache = null; gameLoaded = false; };
  S.isGameLoaded = function () { var key = gameStateKey(); return gameLoaded || !!(key && sessionStorage.getItem(key)); };
  S.persistedState = function () { var key = gameStateKey(); return key && sessionStorage.getItem(key); };
  S.hasRestartIntent = function () { return sessionStorage.getItem(restartKey) === "1"; };
  S.setRestartIntent = function (value) { if (value) sessionStorage.setItem(restartKey, "1"); else sessionStorage.removeItem(restartKey); };

  /* ---------- Cấu hình + kịch bản ---------- */
  S.setScenario = function (nextConfig, nextScenario) {
    var simulation = nextConfig && nextConfig.simulation || {};
    var map = {
      MAX_ROUND: "rounds", INITIAL_USDG: "startUSDG", PLANT_COST_USDG: "plantCost",
      HARVEST_YIELD_RICE: "plantYield", GROWTH_ROUNDS: "growRounds",
      BUY_PLOT_COST_USDG: "plotPrice", MAX_PLOTS: "maxPlots", INITIAL_PLOTS: "initPlots",
      SHIPPING_COST_PER_UNIT: "shipFeePerUnit", SHIPPING_DELAY_ROUNDS: "shipRounds",
      SWAP_FEE_RATE: "swapFee", RICE_QUALITY_LOSS_PP: "decayPerRound",
      TOPUP_MIN: "topupMin", TOPUP_MAX: "topupMax"
    };
    Object.keys(map).forEach(function (key) { if (simulation[key] != null) A.CFG[map[key]] = simulation[key]; });
    scenario = Array.isArray(nextScenario) ? nextScenario : scenario;
    configLoaded = true;
    A.NOTICES = scenario.map(function (item) { return toNotice(item); });
  };
  S.hasConfig = function () { return configLoaded; };
  function toNotice(item) {
    var notice = item && item.notice || {};
    var message = notice.message || "";
    return { t: NOTICE_TITLES[notice.category] || notice.category || "Thông báo thị trường", d: message, short: message, phase: item && item.phase || "" };
  }
  S.price = function (uiRegion, uiAsset, round) {
    var item = scenario[Math.max(0, Math.min(scenario.length - 1, Number(round || 1) - 1))];
    if (!item || !item.prices) return 0;
    var apiAsset = asset(uiAsset) === "gold" ? "GOLD" : "RICE";
    var apiRegion = region(uiRegion) === "europe" ? "CHAU_AU" : "CHAU_A";
    return number(item.prices[apiAsset] && item.prices[apiAsset][apiRegion]);
  };
  /* Cước vận chuyển theo vòng = đơn giá × hệ số kịch bản (backend: marketService.ship). */
  S.shipMultiplier = function (round) {
    var item = scenario[Math.max(0, Math.min(scenario.length - 1, Number(round || 1) - 1))];
    return item && Number(item.shippingMultiplier) > 0 ? Number(item.shippingMultiplier) : 1;
  };
  S.shipUnit = function (round) { return round2(A.CFG.shipFeePerUnit * S.shipMultiplier(round)); };
  /* Lúa giảm chất lượng mỗi vòng, kể cả khi đang trên đường (backend: roundService). */
  S.shipQuality = function (type, quality) { return asset(type) === "rice" ? Math.max(0, number(quality) - A.CFG.decayPerRound * A.CFG.shipRounds) : number(quality); };
  S.notice = function (round) {
    var item = scenario[Number(round) - 1];
    return item ? toNotice(item) : { t: "Thông báo thị trường", d: "Dữ liệu thị trường đang được tải.", short: "Dữ liệu đang được tải.", phase: "" };
  };

  /* ---------- Nhãn hiển thị ngắn cho lô / chuyến (backend dùng UUID) ---------- */
  function labelKey() { var uid = S.session(); return uid ? "agrisim.labels." + uid : null; }
  function loadLabels(generationId) {
    var key = labelKey(), labels = null;
    try { labels = key && JSON.parse(localStorage.getItem(key)); } catch (_) { labels = null; }
    if (!labels || labels.generationId !== generationId) labels = { generationId: generationId, lot: {}, ship: {}, seqLot: 0, seqShip: 0 };
    return labels;
  }
  function saveLabels(labels) { var key = labelKey(); if (key) try { localStorage.setItem(key, JSON.stringify(labels)); } catch (_) {} }
  function sortByAge(items) {
    return items.slice().sort(function (a, b) { return number(a.createdRound || a.sentRound) - number(b.createdRound || b.sentRound) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.id).localeCompare(String(b.id)); });
  }
  function assign(labels, kind, items) {
    var bucket = labels[kind], seqKey = kind === "lot" ? "seqLot" : "seqShip", prefix = kind === "lot" ? "L-" : "T-";
    sortByAge(items).forEach(function (item) { if (!bucket[item.id]) { labels[seqKey] += 1; bucket[item.id] = prefix + String(labels[seqKey]).padStart(4, "0"); } });
  }
  var lotIdByLabel = {}, currentLabels = null;
  /* UI chỉ thấy nhãn L-xxxx; adapter đổi lại thành id thật khi gọi API. */
  S.lotApiId = function (label) { return lotIdByLabel[label] || label; };
  S.shipLabel = function (apiId) { return currentLabels && currentLabels.ship[apiId] || ""; };

  /* ---------- Lịch sử: tiêu đề + chi tiết tiếng Việt ---------- */
  function paymentFor(requestId) {
    if (!requestId || !A.api || !A.api.payments) return null;
    return A.api.payments().filter(function (order) { return order.requestId === requestId; })[0] || null;
  }
  function describe(event, labels) {
    var d = event.details || {}, ids = event.entityIds || [], good = goodName(asset(event.asset)), amount = qty(Math.abs(number(event.quantity)));
    var lotLabel = function (id) { return labels.lot[id] || ""; };
    switch (event.type) {
      case "GAME_STARTED": return ["Bắt đầu lượt chơi", "Vốn ban đầu" + (d.startRegion ? " · Khu vực " + regionName(d.startRegion) : "")];
      case "PLANTED": return ["Gieo trồng lúa", "Ô ruộng #" + plotNo(ids[0])];
      case "HARVESTED": return ["Thu hoạch", "Ô ruộng #" + plotNo(ids[0]) + " · +" + amount + " lúa"];
      case "PLOT_PURCHASED": return ["Mua thêm nông trại", "Ô ruộng #" + plotNo(ids[0])];
      case "SOLD": return ["Bán hàng tại " + regionName(d.region), [lotLabel(ids[0]), amount + " " + good, d.qualityPercent != null ? "chất lượng " + d.qualityPercent + "%" : ""].filter(Boolean).join(" · ")];
      case "SHIPPED": return ["Gửi hàng sang " + regionName(d.destination), [labels.ship[ids[1] || d.shipmentId] || "", amount + " " + good, d.arrivalRound ? "đến vòng " + d.arrivalRound : ""].filter(Boolean).join(" · ")];
      case "SHIPMENT_ARRIVED": return ["Hàng đã đến kho", [labels.ship[ids[0] || d.shipmentId] || "", amount + " " + good].filter(Boolean).join(" · ")];
      case "SWAPPED":
        return d.direction === "BUY"
          ? ["Swap USDG → " + good, qty(Math.abs(number(event.usdDelta))) + " USDG → " + qty(d.amountOut != null ? d.amountOut : event.quantity) + " " + good]
          : ["Swap " + good + " → USDG", amount + " " + good];
      case "TOPPED_UP": {
        var order = paymentFor(event.requestId);
        return order ? ["Nạp USDG qua " + (A.PAY_METHODS[order.method] || "ngân hàng giả lập"), "Mã GD " + order.code + (order.bank ? " · " + order.bank : "")] : ["Nạp USDG giả lập", "Ngân hàng giả lập"];
      }
      case "ROUND_ADVANCED": return ["Chuyển vòng", "Vòng " + (d.fromRound || number(event.round) - 1) + " → " + event.round + (d.readyPlots ? " · " + d.readyPlots + " ô sẵn sàng thu hoạch" : "") + (d.arrivedShipments ? " · " + d.arrivedShipments + " chuyến hàng đến" : "")];
      case "GAME_FINISHED": return ["Kết thúc lượt chơi", d.endNetWorth != null ? "Tài sản ròng " + qty(round2(d.endNetWorth)) + " USDG" : ""];
      default: return [event.type || "Hoạt động", ""];
    }
  }
  function eventDelta(event) {
    if (event.usdDelta != null) return number(event.usdDelta);
    return event.type === "GAME_STARTED" ? number(A.CFG.startUSDG) : 0;
  }

  /* ---------- Chuẩn hoá dữ liệu backend -> dạng dữ liệu của UI zip ---------- */
  S.normalizeDashboard = function (dashboard, history) {
    if (!dashboard || !dashboard.game) return null;
    var game = dashboard.game;
    var labels = loadLabels(game.generationId || game.id || "default");
    var rawLots = (dashboard.lots || []).filter(function (lot) { return lot.status === "AVAILABLE" || !lot.status; });
    var rawShipments = (dashboard.shipments || []).filter(function (shipment) { return shipment.status === "IN_TRANSIT" || !shipment.status; });
    assign(labels, "lot", rawLots); assign(labels, "ship", rawShipments); saveLabels(labels); currentLabels = labels;
    lotIdByLabel = {};
    var plots = (dashboard.plots || []).map(function (plot) { return { id: plotNo(plot.id), status: String(plot.status || "EMPTY").toLowerCase(), plantedRound: plot.plantedRound || null, readyRound: plot.readyRound || null }; });
    var lots = sortByAge(rawLots).map(function (lot) { var label = labels.lot[lot.id]; lotIdByLabel[label] = lot.id; return { id: label, apiId: lot.id, type: asset(lot.asset), qty: number(lot.quantity), quality: number(lot.qualityPercent, 100), region: region(lot.region) }; });
    var shipments = sortByAge(rawShipments).reverse().map(function (shipment) { return { id: labels.ship[shipment.id], apiId: shipment.id, type: asset(shipment.asset), qty: number(shipment.quantity), quality: number(shipment.qualityPercent, 100), from: region(shipment.origin), to: region(shipment.destination), fee: number(shipment.shippingFeeUsd), sentRound: shipment.sentRound, arriveRound: shipment.arrivalRound }; });
    var pools = { rice: { asset: 0, usdg: 0 }, gold: { asset: 0, usdg: 0 } };
    (dashboard.pools || []).forEach(function (pool) { pools[asset(pool.asset)] = { asset: number(pool.assetReserve), usdg: number(pool.usdgReserve), feeRate: number(pool.feeRate, A.CFG.swapFee) }; });

    // Lịch sử mới nhất ở trên: số dư sau mỗi dòng = số dư dòng mới hơn − biến động của dòng mới hơn.
    var events = history || dashboard.recentHistory || [];
    var balance = number(game.walletUsdG);
    var rows = events.map(function (event) {
      var text = describe(event, labels), delta = eventDelta(event);
      var row = { id: event.id, type: event.type, round: event.round, title: text[0], detail: text[1], delta: round2(delta), balance: round2(balance) };
      balance -= delta;
      return row;
    });
    var stats = { swapFee: 0, shipFee: 0, tx: 0 };
    events.forEach(function (event) {
      if (event.type === "SWAPPED") { stats.swapFee += number(event.swapFeeUsdEquivalent); stats.tx += 1; }
      if (event.type === "SOLD") stats.tx += 1;
      if (event.type === "SHIPPED") stats.shipFee += number(event.shipmentFeeUsd != null ? event.shipmentFeeUsd : Math.abs(number(event.usdDelta)));
    });
    stats.swapFee = round2(stats.swapFee); stats.shipFee = round2(stats.shipFee);

    return { status: game.status === "FINISHED" ? "ended" : "playing", round: number(game.currentRound, 1), usdg: number(game.walletUsdG), topup: number(game.totalTopups), startRegion: region(game.startRegion), plots: plots, lots: lots, shipments: shipments, pools: pools, history: rows, stats: stats, summary: null, raw: game };
  };
  /* Số liệu backend đã chốt khi kết thúc lượt (GET /game/summary). */
  S.applySummary = function (game, summary) {
    if (!game || !summary) return game;
    game.summary = summary;
    game.stats = { swapFee: round2(summary.totalSwapFeesUsdEquivalent), shipFee: round2(summary.totalShippingFeesUsd), tx: game.stats ? game.stats.tx : 0 };
    return game;
  };

  S.derive = function (game) {
    game = game || { plots: [], lots: [], shipments: [], pools: {}, round: 1, usdg: 0, topup: 0 };
    var plots = game.plots.map(function (plot) { return Object.assign({}, plot, { status: plot.status === "growing" && game.round >= plot.readyRound ? "ready" : plot.status }); });
    var stock = { rice: 0, gold: 0 }, qualitySum = 0, qualityCount = 0, goodsValue = 0, transitValue = 0;
    game.lots.forEach(function (lot) { stock[lot.type] += lot.qty; if (lot.type === "rice" && lot.quality > 0) { qualitySum += lot.quality * lot.qty; qualityCount += lot.qty; } goodsValue += S.price(lot.region, lot.type, game.round) * lot.qty * lot.quality / 100; });
    game.shipments.forEach(function (shipment) { transitValue += S.price(shipment.to, shipment.type, game.round) * shipment.qty * shipment.quality / 100; });
    var net = round2(game.usdg + goodsValue + transitValue);
    var gain = round2(net - A.CFG.startUSDG - game.topup);
    if (game.summary) { // lượt đã kết thúc: dùng đúng con số backend đã chốt
      goodsValue = number(game.summary.warehouseValue, goodsValue); transitValue = 0;
      net = round2(game.summary.endNetWorth); gain = round2(game.summary.netChange);
    }
    return { plots: plots, stock: stock, avgQ: qualityCount ? Math.round(qualitySum / qualityCount) : 0, goodsValue: round2(goodsValue), transitValue: round2(transitValue), net: net, gain: gain, ready: plots.filter(function (plot) { return plot.status === "ready"; }), empty: plots.filter(function (plot) { return plot.status === "empty"; }), growing: plots.filter(function (plot) { return plot.status === "growing"; }), inTransit: game.shipments.length, canBuyPlot: plots.length < A.CFG.maxPlots, atMax: plots.length >= A.CFG.maxPlots };
  };
  S.quoteSwap = function (game, input) {
    var pool = game.pools[input.type], feeRate = number(pool.feeRate, A.CFG.swapFee), reserveAsset = number(pool.asset), reserveUsd = number(pool.usdg), spot = reserveUsd / reserveAsset;
    var amount = number(input.dir === "sell" ? input.qty : input.usdg), fee = amount * feeRate, netInput = amount - fee, output = input.dir === "sell" ? reserveUsd - (reserveAsset * reserveUsd) / (reserveAsset + netInput) : reserveAsset - (reserveAsset * reserveUsd) / (reserveUsd + netInput);
    output = round2(output); var effective = input.dir === "sell" ? output / amount : amount / (output || 1);
    return { inAmt: amount, fee: round2(fee), feeUnit: input.dir === "sell" ? input.type : "USDG", out: output, outUnit: input.dir === "sell" ? "USDG" : input.type, spot: spot, market: S.price(input.region || game.startRegion, input.type, game.round), eff: effective, dev: (effective - spot) / spot * 100, after: input.dir === "sell" ? game.usdg + output : game.usdg - amount };
  };
})(window);
