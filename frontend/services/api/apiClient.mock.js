/* Backend adapter used by every ZIP page. No game state is written to localStorage. */
(function (w) {
  var A = w.AgriSim = w.AgriSim || {};
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API_BASE = isLocal ? location.protocol + "//" + location.hostname + ":3000/api" : "https://webone-agrisim-global.onrender.com/api";
  var requestSequence = 0;
  function requestId() { requestSequence += 1; return "web-" + Date.now() + "-" + requestSequence; }
  function request(endpoint, options) {
    options = options || {};
    if (A.auth.isDemo && A.auth.isDemo()) return A.auth.demoRequest(endpoint, options).then(function (payload) { return payload.data; });
    function send(token) {
      var headers = Object.assign({ "Content-Type": "application/json", Authorization: "Bearer " + token }, options.headers || {});
      return fetch(API_BASE + endpoint, { method: options.method || "GET", headers: headers, body: options.body == null ? undefined : JSON.stringify(options.body) });
    }
    return A.auth.ready().then(function () { return A.auth.token(options.forceTokenRefresh); }).then(function (token) {
      return send(token).then(function (response) { return response.status === 401 && !options.forceTokenRefresh ? A.auth.token(true).then(send) : response; });
    }).then(function (response) {
      return response.text().then(function (text) { var payload; try { payload = text ? JSON.parse(text) : {}; } catch (_) { payload = { message: text }; } if (!response.ok) { var error = new Error(translateError(payload.message, response.status)); error.status = response.status; error.serverMessage = payload.message || ""; throw error; } return payload.data; });
    }, function (error) {
      if (!(error instanceof TypeError)) throw error; // fetch() chỉ ném TypeError khi mất kết nối
      throw Object.assign(new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."), { code: "NETWORK", cause: error });
    });
  }

  /* Lỗi backend (tiếng Anh) -> câu tiếng Việt cho người chơi. Câu nào đã là tiếng Việt (chế độ dùng thử) thì giữ nguyên. */
  var ERROR_VI = {
    "A game already exists for this player": "Tài khoản đã có lượt chơi.",
    "A target region is required": "Hãy chọn khu vực nhận hàng.",
    "A valid requestId is required": "Yêu cầu không hợp lệ. Hãy tải lại trang rồi thử lại.",
    "Authenticated user is missing a UID": "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.",
    "Buying plots is unavailable": "Hiện không thể mua thêm ô ruộng.",
    "Configuration data not found": "Không tải được cấu hình trò chơi.",
    "Decimal values support at most 8 fractional digits": "Số lượng chỉ được tối đa 8 chữ số thập phân.",
    "Destination must differ from the lot region": "Khu vực đến phải khác khu vực hiện tại.",
    "Game is not active": "Lượt chơi đã kết thúc – bạn chỉ có thể xem.",
    "Game not found": "Chưa có lượt chơi.",
    "Game or lot not found": "Lô hàng không còn tồn tại. Đã làm mới dữ liệu.",
    "Game or plot not found": "Không tìm thấy ô ruộng.",
    "Game or pool not found": "Không tìm thấy pool giao dịch.",
    "Harvesting is unavailable": "Hiện không thể thu hoạch.",
    "Insufficient USDG for shipping": "Không đủ USDG để trả phí vận chuyển.",
    "Insufficient USDG": "Không đủ USDG để thực hiện thao tác này.",
    "Insufficient pool liquidity": "Pool không đủ thanh khoản cho giao dịch này.",
    "Invalid decimal value": "Số lượng không hợp lệ.",
    "Invalid destination": "Khu vực đến không hợp lệ.",
    "Invalid history type": "Bộ lọc lịch sử không hợp lệ.",
    "Invalid start region": "Khu vực khởi đầu không hợp lệ.",
    "Invalid swap parameters": "Thông tin swap không hợp lệ.",
    "Lot is not eligible for this swap": "Pool chỉ nhận hàng đúng loại, đủ số lượng và lúa chất lượng 100%.",
    "Lot not found": "Lô hàng không còn tồn tại. Đã làm mới dữ liệu.",
    "Market price is unavailable": "Chưa có giá thị trường cho vòng này.",
    "Maximum number of plots reached": "Bạn đã đạt số ô ruộng tối đa.",
    "Only a finished game can be restarted": "Chỉ có thể chơi lại sau khi lượt hiện tại kết thúc.",
    "Only an active game at round 6 can be finished": "Chỉ kết thúc được lượt chơi ở vòng cuối.",
    "Planting is unavailable": "Hiện không thể gieo trồng (vòng cuối hoặc lượt đã kết thúc).",
    "Plot is not empty": "Ô ruộng này không còn trống.",
    "Plot is not ready to harvest": "Ô ruộng này chưa sẵn sàng thu hoạch. Đã làm mới trạng thái.",
    "Quantity exceeds the available lot": "Không thể vượt số lượng trong kho.",
    "Round 6 must be finished, not advanced": "Đang ở vòng cuối. Hãy kết thúc lượt chơi.",
    "Round must be an integer from 1 to 6": "Vòng không hợp lệ.",
    "Scenario round not found": "Không tìm thấy dữ liệu vòng chơi.",
    "Selling is unavailable": "Hiện không thể bán hàng.",
    "Shipping is unavailable": "Hàng không kịp đến trước khi lượt chơi kết thúc.",
    "Swapping is unavailable": "Hiện không thể swap.",
    "The game has not been finished": "Lượt chơi chưa kết thúc.",
    "The game round has changed. Reload before trying again.": "Vòng chơi vừa thay đổi. Hãy tải lại rồi thử lại.",
    "This lot cannot be shipped in that quantity": "Lô hàng này không thể gửi với số lượng đó.",
    "This lot cannot be sold": "Lô hàng này không thể bán (đã hỏng hoặc không còn).",
    "Top-up amount must be an integer from 100 to 5000": "Số tiền nạp từ 100 đến 5.000 USDG, là số nguyên.",
    "Top-up is only available for an active game": "Chỉ nạp được USDG khi lượt chơi đang diễn ra.",
    "confirmReplace must be true": "Cần xác nhận thay thế lượt chơi cũ.",
    "expectedRound must be 6": "Chỉ kết thúc được lượt chơi ở vòng cuối.",
    "expectedRound must be an integer": "Dữ liệu vòng không hợp lệ. Hãy tải lại trang.",
    "quantity must be greater than zero": "Nhập số lượng lớn hơn 0.",
    "quantityIn must be greater than zero": "Nhập số lượng lớn hơn 0.",
    "requestId was already used with a different command": "Yêu cầu bị trùng. Hãy tải lại trang rồi thử lại.",
    "API endpoint not found": "Máy chủ không hỗ trợ thao tác này.",
    "Invalid JSON request body": "Dữ liệu gửi lên không hợp lệ.",
    "Origin not allowed": "Máy chủ từ chối truy cập từ địa chỉ này.",
    "Unauthorized: Missing token": "Bạn chưa đăng nhập. Hãy đăng nhập lại.",
    "Unauthorized: Invalid token": "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
    "Internal server error": "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
  };
  function translateError(message, status) {
    message = String(message || "");
    if (ERROR_VI[message]) return ERROR_VI[message];
    if (/[^\x00-\x7F]/.test(message)) return message;
    if (status === 401) return ERROR_VI["Unauthorized: Invalid token"];
    if (status === 404) return "Không tìm thấy dữ liệu. Đã làm mới trang.";
    if (status === 409) return "Dữ liệu vừa thay đổi. Hãy tải lại rồi thử lại.";
    if (status >= 500) return ERROR_VI["Internal server error"];
    return "Yêu cầu tới máy chủ không thành công.";
  }

  /* Cấu hình + kịch bản. Lỗi thì KHÔNG đánh dấu đã tải, để trang hiện lỗi kèm nút "Thử lại" thay vì giá = 0. */
  function publicGet(endpoint) {
    if (A.auth.isDemo && A.auth.isDemo()) return A.auth.demoRequest(endpoint, {}).then(function (payload) { return payload.data; });
    return fetch(API_BASE + endpoint).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) { if (!response.ok) throw Object.assign(new Error(translateError(payload.message, response.status)), { status: response.status }); return payload.data; });
    }, function () { throw Object.assign(new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."), { code: "NETWORK" }); });
  }
  function loadConfig() {
    if (A.store.hasConfig()) return Promise.resolve();
    return Promise.all([publicGet("/config"), publicGet("/config/scenario")]).then(function (items) {
      if (!items[1] || !items[1].length) throw Object.assign(new Error("Không tải được dữ liệu thị trường (giá, thông báo). Vui lòng thử lại."), { code: "CONFIG" });
      A.store.setScenario(items[0], items[1]);
    }).catch(function (error) {
      if (error.code !== "CONFIG") error.message = "Không tải được dữ liệu thị trường (giá, thông báo). " + error.message;
      throw error;
    });
  }
  function refresh() {
    return Promise.all([request("/game/dashboard"), request("/game/history")]).then(function (items) {
      var game = A.store.normalizeDashboard(items[0], items[1]);
      if (!game || game.status !== "ended") return game;
      return request("/game/summary").then(function (summary) { return A.store.applySummary(game, summary); }, function () { return game; });
    }).then(function (game) { A.store.set(game); return game; }).catch(function (error) { if (error.status === 404) { A.store.set(null); return null; } throw error; });
  }
  A.api = {
    getGame: function () { return Promise.all([loadConfig(), refresh(), request("/player/profile")]).then(function (items) { return items[1]; }); },
    startGame: function (uiRegion) { var region = uiRegion === "europe" ? "CHAU_AU" : "CHAU_A"; var restarting = A.store.hasRestartIntent() || (A.store.peek() && A.store.peek().status === "ended"); var endpoint = restarting ? "/game/restart" : "/game/start"; var body = restarting ? { region: region, confirmReplace: true, requestId: requestId() } : { region: region }; return request(endpoint, { method: "POST", body: body }).then(function () { A.store.setRestartIntent(false); return A.api.getGame(); }); },
    replay: function () { A.store.setRestartIntent(true); A.store.clear(); return Promise.resolve(true); },
    nextRound: function () { var game = A.store.peek(); return request("/game/advance", { method: "POST", body: { expectedRound: game && game.round, requestId: requestId() } }).then(function () { return A.api.getGame(); }); },
    endGame: function () { var game = A.store.peek(); return request("/game/finish", { method: "POST", body: { expectedRound: game && game.round, requestId: requestId() } }).then(function () { return A.api.getGame(); }); },
    plant: function (id) { return request("/plots/plot-" + encodeURIComponent(id) + "/plant", { method: "POST", body: { requestId: requestId() } }); },
    harvest: function (id) { return request("/plots/plot-" + encodeURIComponent(id) + "/harvest", { method: "POST", body: { requestId: requestId() } }); },
    buyPlot: function () { return request("/plots/buy", { method: "POST", body: { requestId: requestId() } }); },
    topup: function (amount) { return request("/game/topup", { method: "POST", body: { amount: Number(amount), requestId: requestId() } }); },
    sell: function (lotId, quantity) { return request("/market/lots/" + encodeURIComponent(A.store.lotApiId(lotId)) + "/sell", { method: "POST", body: { quantity: Number(quantity), requestId: requestId() } }).then(function (data) { return { revenue: Number(data.revenueUsdG || data.revenue || 0) }; }); },
    ship: function (lotId, quantity, uiDestination) { var destination = uiDestination === "europe" ? "CHAU_AU" : "CHAU_A"; return request("/market/lots/" + encodeURIComponent(A.store.lotApiId(lotId)) + "/ship", { method: "POST", body: { quantity: Number(quantity), destination: destination, requestId: requestId() } }).then(function (data) {
      // Làm mới để gán nhãn T-xxxx cho chuyến vừa tạo (toast hiển thị "Chuyến T-0001").
      return refresh().catch(function () { return null; }).then(function () { return { id: A.store.shipLabel(data.shipmentId) || "mới", fee: data.shippingFeeUsd }; });
    }); },
    swap: function (input) { var target = input.region || (A.store.peek() && A.store.peek().startRegion); var body = { asset: input.type === "gold" ? "GOLD" : "RICE", direction: input.dir === "buy" ? "BUY" : "SELL", quantityIn: Number(input.dir === "buy" ? input.usdg : input.qty), lotId: input.lotId ? A.store.lotApiId(input.lotId) : null, targetRegion: input.dir === "buy" ? (target === "europe" ? "CHAU_AU" : "CHAU_A") : null, requestId: requestId() }; return request("/pool/swap", { method: "POST", body: body }).then(function (data) { return { out: Number(data.amountOut || 0), fee: Number(data.fee || 0) }; }); },
    payments: function () { return payments.list(); },
    createPayment: function (order) { return payments.create(order); },
    settlePayment: function (id, result, reason) { return payments.settle(id, result, reason); }
  };

  /*
   * Cổng thanh toán GIẢ LẬP (components/payment/payment.js).
   * Đơn nạp chỉ là bản ghi phía trình duyệt: pending -> paid | failed | expired | cancelled.
   * Chỉ khi đơn chuyển sang 'paid' mới gọi POST /game/topup; requestId = mã đơn nên
   * thử lại sau lỗi mạng cũng không bị cộng tiền hai lần (backend xử lý idempotent).
   */
  var payments = (function () {
    function fail(code, message) { var error = new Error(message); error.code = code; return error; }
    function key() { var uid = A.store.session(); return uid ? "agrisim.payments." + uid : null; }
    function load() { var k = key(); if (!k) return { seq: 0, orders: [] }; try { return JSON.parse(localStorage.getItem(k)) || { seq: 0, orders: [] }; } catch (_) { return { seq: 0, orders: [] }; } }
    function save(db) { var k = key(); if (k) localStorage.setItem(k, JSON.stringify(db)); }
    function expire(order) { if (order.status === "pending" && Date.now() > order.expiresAt) order.status = "expired"; return order; }
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function wait(value) { return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, 350); }); }
    function wallet() { var game = A.store.peek(); return game ? game.usdg : 0; }
    return {
      list: function () { return load().orders.map(function (order) { return expire(clone(order)); }); },
      create: function (input) {
        var amount = Number(input.amount), C = A.CFG;
        if (!(amount >= C.topupMin && amount <= C.topupMax && amount % 100 === 0)) return Promise.reject(fail("BAD_AMOUNT", "Số tiền nạp từ 100 đến 5.000 USDG, là bội số của 100."));
        if (!A.PAY_METHODS[input.method]) return Promise.reject(fail("BAD_METHOD", "Phương thức thanh toán không hợp lệ."));
        var game = A.store.peek();
        if (!game || game.status !== "playing") return Promise.reject(fail("ENDED", "Chỉ nạp được USDG khi lượt chơi đang diễn ra."));
        var db = load(); db.seq += 1; db.orders.forEach(expire);
        var order = {
          id: "P-" + String(db.seq).padStart(4, "0"), code: "AGS" + String(1000 + db.seq * 37 + Math.floor(Math.random() * 900)),
          amount: amount, method: input.method, bank: input.bank || "", status: "pending", reason: "",
          createdAt: Date.now(), expiresAt: Date.now() + C.qrTtlSec * 1000, round: game.round, requestId: requestId()
        };
        db.orders.unshift(order); db.orders = db.orders.slice(0, 20); save(db);
        return wait(clone(order));
      },
      settle: function (id, result, reason) {
        var db = load(), order = db.orders.filter(function (item) { return item.id === id; })[0];
        if (!order) return Promise.reject(fail("NO_ORDER", "Không tìm thấy giao dịch."));
        if (order.status === "paid") return Promise.reject(fail("ALREADY_PAID", "Giao dịch này đã được ghi nhận, sẽ không cộng tiền lần nữa."));
        expire(order);
        if (order.status !== "pending") { save(db); return Promise.reject(fail("ORDER_CLOSED", "Giao dịch đã đóng (" + order.status + "). Vui lòng tạo giao dịch mới.")); }
        if (result !== "success") {
          order.status = result === "expired" ? "expired" : result === "cancelled" ? "cancelled" : "failed";
          order.reason = reason || ""; save(db);
          return wait({ order: clone(order), usdg: wallet() });
        }
        // Ngân hàng giả lập xác nhận thành công -> ghi nhận vào lượt chơi thật.
        return request("/game/topup", { method: "POST", body: { amount: order.amount, requestId: order.requestId } }).then(function (data) {
          var latest = load(), saved = latest.orders.filter(function (item) { return item.id === id; })[0] || order;
          saved.status = "paid"; saved.paidAt = Date.now(); save(latest);
          return { order: clone(saved), usdg: Number(data && data.walletUsdG != null ? data.walletUsdG : wallet() + order.amount) };
        });
      }
    };
  })();
})(window);
