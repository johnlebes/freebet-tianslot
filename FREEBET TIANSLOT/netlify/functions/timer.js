const { getStore } = require("@netlify/blobs");

const STORE_NAME = "tianslot";
const KEY = "state";
const ADMIN_PIN = "378378";

function defaultTable() {
  return Array.from({ length: 50 }, (_, i) => {
    const bonus = 1755000 - i * 30000;
    return {
      user: "user" + (i + 1),
      bonus,
      kode: "TS" + Math.floor(bonus / 1000),
    };
  });
}

async function getState(store) {
  const state = await store.get(KEY, { type: "json" });
  if (state) return state;

  const init = {
    targetTime: Date.now() + 4 * 60 * 60 * 1000,
    tableData: defaultTable(),
  };
  await store.set(KEY, JSON.stringify(init));
  return init;
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  // GET: ambil state
  if (event.httpMethod === "GET") {
    const state = await getState(store);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  // POST: update state (butuh PIN)
  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const { pin, newTarget, newTable } = body;

    if (pin !== ADMIN_PIN) {
      return { statusCode: 403, body: "PIN salah" };
    }

    const state = await getState(store);

    if (typeof newTarget === "number") state.targetTime = newTarget;
    if (Array.isArray(newTable)) state.tableData = newTable;

    await store.set(KEY, JSON.stringify(state));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
