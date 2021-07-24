"use strict";

class IndexedDB {
	#db;
	#dbName;
	#storeName;
	#keyName;
	constructor({store, key = "key"} = {store: undefined}) {
		if(!store) throw new Error("IndexedDB.constructor()");
		const path = location.pathname.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
		this.#dbName = `${store} with ${path}`;
		this.#storeName = store;
		this.#keyName = key;
	}
	async open() {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(this.#dbName);
			req.onupgradeneeded = e => e.target.result.createObjectStore(this.#storeName, {keyPath: this.#keyName, autoIncrement: true});
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("IndexedDB.open()"));
		});
	}
	async put(obj) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readwrite");
			const req = tran.objectStore(this.#storeName).put(obj);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("IndexedDB.put()"));
		});
	}
	async get(key) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readonly");
			const req = tran.objectStore(this.#storeName).get(key);
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("IndexedDB.get()"));
		});
	}
	async getAll() {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readonly");
			const req = tran.objectStore(this.#storeName).getAll();
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("IndexedDB.getAll()"));
		});
	}
	async delete(key) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readwrite");
			const req = tran.objectStore(this.#storeName).delete(key);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("IndexedDB.delete()"));
		});
	}
	async clear() {
		return new Promise(async (resolve, reject) => {
			if(this.#db) this.#db.close();
			const req = indexedDB.deleteDatabase(this.#dbName);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("IndexedDB.clear()"));
		});
	}
}

class IndexedDBkv {
	#db;
	#dbName;
	#storeName;
	constructor({store} = {store: undefined}) {
		if(!store) throw new Error("IndexedDBkv.constructor()");
		const path = location.pathname.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
		this.#dbName = `${store} with ${path}`;
		this.#storeName = store;
	}
	async open() {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(this.#dbName);
			req.onupgradeneeded = e => e.target.result.createObjectStore(this.#storeName, {keyPath: "key"});
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("IndexedDBkv.open()"));
		});
	}
	async set(key, value) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readwrite");
			const req = tran.objectStore(this.#storeName).put({key, value});
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("IndexedDBkv.set()"));
		});
	}
	async setObject(obj) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readwrite");
			Object.entries(obj).map(([key, value]) => {
				const req = tran.objectStore(this.#storeName).put({key, value});
				req.onsuccess = e => resolve();
				req.onerror = e => reject(new Error("IndexedDBkv.setObject()"));
			});
		});
	}
	async get(key) {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readonly");
			const req = tran.objectStore(this.#storeName).get(key);
			req.onsuccess = e => resolve(e.target.result?.value);
			req.onerror = e => reject(new Error("IndexedDBkv.get()"));
		});
	}
	async getObject() {
		return new Promise(async (resolve, reject) => {
			if(!this.#db) this.#db = await this.open();
			const tran = this.#db.transaction(this.#storeName, "readonly");
			const req = tran.objectStore(this.#storeName).getAll();
			req.onsuccess = e => resolve(Object.assign({}, ...e.target.result.map(obj => ({[obj.key]: obj.value}) )));
			req.onerror = e => reject(new Error("IndexedDBkv.getObject()"));
		});
	}
	async clear() {
		return new Promise(async (resolve, reject) => {
			if(this.#db) this.#db.close();
			const req = indexedDB.deleteDatabase(this.#dbName);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("IndexedDBkv.clear()"));
		});
	}
}

/*
const TestScript = async () => {
	const db = new IndexedDB({store: "data"});
	await db.clear();
	await db.put({a: 1, b: 2});
	await db.put({a: 2, b: 4});
	await db.put({a: 3, b: 6});
	console.log("delete before", await db.get(1));
	await db.delete(1);
	console.log("delete after", await db.get(1));
	console.log(await db.getAll());


	const db2 = new IndexedDBkv({store: "para"});
	db2.clear();
	const para = {};
	para.Genre = "genre1";
	para.Hashtag = "#hashtag1";
	await db2.setObject(para);
	await db2.set("Keywords", "keywords1");
	await db2.set("Genre", "genre9");
	console.log("xxx", await db2.getObject());
	console.log("get Genre", await db2.get("Genre"));
	console.log("get test", await db2.get("test"));

	const db3 = new IndexedDBkv({store: "config"});
	db3.clear();
	const config = {};
	config.FontSize = 14;
	await db3.setObject(config);
}
document.addEventListener("DOMContentLoaded", TestScript);
*/
