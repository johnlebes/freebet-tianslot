const { getStore } = require("@netlify/blobs");

const STORE_NAME = "tianslot-store";
const KEY = "state";
const ADMIN_PIN = "378378";

async function readState(store) {
  const data = await store.get(KEY);
  if (!data) {
    const init = {
      targetTime: Date.now() + 4 * 60 * 60 * 1000,
      tableData: []
    };
    await store.set(KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(data);
}

async function writeState(store, state) {
  await store.set(KEY, JSON.stringify(state));
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);
  const state = await readState(store);

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body);

    if (body.pin !== ADMIN_PIN) {
      return { statusCode: 403, body: "PIN salah" };
    }

    if (body.newTarget) {
      state.targetTime = body.newTarget;
    }

    if (body.newTable) {
      state.tableData = body.newTable;
    }

    await writeState(store, state);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
