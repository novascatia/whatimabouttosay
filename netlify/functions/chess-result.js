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

function publicProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    elo: profile.elo,
    wins: profile.wins,
    losses: profile.losses,
    games_played: profile.games_played,
    is_gm: profile.is_gm || false
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return json(500, { error: "Missing Supabase server env." });

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } 
  catch { return json(400, { error: "Invalid JSON." }); }

  const profileId = String(payload.profileId || "");
  const gameId = String(payload.gameId || "");
  const playerColor = String(payload.playerColor || "");

  if (!profileId || !gameId || !["white", "black"].includes(playerColor)) return json(400, { error: "Missing result data." });

  const { data: game, error: gameError } = await supabase.from("magic_chess_games").select("*").eq("id", gameId).single();
  if (gameError || !game) return json(404, { error: "Game not found." });
  if (!game.winner) return json(400, { error: "Game is not finished." });

  const isPlayerInGame = game.white_player === profileId || game.black_player === profileId;
  if (!isPlayerInGame) return json(403, { error: "You are not in this game." });

  const { data: profile, error: profileError } = await supabase.from("magic_chess_profiles").select("*").eq("id", profileId).single();
  if (profileError || !profile) return json(404, { error: "Profile not found." });

  const didWin = game.winner === playerColor;

  const nextProfile = {
    elo: didWin ? Number(profile.elo || 0) + 25 : Math.max(0, Number(profile.elo || 0) - 10),
    wins: didWin ? Number(profile.wins || 0) + 1 : Number(profile.wins || 0),
    losses: didWin ? Number(profile.losses || 0) : Number(profile.losses || 0) + 1,
    games_played: Number(profile.games_played || 0) + 1,
    updated_at: new Date().toISOString()
  };

  const { data: updatedProfile, error: updateError } = await supabase.from("magic_chess_profiles").update(nextProfile).eq("id", profileId).select("*").single();
  if (updateError) return json(500, { error: updateError.message });

  return json(200, { profile: publicProfile(updatedProfile) });
};
