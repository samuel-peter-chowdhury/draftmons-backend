-- Wipe all Pokemon-related data
-- Tables are deleted in dependency order (children first, parents last)
-- to avoid foreign key constraint violations.

BEGIN;

-- 1. Deepest leaf tables
DELETE FROM game_stat;

-- 2. Game and match tables
DELETE FROM game;
DELETE FROM team_matches;
DELETE FROM match;

-- 3. Season child tables
DELETE FROM season_pokemon_team;
DELETE FROM season_pokemon;
DELETE FROM week;
DELETE FROM team;

-- 4. Season
DELETE FROM season;

-- 5. Pokemon join tables
DELETE FROM pokemon_pokemon_types;
DELETE FROM pokemon_abilities;
DELETE FROM pokemon_moves;
DELETE FROM move_special_move_categories;

-- 6. Pokemon leaf tables
DELETE FROM type_effective;

-- 7. Core entity tables
DELETE FROM move;
DELETE FROM pokemon;
DELETE FROM ability;
DELETE FROM generation;
DELETE FROM pokemon_type;
DELETE FROM special_move_category;

COMMIT;
