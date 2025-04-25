import type { EncryptionKeyAlgorithmT } from "types/encryption_keys";
const HASH = "SHA-256";

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

export const generateKeyPair = async (algo?: EncryptionKeyAlgorithmT) => {
    if (algo === "RSA")
        return await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: HASH,
            },
            true,
            ["encrypt", "decrypt"],
        );
    else
        return (await crypto.subtle.generateKey(
            {
                name: "X25519",
            },
            true,
            ["deriveKey", "deriveBits"],
        )) as CryptoKeyPair;
};

export const arrayBufferToBase64String = (arrayBuffer: ArrayBuffer) => {
    const byteArray = new Uint8Array(arrayBuffer);
    let byteString = "";
    for (let i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }
    return btoa(byteString);
};

export const base64StringToArrayBuffer = (b64str: string) => {
    const byteStr = atob(b64str);
    const bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) {
        bytes[i] = byteStr.charCodeAt(i);
    }
    return bytes.buffer;
};

export const textToArrayBuffer = (str: string) => {
    const buf = decodeURIComponent(encodeURIComponent(str)); // 2 bytes for each char
    const bufView = new Uint8Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
        bufView[i] = buf.charCodeAt(i);
    }
    return bufView;
};

export const arrayBufferToText = (arrayBuffer: ArrayBuffer) => {
    const byteArray = new Uint8Array(arrayBuffer);
    let str = "";
    for (let i = 0; i < byteArray.byteLength; i++) {
        str += String.fromCharCode(byteArray[i]);
    }
    return str;
};

export const convertBinaryToPem = (binaryData: ArrayBuffer, label: string) => {
    const base64Cert = arrayBufferToBase64String(binaryData);
    let pemCert = "-----BEGIN " + label + "-----\r\n";
    let nextIndex = 0;
    while (nextIndex < base64Cert.length) {
        pemCert += base64Cert.substring(nextIndex, nextIndex + 64) + "\r\n";
        nextIndex += 64;
    }
    pemCert += "-----END " + label + "-----\r\n";
    return pemCert;
};

export const convertPemToBinary = (pem: string) => {
    const lines = pem.split("\n");
    let encoded = "";
    for (let i = 0; i < lines.length; i++) {
        if (
            lines[i].trim().length > 0 &&
            lines[i].indexOf("PRIVATE KEY") < 0 &&
            lines[i].indexOf("PUBLIC KEY") < 0
        ) {
            encoded += lines[i].trim();
        }
    }
    return base64StringToArrayBuffer(encoded);
};

export const exportPublicKey = async (key: CryptoKey) => {
    return await crypto.subtle
        .exportKey("spki", key)
        .then((spki) =>
            convertBinaryToPem(
                spki,
                key.algorithm.name === "RSA-OAEP"
                    ? "RSA PUBLIC KEY"
                    : "X25519 PUBLIC KEY",
            ),
        );
};

export const exportPrivateKey = async (key: CryptoKey) => {
    return await crypto.subtle
        .exportKey("pkcs8", key)
        .then((pkcs8) =>
            convertBinaryToPem(
                pkcs8,
                key.algorithm.name === "RSA-OAEP"
                    ? "RSA PRIVATE KEY"
                    : "X25519 PRIVATE KEY",
            ),
        );
};

// export const importPublicKey = async (pemKey: string) => {
//     return await crypto.subtle.importKey(
//         "spki",
//         convertPemToBinary(pemKey),
//         {
//             name: CRYPTO_ALGORITHM,
//             hash: HASH,
//         },
//         true,
//         ["encrypt", "decrypt"],
//     );
// };
//
// export const importPrivateKey = async (pemKey: string) => {
//     return await crypto.subtle.importKey(
//         "pkcs8",
//         convertPemToBinary(pemKey),
//         {
//             name: CRYPTO_ALGORITHM,
//             hash: HASH,
//         },
//         true,
//         ["encrypt", "decrypt"],
//     );
// };

export const getFingerprint = async (key: CryptoKey) => {
    const rawKey = await exportPublicKey(key).then(convertPemToBinary);
    const hashBuffer = await crypto.subtle.digest(HASH, rawKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(32).padStart(2, "0"))
        .join("");
    return hashHex.slice(0, 32);
};

export const writeKeyPairToDB = async (pair: CryptoKeyPair) => {
    const fingerprint = await getFingerprint(pair.publicKey);
    callOnStore((store) => {
        store.put({ fingerprint, pair });
    });
};
