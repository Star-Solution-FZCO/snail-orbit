import type {
    EncryptedObjectT,
    EncryptionKeyAlgorithmT,
    EncryptionKeyPublicT,
    EncryptionMetaT,
} from "shared/model/types/encryption";
import { getAllKeys, writeNewKey } from "./crypto_keys";

const HASH = "SHA-256";
export const generateAES = async () => {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
    );
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

export const importPublicKey = async (
    pemKey: string,
    algo: EncryptionKeyAlgorithmT,
) => {
    return await crypto.subtle.importKey(
        "spki",
        convertPemToBinary(pemKey),
        {
            name: algo === "RSA" ? "RSA-OAEP" : "X25519",
            hash: HASH,
        },
        true,
        algo === "RSA" ? ["encrypt"] : [],
    );
};

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
    writeNewKey({ fingerprint, pair });
};

export const encryptBufferWithKey = async (
    buffer: ArrayBuffer,
    key: CryptoKey,
) => {
    if (key.algorithm.name === "AES-GCM") {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedText = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv,
            },
            key,
            buffer,
        );
        const result = new Uint8Array(iv.length + encryptedText.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encryptedText), iv.length);
        return result;
    }
    if (key.algorithm.name === "RSA-OAEP") {
        return window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            key,
            buffer,
        );
    } else {
        throw new Error("Unhandled!");
    }
};

export const decryptBufferWithKey = async (
    buffer: ArrayBuffer,
    key: CryptoKey,
) => {
    if (key.algorithm.name === "AES-GCM") {
        const array = new Uint8Array(buffer);
        const iv = array.slice(0, 12);
        const ciphertext = array.slice(12);

        return await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            ciphertext,
        );
    }
    if (key.algorithm.name === "RSA-OAEP") {
        return window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            key,
            buffer,
        );
    } else {
        throw new Error("Unhandled!");
    }
};

export const encryptTextWithAES = async (text: string, key?: CryptoKey) => {
    const newKey = key || (await generateAES());
    const enc = new TextEncoder();
    const encryptedText = await encryptBufferWithKey(enc.encode(text), newKey);
    return { text: arrayBufferToBase64String(encryptedText), key: newKey };
};

export const decryptTextWithAES = async (text: string, key: CryptoKey) => {
    const decryptedText = await decryptBufferWithKey(
        base64StringToArrayBuffer(text),
        key,
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedText);
};

const deriveX25519SecretKey = (privateKey: CryptoKey, publicKey: CryptoKey) => {
    return window.crypto.subtle.deriveKey(
        {
            name: publicKey.algorithm.name,
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    );
};

const wrapAESKeyInner = async (
    aesKeyBuffer: ArrayBuffer,
    publicKey: CryptoKey,
) => {
    if (publicKey.algorithm.name === "X25519") {
        const oneTimeKeyPair = await generateKeyPair("X25519");
        const sharedSecret = await deriveX25519SecretKey(
            oneTimeKeyPair.privateKey,
            publicKey,
        );
        const buffer = await encryptBufferWithKey(aesKeyBuffer, sharedSecret);
        const res = arrayBufferToBase64String(buffer);
        const exportedOneTimePublicKey = await exportPublicKey(
            oneTimeKeyPair.publicKey,
        );
        return res + "|#|" + exportedOneTimePublicKey;
    } else if (publicKey.algorithm.name === "RSA-OAEP") {
        const buffer = await encryptBufferWithKey(aesKeyBuffer, publicKey);
        return arrayBufferToBase64String(buffer);
    } else {
        throw new Error("Unsupported");
    }
};

const unwrapAESKeyInner = async (wrappedKey: string, privateKey: CryptoKey) => {
    if (privateKey.algorithm.name === "X25519") {
        const [wrappedAes, publicKey] = wrappedKey.split("|#|");
        const oneTimePublicKey = await importPublicKey(publicKey, "X25519");
        const sharedSecret = await deriveX25519SecretKey(
            privateKey,
            oneTimePublicKey,
        );
        return await decryptBufferWithKey(
            base64StringToArrayBuffer(wrappedAes),
            sharedSecret,
        );
    } else if (privateKey.algorithm.name === "RSA-OAEP") {
        return decryptBufferWithKey(
            base64StringToArrayBuffer(wrappedKey),
            privateKey,
        );
    } else {
        throw new Error("Unsupported");
    }
};

export const wrapAESKey = async (
    key: CryptoKey,
    wrapKeys: EncryptionKeyPublicT[],
) => {
    const aesKeyBuffer = await crypto.subtle.exportKey("raw", key);
    return await Promise.all(
        wrapKeys.map(async (wrapKey) => {
            const publicKey = await importPublicKey(
                wrapKey.public_key,
                wrapKey.algorithm,
            );
            const encryptedAesKey = await wrapAESKeyInner(
                aesKeyBuffer,
                publicKey,
            );
            return { ...wrapKey, data: encryptedAesKey };
        }),
    );
};

const getAESKeyFromMetaInner = async (
    encryptionMeta: EncryptionMetaT,
    key: CryptoKey,
) => {
    const encryptedKey = encryptionMeta.data;
    const res = await unwrapAESKeyInner(encryptedKey, key);
    return await crypto.subtle.importKey("raw", res, "AES-GCM", true, [
        "encrypt",
        "decrypt",
    ]);
};

export const getAESKeyFromMetas = async (
    encryptionMetas: EncryptionMetaT[],
) => {
    const keys = await getAllKeys();
    const metasWithKeys = encryptionMetas
        .map((meta) => {
            const key = keys.find((k) => k.fingerprint === meta.fingerprint);
            if (key) return { meta, key };
            return undefined;
        })
        .filter((el) => !!el);
    if (!metasWithKeys.length) return null;
    const anyMeta = metasWithKeys[0];
    if (!anyMeta) return null;
    return await getAESKeyFromMetaInner(
        anyMeta.meta,
        anyMeta.key.pair.privateKey,
    );
};

export const decryptObject = async (object: EncryptedObjectT) => {
    if (!object.encryption) return object.value;
    const key = await getAESKeyFromMetas(object.encryption);
    if (!key) return object.value;
    const res = await decryptTextWithAES(object.value, key);
    return res || object.value;
};
