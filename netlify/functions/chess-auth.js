const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 120000, 64, "sha512")
    .toString("hex");
}

function publicProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    elo: profile.elo,
    wins: profile.wins,
    losses: profile.losses,
    games_played: profile.games_played
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return json(500, { error: "Missing Supabase server env." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON." });
  }

  const mode = payload.mode;
  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");

  if (!["login", "register"].includes(mode)) {
    return json(400, { error: "Invalid auth mode." });
  }

  if (!username || username.length < 3) {
    return json(400, { error: "Username minimal 3 karakter. Pakai huruf, angka, atau underscore." });
  }

  if (password.length < 6) {
    return json(400, { error: "Password minimal 6 karakter." });
  }

  if (mode === "register") {
    const { data: existing } = await supabase
      .from("magic_chess_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return json(409, { error: "Username sudah dipakai." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    const { data: profile, error } = await supabase
      .from("magic_chess_profiles")
      .insert({
        username,
        password_salt: salt,
        password_hash: passwordHash,
        elo: 0,
        wins: 0,
        losses: 0,
        games_played: 0
      })
      .select("*")
      .single();

    if (error) {
      return json(500, { error: error.message });
    }

    return json(200, { profile: publicProfile(profile) });
  }

  const { data: profile, error } = await supabase
    .from("magic_chess_profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return json(500, { error: error.message });
  }

  if (!profile) {
    return json(401, { error: "Username atau password salah." });
  }

  const attemptedHash = hashPassword(password, profile.password_salt);

  try {
    const a = Buffer.from(attemptedHash, "hex");
    const b = Buffer.from(profile.password_hash, "hex");

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return json(401, { error: "Username atau password salah." });
    }
  } catch {
    return json(401, { error: "Username atau password salah." });
  }

  return json(200, { profile: publicProfile(profile) });
};
