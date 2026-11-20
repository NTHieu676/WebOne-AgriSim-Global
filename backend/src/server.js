const app = require("./app");

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
    console.log(`AgriSim Backend chạy thành công trên cổng ${PORT}`);
});

// Keep the HTTP handle explicitly referenced. This is normally Node's default,
// but makes the intended lifecycle unambiguous in terminal runners as well.
server.ref();

server.on("error", (error) => {
    console.error(`Không thể khởi động backend tại cổng ${PORT}:`, error.message);
    process.exitCode = 1;
});

function shutdown(signal) {
    console.log(`Đang dừng AgriSim Backend (${signal})…`);
    server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
