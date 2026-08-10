const { Client } = require("pg");
const dns = require("dns").promises;
const fs = require("fs");

function readPassword() {
  const raw = fs.readFileSync(".env.local", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_PASSWORD="));
  if (!line) throw new Error("DATABASE_PASSWORD missing");
  return line.slice("DATABASE_PASSWORD=".length).trim();
}

const pass = readPassword();
const ref = "gbattnbrqulqxlwhzaxx";
const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
];
const prefixes = ["aws-0", "aws-1"];

async function tryConnect(name, connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
  });
  try {
    await client.connect();
    await client.query("select 1 as ok");
    console.log("CONNECTED", name);
    await client.end();
    return true;
  } catch (e) {
    const msg = String(e.message).split("\n")[0];
    if (!/ENOTFOUND|timeout|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
      console.log("TRY", name, msg);
    }
    try {
      await client.end();
    } catch {}
    return false;
  }
}

(async () => {
  const okDirect = await tryConnect(
    `direct:db.${ref}.supabase.co`,
    `postgresql://postgres:${encodeURIComponent(pass)}@db.${ref}.supabase.co:5432/postgres`,
  );
  if (okDirect) {
    const url = `postgresql://postgres:${encodeURIComponent(pass)}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
    fs.writeFileSync(".db-url.tmp", url, "utf8");
    process.exit(0);
  }

  for (const p of prefixes) {
    for (const r of regions) {
      const host = `${p}-${r}.pooler.supabase.com`;
      try {
        await dns.lookup(host);
      } catch {
        continue;
      }
      for (const port of [6543, 5432]) {
        const name = `${host}:${port}`;
        const cs = `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:${port}/postgres`;
        const ok = await tryConnect(name, cs);
        if (ok) {
          fs.writeFileSync(
            ".db-url.tmp",
            `${cs}?sslmode=require`,
            "utf8",
          );
          process.exit(0);
        }
      }
    }
  }
  console.log("NO_CONNECTION");
  process.exit(1);
})();
