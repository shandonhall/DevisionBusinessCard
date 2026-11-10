/**
 * Apple Wallet certificate helper (no OpenSSL needed).
 *
 * 1. node scripts/apple-wallet-cert.cjs csr you@example.com "DeVision Media"
 *    -> .wallet-cert/pass.key.pem (keep private) and .wallet-cert/pass.csr
 *    Upload pass.csr when Apple asks for a Certificate Signing Request.
 *
 * 2. node scripts/apple-wallet-cert.cjs finish path/to/pass.cer
 *    -> .wallet-cert/apple-wallet.env with the six APPLE_WALLET_* values
 *       for Vercel and .env.local.
 */
const forge = require("node-forge");
const fs = require("fs");
const path = require("path");

const DIR = ".wallet-cert";
const KEY_PATH = path.join(DIR, "pass.key.pem");
const CSR_PATH = path.join(DIR, "pass.csr");
const ENV_PATH = path.join(DIR, "apple-wallet.env");
const WWDR_URL = "https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer";
const UID_OID = "0.9.2342.19200300.100.1.1";

function toBase64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

function readCertificate(file) {
  const raw = fs.readFileSync(file);
  const text = raw.toString("utf8");
  if (text.includes("-----BEGIN CERTIFICATE-----")) {
    return forge.pki.certificateFromPem(text);
  }
  const asn1 = forge.asn1.fromDer(forge.util.createBuffer(raw.toString("binary")));
  return forge.pki.certificateFromAsn1(asn1);
}

function createCsr(email, commonName) {
  if (!email) throw new Error('Usage: csr you@example.com "DeVision Media"');
  fs.mkdirSync(DIR, { recursive: true });
  if (fs.existsSync(KEY_PATH)) {
    throw new Error(`${KEY_PATH} already exists - delete it first to start over.`);
  }
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    { name: "commonName", value: commonName || "DeVision Media" },
    { name: "emailAddress", value: email },
    { name: "countryName", value: "ZA" },
  ]);
  csr.sign(keys.privateKey, forge.md.sha256.create());
  fs.writeFileSync(KEY_PATH, forge.pki.privateKeyToPem(keys.privateKey));
  fs.writeFileSync(CSR_PATH, forge.pki.certificationRequestToPem(csr));
  console.log(`Created ${CSR_PATH} - upload this to Apple.`);
  console.log(`Created ${KEY_PATH} - keep this private, never commit it.`);
}

async function finish(cerPath) {
  if (!cerPath) throw new Error("Usage: finish path/to/pass.cer");
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`${KEY_PATH} not found - run the csr step on this machine first.`);
  }
  const keyPem = fs.readFileSync(KEY_PATH, "utf8");
  const cert = readCertificate(cerPath);
  const key = forge.pki.privateKeyFromPem(keyPem);
  if (cert.publicKey.n.compareTo(key.n) !== 0) {
    throw new Error("This certificate was not issued for the key in .wallet-cert.");
  }

  const uid = cert.subject.attributes.find((a) => a.type === UID_OID)?.value;
  const team = cert.subject.getField("OU")?.value;
  if (!uid || !team) throw new Error("Could not read Pass Type ID / Team ID from the certificate.");

  const response = await fetch(WWDR_URL);
  if (!response.ok) throw new Error(`Could not download Apple WWDR certificate (${response.status})`);
  const wwdrDer = Buffer.from(await response.arrayBuffer());
  const wwdr = forge.pki.certificateFromAsn1(
    forge.asn1.fromDer(forge.util.createBuffer(wwdrDer.toString("binary"))),
  );

  const lines = [
    `APPLE_WALLET_PASS_TYPE_ID=${uid}`,
    `APPLE_WALLET_TEAM_ID=${team}`,
    `APPLE_WALLET_SIGNER_CERT=${toBase64(forge.pki.certificateToPem(cert))}`,
    `APPLE_WALLET_SIGNER_KEY=${toBase64(keyPem)}`,
    `APPLE_WALLET_WWDR_CERT=${toBase64(forge.pki.certificateToPem(wwdr))}`,
  ];
  fs.writeFileSync(ENV_PATH, `${lines.join("\n")}\n`);
  console.log(`Pass Type ID: ${uid}`);
  console.log(`Team ID:      ${team}`);
  console.log(`Expires:      ${cert.validity.notAfter.toISOString().slice(0, 10)}`);
  console.log(`Wrote ${ENV_PATH}`);
}

const [command, ...args] = process.argv.slice(2);
Promise.resolve()
  .then(() => {
    if (command === "csr") return createCsr(args[0], args[1]);
    if (command === "finish") return finish(args[0]);
    throw new Error("Commands: csr <email> [name] | finish <pass.cer>");
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
