const { openReadOnlyDatabase } = require("../config/sqlite");

function withDatabase(callback) {
    const db = openReadOnlyDatabase();
    try {
        return callback(db);
    } finally {
        db.close();
    }
}

function readConfigValues(db) {
    return Object.fromEntries(
        db.prepare("SELECT key, value_json FROM game_config").all()
            .map((row) => [row.key, JSON.parse(row.value_json)])
    );
}

function mapRound(row) {
    return {
        round: row.round,
        phase: row.phase,
        prices: {
            RICE: { CHAU_A: row.rice_chau_a, CHAU_AU: row.rice_chau_au },
            GOLD: { CHAU_A: row.gold_chau_a, CHAU_AU: row.gold_chau_au }
        },
        shippingMultiplier: row.shipping_multiplier,
        notice: {
            id: row.notice_id,
            category: row.notice_category,
            message: row.notice_message
        }
    };
}

function getConfig() {
    return withDatabase((db) => {
        const values = readConfigValues(db);
        return {
            game: { name: values.APP_NAME, version: values.APP_VERSION },
            system: { maintenance: values.MAINTENANCE },
            simulation: Object.fromEntries(
                Object.entries(values).filter(([key]) => !["APP_NAME", "APP_VERSION", "MAINTENANCE"].includes(key))
            )
        };
    });
}

function getScenario() {
    return withDatabase((db) => db.prepare(`
        SELECT sr.*, n.category AS notice_category, n.message AS notice_message
        FROM scenario_rounds sr
        JOIN notices n ON n.id = sr.notice_id
        ORDER BY sr.round ASC
    `).all().map(mapRound));
}

function getRound(round) {
    return withDatabase((db) => {
        const row = db.prepare(`
            SELECT sr.*, n.category AS notice_category, n.message AS notice_message
            FROM scenario_rounds sr
            JOIN notices n ON n.id = sr.notice_id
            WHERE sr.round = ?
        `).get(round);
        return row ? mapRound(row) : null;
    });
}

module.exports = { getConfig, getScenario, getRound };
