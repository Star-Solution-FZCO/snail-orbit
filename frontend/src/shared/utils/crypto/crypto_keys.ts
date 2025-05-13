type StoreRecord = {
    fingerprint: string;
    pair: CryptoKeyPair;
};

const callOnStore = (fn: (store: IDBObjectStore) => unknown) => {
    const indexedDB = window.indexedDB;
    const open = indexedDB.open("Crypto", 1);

    open.onupgradeneeded = () => {
        open.result.createObjectStore("Keys", { keyPath: "fingerprint" });
    };

    open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("Keys", "readwrite");
        const store = tx.objectStore("Keys");

        fn(store);

        tx.oncomplete = db.close;
    };
};

export const writeNewKey = (record: StoreRecord) => {
    callOnStore((store) => {
        store.put(record);
    });
};

export const getAllKeys = async (): Promise<StoreRecord[]> => {
    return new Promise((resolve, reject) => {
        callOnStore((store) => {
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result as StoreRecord[]);
            };

            request.onerror = () => {
                reject();
            };
        });
    });
};
