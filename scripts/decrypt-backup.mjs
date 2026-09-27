#!/usr/bin/env node
// Turns an encrypted backup (vensin-….sqlite.gz.enc, as linked in the backup channel) back into the .sqlite.gz.
//   node scripts/decrypt-backup.mjs <file.enc> <passphrase>        → writes <file without .enc> next to it
// Then: gunzip it, stop the site, put it in place as <DATA_DIR>/vensin.sqlite, delete the -wal/-shm files, start again.
import { readFileSync, writeFileSync } from "node:fs";
import { createDecipheriv, scryptSync } from "node:crypto";

const [file, passphrase] = process.argv.slice(2);
if (!file || !passphrase) {
  console.error("usage: node scripts/decrypt-backup.mjs <file.enc> <passphrase>");
  process.exit(1);
}
const data = readFileSync(file);
if (data.subarray(0, 4).toString() !== "VDB1") {
  console.error("not a vensin backup file");
  process.exit(1);
}
const salt = data.subarray(4, 20);
const iv = data.subarray(20, 32);
const tag = data.subarray(data.length - 16);
const body = data.subarray(32, data.length - 16);
const key = scryptSync(passphrase, salt, 32);
const decipher = createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(tag);
let out;
try {
  out = Buffer.concat([decipher.update(body), decipher.final()]);
} catch {
  console.error("wrong passphrase or damaged file");
  process.exit(1);
}
const target = file.replace(/\.enc$/, "");
writeFileSync(target, out);
console.log(`ok → ${target} (${(out.length / 1024).toFixed(1)} kb). next: gunzip it and place it as vensin.sqlite`);
