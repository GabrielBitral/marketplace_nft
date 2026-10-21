const databaseName = "kurio-msw";
const storeName = "state";

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(databaseName, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const readMockState = async <Value>(key: string, fallback: Value) => {
  const database = await openDatabase();
  return await new Promise<Value>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as Value | undefined) ?? fallback);
    request.onerror = () => reject(request.error);
  });
};

export const saveMockState = async <Value>(key: string, value: Value) => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(storeName, "readwrite").objectStore(storeName).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearMockState = async () => {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(storeName, "readwrite").objectStore(storeName).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
