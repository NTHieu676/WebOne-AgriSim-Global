INSERT OR REPLACE INTO game_config (key, value_json, description) VALUES
('APP_NAME', '"AgriSim Global"', 'Tên ứng dụng'),
('APP_VERSION', '"0.1.0"', 'Phiên bản ứng dụng'),
('MAINTENANCE', 'false', 'Cờ bảo trì'),
('MAX_ROUND', '6', 'Vòng tối đa'),
('INITIAL_USDG', '2000', 'USDG khi bắt đầu lượt'),
('TOPUP_MIN', '100', 'Giá trị nạp giả lập tối thiểu'),
('TOPUP_MAX', '5000', 'Giá trị nạp giả lập tối đa'),
('INITIAL_PLOTS', '1', 'Số ô ban đầu'),
('MAX_PLOTS', '4', 'Số ô tối đa'),
('BUY_PLOT_COST_USDG', '300', 'Chi phí mua một ô'),
('PLANT_COST_USDG', '100', 'Chi phí trồng một ô'),
('HARVEST_YIELD_RICE', '20', 'Sản lượng lúa thu hoạch'),
('GROWTH_ROUNDS', '1', 'Số vòng sinh trưởng'),
('INITIAL_QUALITY_PCT', '100', 'Chất lượng lô mới'),
('RICE_QUALITY_LOSS_PP', '5', 'Suy giảm chất lượng lúa theo điểm phần trăm'),
('GOLD_QUALITY_PCT', '100', 'Chất lượng vàng'),
('SWAP_FEE_RATE', '0.003', 'Phí swap'),
('INITIAL_RICE_POOL', '{"assetReserve":1000,"usdgReserve":10000}', 'Pool lúa ban đầu'),
('INITIAL_GOLD_POOL', '{"assetReserve":100,"usdgReserve":10000}', 'Pool vàng ban đầu'),
('SHIPPING_COST_PER_UNIT', '0.5', 'Phí vận chuyển mỗi đơn vị'),
('SHIPPING_DELAY_ROUNDS', '1', 'Số vòng vận chuyển'),
('SHIPPING_ALLOWED_ROUNDS', '[1,2,3,4,5]', 'Vòng được gửi hàng'),
('PLANT_ALLOWED_ROUNDS', '[1,2,3,4,5]', 'Vòng được trồng'),
('REGIONS', '["CHAU_A","CHAU_AU"]', 'Các vùng hợp lệ');

INSERT OR REPLACE INTO notices (id, round, category, message) VALUES
('ROUND_1', 1, 'INTRODUCTION', 'Bắt đầu mô phỏng Đại dịch toàn cầu.'),
('ROUND_2', 2, 'EARLY_WARNING', 'Dịch lan, lương thực và vàng sắp tăng.'),
('ROUND_3', 3, 'SURGE', 'Biến động: giá tăng, cước vận chuyển ×2.5.'),
('ROUND_4', 4, 'EARLY_WARNING', 'Thị trường sắp phục hồi.'),
('ROUND_5', 5, 'RECOVERY', 'Biến động: giá giảm, cước trở về ×1.'),
('ROUND_6', 6, 'FINISH_REMINDER', 'Đây là vòng cuối, hãy chuẩn bị kết thúc lượt chơi.');

INSERT OR REPLACE INTO scenario_rounds
(round, phase, rice_chau_a, rice_chau_au, gold_chau_a, gold_chau_au, shipping_multiplier, notice_id) VALUES
(1, 'GĐ1', 10, 9, 100, 100, 1, 'ROUND_1'),
(2, 'GĐ1', 10, 9, 102, 101, 1, 'ROUND_2'),
(3, 'GĐ2', 13, 15, 115, 118, 2.5, 'ROUND_3'),
(4, 'GĐ2', 14, 15, 118, 120, 2.5, 'ROUND_4'),
(5, 'GĐ3', 11, 10, 108, 106, 1, 'ROUND_5'),
(6, 'GĐ3', 10, 9, 105, 104, 1, 'ROUND_6');
