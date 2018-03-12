class Cache {
  constructor() {
    this.storage = new WeakMap();
  }

  has(key) { return this.storage.has(key); }
  set(key, data) { return this.storage.set(key, data); }
  del(key) { return this.storage.delete(key); }
  get(key, fallback) {
    if (!key) { return null; }
    if (!this.has(key)) { this.set(key, fallback()); }
    return this.storage.get(key);
  }
}

module.exports = Cache;
