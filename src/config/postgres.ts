import { Pool } from "pg";
import { format, buildWhereFromQuery, transformer } from "sqlutils/pg";

const {
  DB_HOST,
  DB_PASSWORD,
  DB_PORT = 5432,
  DB_USERNAME,
  DB_NAME,
} = process.env;

const isDev = process.env.NODE_ENV === "development";

const pool = new Pool({
  user: DB_USERNAME,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: parseInt(String(DB_PORT), 10),
  database: DB_NAME,
  ssl: false, // Disable SSL
});

export default {
  async query(text, params?) {
    const start = Date.now();
    text = text.replace(/\n/g, "");
    if (isDev) console.log("to be executed query", { text });
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (isDev)
      console.log("executed query", { text, duration, rows: res.rowCount });
    return res;
  },
  format,
  buildWhereFromQuery,
  transformer,
};
