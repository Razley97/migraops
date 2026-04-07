// ═══ Visual QA Store — IndexedDB storage for screenshots ═══
// Stores large base64 screenshot data outside of localStorage/React state.
// Keys follow pattern: vqa-{migrationTimestamp}-{pre|post|diff}-{routeIndex}

var DB_NAME = "migraops-vqa";
var DB_VERSION = 1;
var STORE_NAME = "screenshots";

function openDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = function(e) { resolve(e.target.result); };
    request.onerror = function(e) { reject(e.target.error); };
  });
}

export async function saveScreenshot(key, base64String) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(base64String, key);
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function(e) { reject(e.target.error); };
  });
}

export async function getScreenshot(key) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, "readonly");
    var req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = function() { resolve(req.result || null); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

export async function getMultipleScreenshots(keys) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, "readonly");
    var store = tx.objectStore(STORE_NAME);
    var results = {};
    var pending = keys.length;
    if (pending === 0) { resolve(results); return; }
    keys.forEach(function(key) {
      var req = store.get(key);
      req.onsuccess = function() {
        if (req.result) results[key] = req.result;
        pending--;
        if (pending === 0) resolve(results);
      };
      req.onerror = function() {
        pending--;
        if (pending === 0) resolve(results);
      };
    });
  });
}

export async function deleteByPrefix(prefix) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, "readwrite");
    var store = tx.objectStore(STORE_NAME);
    var req = store.openCursor();
    req.onsuccess = function(e) {
      var cursor = e.target.result;
      if (cursor) {
        if (typeof cursor.key === "string" && cursor.key.indexOf(prefix) === 0) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function(e) { reject(e.target.error); };
  });
}

export async function getStorageStats() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, "readonly");
    var store = tx.objectStore(STORE_NAME);
    var count = 0;
    var sizeBytes = 0;
    var req = store.openCursor();
    req.onsuccess = function(e) {
      var cursor = e.target.result;
      if (cursor) {
        count++;
        if (typeof cursor.value === "string") sizeBytes += cursor.value.length;
        cursor.continue();
      } else {
        resolve({ count: count, sizeBytes: sizeBytes });
      }
    };
    req.onerror = function(e) { reject(e.target.error); };
  });
}
