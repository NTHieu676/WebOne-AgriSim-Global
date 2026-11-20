PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS game_config (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    round INTEGER NOT NULL UNIQUE CHECK (round BETWEEN 1 AND 6),
    category TEXT NOT NULL,
    message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenario_rounds (
    round INTEGER PRIMARY KEY CHECK (round BETWEEN 1 AND 6),
    phase TEXT NOT NULL,
    rice_chau_a REAL NOT NULL CHECK (rice_chau_a >= 0),
    rice_chau_au REAL NOT NULL CHECK (rice_chau_au >= 0),
    gold_chau_a REAL NOT NULL CHECK (gold_chau_a >= 0),
    gold_chau_au REAL NOT NULL CHECK (gold_chau_au >= 0),
    shipping_multiplier REAL NOT NULL CHECK (shipping_multiplier > 0),
    notice_id TEXT NOT NULL UNIQUE,
    FOREIGN KEY (notice_id) REFERENCES notices(id)
);
