import { Rules, DEFAULT_RULES, ReplayAnalysis, PlayerStats, BattleInfo } from "./types";
import { Battle } from "./Battle";
import { Pokemon } from "./Pokemon";
import { consts } from "./consts";

export class ReplayTracker {
  private link: string;
  private battlelink: string;
  private rules: Rules;

  constructor(link: string, rules: Rules = DEFAULT_RULES) {
    this.link = link;
    this.battlelink = link.split("/")[3] || link;
    this.rules = rules;
  }

  async track(data: string): Promise<ReplayAnalysis> {
    const players: string[] = [];
    let battle = new Battle("", "", "");
    const dataArr: string[] = [];

    try {
      const realdata = data.split("\n");

      for (const line of realdata) {
        dataArr.push(line);

        const parts = line.split("|").slice(1);

        if (line.startsWith(`|player|`)) {
          if (players.length < 2) {
            players.push(parts[2]);
            if (parts[1] === "p2") {
              battle = new Battle(this.battlelink, players[0], players[1]);
            }
          }
        } else if (line.startsWith(`|turn|`)) {
          battle.turns++;
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|tier|`)) {
          if (line.toLowerCase().includes("random")) {
            return this.buildErrorResult(
              [battle.p1, battle.p2],
              "This is a Randoms match. Randoms matches cannot be analyzed."
            );
          }
        } else if (line.startsWith(`|win|`)) {
          battle.winner = parts[1];
          battle.loser = battle.winner === battle.p1 ? battle.p2 : battle.p1;

          battle.p1Pokemon[battle.p1a.name] = battle.p1a;
          for (const pokemonKey of Object.keys(battle.p1Pokemon)) {
            if (!(pokemonKey.includes("-") || pokemonKey.includes(":"))) {
              const pokemon = battle.p1Pokemon[pokemonKey];
              battle.p1Pokemon[pokemon.name].directKills += pokemon.currentDKills;
              battle.p1Pokemon[pokemon.name].passiveKills += pokemon.currentPKills;
            }
          }

          battle.p2Pokemon[battle.p2a.name] = battle.p2a;
          for (const pokemonKey of Object.keys(battle.p2Pokemon)) {
            if (!(pokemonKey.includes("-") || pokemonKey.includes(":"))) {
              const pokemon = battle.p2Pokemon[pokemonKey];
              battle.p2Pokemon[pokemon.name].directKills += pokemon.currentDKills;
              battle.p2Pokemon[pokemon.name].passiveKills += pokemon.currentPKills;
            }
          }

          for (const pokemonName of Object.keys(battle.p1Pokemon)) {
            const newName = battle.p1Pokemon[pokemonName].realName.split("-")[0];
            if (
              consts.misnomers.includes(newName) ||
              consts.misnomers.includes(pokemonName) ||
              consts.misnomers.includes(battle.p1Pokemon[pokemonName].realName)
            ) {
              battle.p1Pokemon[pokemonName].realName = newName;
            }
            if (pokemonName === "") {
              const possibleIndices = Object.entries(battle.p1Pokemon).find(
                ([, value]) => value.realName === pokemonName || value.name === pokemonName
              );
              if (possibleIndices) delete battle.p1Pokemon[possibleIndices[0]];
            }
          }

          for (const pokemonName of Object.keys(battle.p2Pokemon)) {
            const newName = battle.p2Pokemon[pokemonName].realName.split("-")[0];
            if (
              consts.misnomers.includes(newName) ||
              consts.misnomers.includes(pokemonName) ||
              consts.misnomers.includes(battle.p2Pokemon[pokemonName].realName)
            ) {
              battle.p2Pokemon[pokemonName].realName = newName;
            }
            if (pokemonName === "") {
              const possibleIndices = Object.entries(battle.p2Pokemon).find(
                ([, value]) => value.realName === pokemonName || value.name === pokemonName
              );
              if (possibleIndices) delete battle.p2Pokemon[possibleIndices[0]];
            }
          }

          const killJsonp1: { [key: string]: { direct: number; passive: number } } = {};
          const deathJsonp1: { [key: string]: number } = {};
          for (const pokemonObj of Object.values(battle.p1Pokemon)) {
            const realName = pokemonObj.realName;
            if (
              !(
                Object.keys(killJsonp1).includes(pokemonObj.realName) ||
                Object.keys(deathJsonp1).includes(pokemonObj.realName)
              ) &&
              realName !== ""
            ) {
              killJsonp1[realName] = {
                direct: pokemonObj.directKills,
                passive: pokemonObj.passiveKills,
              };
              deathJsonp1[realName] = pokemonObj.isDead ? 1 : 0;
            }
          }

          const killJsonp2: { [key: string]: { direct: number; passive: number } } = {};
          const deathJsonp2: { [key: string]: number } = {};
          for (const pokemonObj of Object.values(battle.p2Pokemon)) {
            const realName = pokemonObj.realName;
            if (
              !(
                Object.keys(killJsonp2).includes(pokemonObj.realName) ||
                Object.keys(deathJsonp2).includes(pokemonObj.realName)
              ) &&
              realName !== ""
            ) {
              killJsonp2[realName] = {
                direct: pokemonObj.directKills,
                passive: pokemonObj.passiveKills,
              };
              deathJsonp2[realName] = pokemonObj.isDead ? 1 : 0;
            }
          }

          const historyEntries =
            battle.history.length === 0 ? ["Nothing happened"] : battle.history;

          const player1 = battle.p1;
          const player2 = battle.p2;
          const returnData: ReplayAnalysis = {
            players: {} as { [key: string]: PlayerStats },
            info: {} as BattleInfo,
            playerNames: [battle.p1, battle.p2],
          };
          returnData.players[player1] = {
            ps: battle.p1,
            kills: killJsonp1,
            deaths: deathJsonp1,
          };
          returnData.players[player2] = {
            ps: battle.p2,
            kills: killJsonp2,
            deaths: deathJsonp2,
          };

          const winnerAlive =
            Object.keys(returnData.players[battle.winner].kills).length -
            Object.keys(returnData.players[battle.winner].deaths).filter(
              (pokemonKey) => returnData.players[battle.winner].deaths[pokemonKey] == 1
            ).length;
          const loserAlive =
            Object.keys(returnData.players[battle.loser].kills).length -
            Object.keys(returnData.players[battle.loser].deaths).filter(
              (pokemonKey) => returnData.players[battle.loser].deaths[pokemonKey] == 1
            ).length;

          returnData.info = {
            replay: this.link,
            turns: battle.turns,
            winner: battle.winner,
            loser: battle.loser,
            history: historyEntries.join("\n"),
            rules: this.rules,
            result: `${battle.winner} won ${winnerAlive}-${loserAlive}`,
            battleId: battle.id,
          };

          return returnData;
        }

        if (line.startsWith(`|poke|`)) {
          const realName = parts[2].split(",")[0];
          const pokemonName = realName.split("-")[0];
          const pokemon = new Pokemon(pokemonName, realName);
          const side = parts[1] as "p1" | "p2";

          battle[`${side}Pokemon` as const][pokemonName] = pokemon;
        } else if (line.startsWith(`|switch|`) || line.startsWith(`|drag|`)) {
          if (
            battle.turns == 0 &&
            Object.keys(battle.p1Pokemon).length == 0 &&
            Object.keys(battle.p2Pokemon).length == 0
          ) {
            return this.buildErrorResult(
              [battle.p1, battle.p2],
              "This appears to be a randoms battle. Randoms battles cannot be analyzed."
            );
          }

          const replacerRealName = parts[2].split(",")[0];
          const replacer = replacerRealName.split("-")[0];
          const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const playerSide = side.substring(0, 2) as "p1" | "p2";

          battle[side].hasSubstitute = false;
          battle[side].clearAfflictions();
          let oldPokemon: Pokemon = new Pokemon("");

          if (battle[side].name !== "") {
            const tempCurrentDirectKills = battle[side].currentDKills;
            const tempCurrentPassiveKills = battle[side].currentPKills;
            battle[side].currentDKills = 0;
            battle[side].currentPKills = 0;
            battle[side].directKills += tempCurrentDirectKills;
            battle[side].passiveKills += tempCurrentPassiveKills;

            oldPokemon = battle[side];
            battle[`${playerSide}Pokemon` as const][oldPokemon.name] = oldPokemon;
          }

          battle[side] = battle[`${playerSide}Pokemon` as const][replacer];
          battle[side].realName = replacerRealName;
          battle[`${playerSide}Pokemon` as const][battle[side].realName] = battle[side];
        } else if (line.startsWith("|swap|")) {
          const userSide = parts[1].split(": ")[0].substring(0, 2) as "p1" | "p2";

          const temp = battle[`${userSide}a` as const];
          battle[`${userSide}a` as const] = battle[`${userSide}b` as const];
          battle[`${userSide}b` as const] = temp;
        } else if (line.startsWith(`|replace|`)) {
          const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const playerSide = side.substring(0, 2) as "p1" | "p2";
          const replacer = parts[2].split(",")[0].split("-")[0];

          const tempCurrentDirectKills = battle[side].currentDKills;
          const tempCurrentPassiveKills = battle[side].currentPKills;
          battle[side].currentDKills = 0;
          battle[side].currentPKills = 0;
          battle[side] = battle[`${playerSide}Pokemon` as const][replacer];
          battle[side].currentDKills += tempCurrentDirectKills;
          battle[side].currentPKills += tempCurrentPassiveKills;

          dataArr.splice(dataArr.length - 1, 1);
        } else if (
          line.startsWith(`|-supereffective|`) ||
          line.startsWith(`|upkeep`) ||
          line.startsWith(`|-resisted|`) ||
          line.startsWith(`|-unboost|`) ||
          line.startsWith(`|-boost|`) ||
          line.startsWith("|debug|") ||
          line.startsWith("|-enditem|") ||
          line.startsWith("|-fieldstart|") ||
          line.startsWith("|-zbroken|") ||
          line.startsWith("|-heal|") ||
          line.startsWith("|-hint|") ||
          line.startsWith("|-hitcount|") ||
          line.startsWith("|-ability|") ||
          line.startsWith("|-fieldactivate|") ||
          line.startsWith("|-fail|") ||
          line.startsWith("|-combine") ||
          line.startsWith("|-clearallboost") ||
          line.startsWith("|t:|") ||
          line.startsWith("|c|") ||
          line.startsWith("|l|") ||
          line.startsWith("|j|") ||
          line.startsWith("|inactive|") ||
          line === "|"
        ) {
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|detailschange|`)) {
          if (parts[2].includes("Mega") || parts[2].includes("Primal")) {
            const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
            const realName = parts[2].split(",")[0];
            battle[side].realName = realName;
          }
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-singleturn|`)) {
          const move = parts[2];
          const victimSide = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const prevMoveLine = dataArr[dataArr.length - 2];
          const prevMoveUserSide = prevMoveLine.split("|").slice(1)[1].split(": ")[0] as
            | "p1a"
            | "p1b"
            | "p2a"
            | "p2b";

          battle[victimSide].otherAffliction[move] =
            battle[prevMoveUserSide].realName || battle[prevMoveUserSide].name;

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-formechange|`)) {
          if (parts[2].includes("-Gmax")) {
            const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
            const realName = parts[2].split(",")[0];

            battle[side].realName = realName;
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-weather|`)) {
          if (!(line.includes("[upkeep]") || line.includes("none"))) {
            const weather = parts[1];
            let inflictor;
            try {
              const side = parts[3].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
              inflictor = battle[side].realName || battle[side].name;
            } catch (e) {
              const prevLine = dataArr[dataArr.length - 2];
              const side = prevLine.split("|").slice(1)[1].split(": ")[0] as
                | "p1a"
                | "p1b"
                | "p2a"
                | "p2b";
              inflictor = battle[side].realName || battle[side].name;
            }
            battle.setWeather(weather, inflictor);
          }

          if (parts[1] === "none") {
            battle.clearWeather();
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-activate|`)) {
          const move =
            parts[2].includes("move") || parts[2].includes("ability")
              ? parts[2].split(": ")[1]
              : parts[2];
          if (
            !(
              parts.length < 4 ||
              !parts[3].includes(": ") ||
              parts[2].includes("ability") ||
              parts[2].includes("item")
            )
          ) {
            const victimSide = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
            const inflictorSide = parts[3].split(" ")[1].split(":")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";

            battle[victimSide].otherAffliction[move] =
              battle[inflictorSide].realName || battle[inflictorSide].name;
          }
          if (!(move === "Destiny Bond" || move === "Synchronize" || move === "Powder"))
            dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|move|`)) {
          const move = parts[2];

          if (line.includes("[miss]")) {
            const inflictorSide = parts[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";
            const victimSide = parts[3].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";
            battle.history.push(
              `${battle[inflictorSide].realName || battle[inflictorSide].name} missed ${move} against ${battle[victimSide].realName || battle[victimSide].name} (Turn ${battle.turns}).`
            );
          }
        } else if (line.startsWith(`|-crit|`)) {
          const victimSide = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const prevMoveLine = dataArr[dataArr.length - 2];
          if (prevMoveLine) {
            const prevParts = prevMoveLine.split("|").slice(1);
            const prevMove = prevParts[2];
            const inflictorSide = prevParts[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";

            battle.history.push(
              `${battle[inflictorSide].realName || battle[inflictorSide].name} used ${prevMove} with a critical hit against ${battle[victimSide].realName || battle[victimSide].name} (Turn ${battle.turns}).`
            );
          }
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-status|`)) {
          const prevMoveLine = dataArr[dataArr.length - 2];
          const prevMove = prevMoveLine.split("|").slice(1)[2];
          const prevParts = prevMoveLine.split("|").slice(1);
          const prevPrevMoveLine = dataArr[dataArr.length - 3];
          const prevPrevMove = prevPrevMoveLine.split("|").slice(1)[2];

          const victimSide = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          let inflictor = "";
          let victim = "";

          if (prevMoveLine.includes("Synchronize")) {
            const inflictorSide = prevParts[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";

            inflictor = battle[inflictorSide].name;
            victim = battle[victimSide].realName || battle[victimSide].name;
            battle[victimSide].statusEffect(
              parts[2] === "tox" ? "psn" : parts[2],
              inflictor,
              "P"
            );
            inflictor = battle[inflictorSide].realName || battle[inflictorSide].name;
          } else if (
            (prevMoveLine.startsWith(`|move|`) && consts.statusMoves.includes(prevMove)) ||
            (prevPrevMoveLine.startsWith(`|move|`) &&
              consts.statusMoves.includes(prevPrevMove))
          ) {
            const inflictorSide = (
              prevMoveLine.startsWith(`|move|`) && consts.statusMoves.includes(prevMove)
                ? prevMoveLine.split("|").slice(1)[1].split(": ")[0]
                : prevPrevMoveLine.split("|").slice(1)[1].split(": ")[0]
            ) as "p1a" | "p1b" | "p2a" | "p2b";

            inflictor = battle[inflictorSide].name;
            battle[victimSide].statusEffect(
              parts[2] === "tox" ? "psn" : parts[2],
              inflictor,
              "P"
            );
            inflictor = battle[inflictorSide].realName || battle[inflictorSide].name;
            victim = battle[victimSide].realName || battle[victimSide].name;
          } else if (
            (line.includes("ability") &&
              consts.statusAbility.includes(
                parts[3].split("ability: ")[1].split("|")[0]
              )) ||
            line.includes("item")
          ) {
            const inflictorSide = (
              line.includes("item: ")
                ? victimSide
                : parts[4].split("[of] ")[1].split(": ")[0]
            ) as "p1a" | "p1b" | "p2a" | "p2b";
            inflictor = battle[inflictorSide].name;
            victim = battle[victimSide].realName || battle[victimSide].name;
            battle[victimSide].statusEffect(parts[2], inflictor, this.rules.abilityitem);
            inflictor = battle[inflictorSide].realName || battle[inflictorSide].name;
          } else {
            victim = battle[victimSide].realName || battle[victimSide].name;
            if (victimSide.startsWith("p1")) {
              inflictor = battle.hazardsSet.p1["Toxic Spikes"];
            } else {
              inflictor = battle.hazardsSet.p2["Toxic Spikes"];
            }
            battle[victimSide].statusEffect(parts[2], inflictor, "P");
          }
          battle.history.push(
            `${inflictor} caused ${parts[2]} on ${victim} (Turn ${battle.turns}).`
          );

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith("|cant|")) {
          const userSide = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";

          if (parts[2].includes("flinch")) {
            battle.history.push(
              `${battle[userSide].realName} flinched (Turn ${battle.turns}).`
            );
          }
        } else if (line.startsWith("|-sidestart|")) {
          const prevLine = dataArr[dataArr.length - 2];
          if (prevLine) {
            const prevParts = prevLine.split("|").slice(1);
            const inflictorSide = prevParts[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";

            const inflictor = battle[inflictorSide].name;

            battle.addHazard(
              parts[1].split(": ")[0],
              parts[2].split(": ")[1] || parts[2],
              inflictor
            );
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-sideend|`)) {
          const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const hazard = parts[2];
          const prevMoveLine = dataArr[dataArr.length - 2];
          const prevMoveParts = prevMoveLine.split("|").slice(1);
          const move = parts[3]
            ? parts[3].split("move: ")[1]
            : prevMoveParts[2];
          let removerSide = (
            parts[4]
              ? parts[4].split("[of] ")[1].split(": ")[0]
              : prevMoveParts[1].split(": ")[0]
          ) as "p1a" | "p1b" | "p2a" | "p2b";
          if (!["p1a", "p1b", "p2a", "p2b"].includes(removerSide)) removerSide = side;

          battle.endHazard(side, hazard);

          battle.history.push(
            `${hazard} has been removed by ${battle[removerSide].realName || battle[removerSide].name} with ${move} (Turn ${battle.turns}).`
          );
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-start|`)) {
          const prevMove = dataArr[dataArr.length - 2];
          const affliction = parts[2];

          if (
            prevMove.startsWith(`|move|`) &&
            (prevMove.split("|").slice(1)[2] === affliction.split("move: ")[1] ||
              prevMove.split("|").slice(1)[2] === affliction ||
              consts.confusionMoves.includes(prevMove.split("|").slice(1)[2]) ||
              affliction.includes("perish") ||
              affliction === "Curse" ||
              affliction === "Nightmare")
          ) {
            const move = affliction.split("move: ")[1]
              ? affliction.split("move: ")[1]
              : affliction;
            const afflictorSide = prevMove.split("|").slice(1)[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";
            const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";

            if (move === "Future Sight" || move === "Doom Desire") {
              battle.hazardsSet[
                afflictorSide.substring(0, 2).includes("1")
                  ? afflictorSide.substring(0, 2).replace("1", "2")
                  : afflictorSide.substring(0, 2).replace("2", "1")
              ][move] = battle[afflictorSide].realName || battle[afflictorSide].name;
            } else {
              const afflictor = battle[afflictorSide].name;
              battle[side].otherAffliction[move] = afflictor;
            }
          } else if (affliction === `Substitute`) {
            const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
            battle[side].hasSubstitute = true;
          }

          if (affliction === `perish0`) {
            const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
            let killer = "";
            const afflictor = battle[side].otherAffliction["perish3"];
            const victim = battle[side].realName || battle[side].name;
            const afflictorPlayer = (side.substring(0, 2) == "p1" ? "p2" : "p1") as
              | "p1"
              | "p2";

            if (
              battle[`${afflictorPlayer}Pokemon` as const][afflictor] &&
              afflictor !== victim
            ) {
              const deathJson = battle[side].died(affliction, afflictor, true);
              battle[`${afflictorPlayer}Pokemon` as const][afflictor].killed(deathJson);

              killer = afflictor;
            } else {
              if (this.rules.suicide !== "N") {
                killer =
                  battle[`${afflictorPlayer}a` as const].realName ||
                  battle[`${afflictorPlayer}a` as const].name;
              }

              const deathJson = battle[side].died(
                prevMove,
                killer,
                this.rules.suicide === "P"
              );
              if (killer) {
                battle[`${afflictorPlayer}Pokemon` as const][killer].killed(deathJson);
              }
            }

            battle.history.push(
              `${victim} was killed by ${killer} due to Perish Song (passive) (Turn ${battle.turns})`
            );
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-immune|`)) {
          const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const playerSide = side.substring(0, 2) as "p1" | "p2";

          if (battle[side].isDead) {
            battle[side].undied();
            battle[`${playerSide}Pokemon` as const][battle[side].killer].unkilled();
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-end|`)) {
          const historyLine =
            battle.history.filter((line) => line.includes(" was killed by "))[
              battle.history.length - 1
            ] || "";

          if (
            line.endsWith("Illusion") &&
            historyLine.includes(battle.turns.toString())
          ) {
            const historyLineParts = historyLine.split(" ");
            const victim = historyLine.split(" was killed by ")[0];
            const killer = historyLine.split(" was killed by ")[1].split(" due to ")[0];
            const isPassive =
              historyLineParts[historyLineParts.length - 2] === "(passive)";

            if (battle.p1Pokemon[victim]) {
              battle.p1Pokemon[victim].undied();
              battle.p2Pokemon[killer].unkilled(isPassive);
            } else {
              battle.p2Pokemon[victim].undied();
              battle.p1Pokemon[killer].unkilled(isPassive);
            }
            battle.history.splice(battle.history.length - 1, 1);
          }
          if (!(line.endsWith("Future Sight") || line.endsWith("Doom Desire")))
            dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-curestatus|`)) {
          const side = parts[1].split(": ")[0] as "p1a" | "p1b" | "p2a" | "p2b";
          const playerSide = side.substring(0, 2) as "p1" | "p2";
          if (!(side.endsWith("a") || side.endsWith("b"))) {
            for (const pokemon of Object.keys(
              battle[`${playerSide}Pokemon` as const]
            )) {
              battle[`${playerSide}Pokemon` as const][pokemon].statusFix();
            }
          } else {
            battle[side].statusFix();
          }
        } else if (line.startsWith(`|-damage|`)) {
          if (parts[2].endsWith("fnt") || parts[2].startsWith("0")) {
            const victimSide = parts[1].split(": ")[0] as
              | "p1a"
              | "p1b"
              | "p2a"
              | "p2b";
            const victimPlayerSide = victimSide.substring(0, 2) as "p1" | "p2";
            const oppositeSide = (
              victimSide.startsWith("p1")
                ? victimSide.replace("1", "2")
                : victimSide.replace("2", "1")
            ) as "p1a" | "p1b" | "p2a" | "p2b";
            const oppositePlayerSide = oppositeSide.substring(0, 2) as "p1" | "p2";
            const prevMoveLine = dataArr[dataArr.length - 2];

            if (!prevMoveLine) {
              // do nothing
            }

            const prevMoveParts = prevMoveLine.split("|").slice(1);
            let prevMove;
            try {
              prevMove = prevMoveParts[2].split(": ")[1];
            } catch (e) {
              prevMove = "";
            }
            let killer = "";
            let victim = "";
            let reason = "";

            if (parts[3] && parts[3].includes("[from]")) {
              const move = parts[3].split("[from] ")[1];

              if (consts.hazardMoves.includes(move)) {
                killer = battle.hazardsSet[victimSide.substring(0, 2)][move];
                const deathJson = battle[victimSide].died(move, killer, true);
                if (
                  Object.keys(
                    battle[`${victimPlayerSide}Pokemon` as const]
                  ).includes(killer)
                ) {
                  killer =
                    this.rules.selfteam !== "N"
                      ? battle[oppositeSide].realName || battle[oppositeSide].name
                      : "";
                }

                if (killer) {
                  battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                    deathJson
                  );
                }
                victim = battle[victimSide].realName || battle[victimSide].name;

                reason = `${move} (passive) (Turn ${battle.turns})`;
              } else if (move === "Hail" || move === "Sandstorm") {
                killer = battle.weatherInflictor.split("-")[0];

                const deathJson = battle[victimSide].died(move, killer, true);
                if (
                  Object.keys(
                    battle[`${victimPlayerSide}Pokemon` as const]
                  ).includes(killer)
                )
                  killer =
                    this.rules.selfteam !== "N"
                      ? battle[oppositeSide].realName || battle[oppositeSide].name
                      : "";

                if (killer) {
                  battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                    deathJson
                  );
                } else {
                  killer = "an ally";
                }
                victim = battle[victimSide].realName || battle[victimSide].name;

                reason = `${move} (passive) (Turn ${battle.turns})`;
              } else if (move === "brn" || move === "psn") {
                killer = battle[victimSide].statusInflictor;

                const deathJson = battle[victimSide].died(move, killer, true);
                if (
                  Object.keys(
                    battle[`${victimPlayerSide}Pokemon` as const]
                  ).includes(killer)
                ) {
                  killer =
                    this.rules.selfteam !== "N" ? battle[oppositeSide].name : "";
                }

                if (killer) {
                  battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                    deathJson
                  );
                }

                victim = battle[victimSide].realName || battle[victimSide].name;
                reason = `${move} (${
                  battle[victimSide].statusType === "P" ? "passive" : "direct"
                }) (Turn ${battle.turns})`;
              } else if (
                consts.recoilMoves.includes(move) ||
                move.toLowerCase() === "recoil"
              ) {
                if (this.rules.recoil !== "N") killer = battle[oppositeSide].name;
                else killer = "";

                const deathJson = battle[victimSide].died(
                  "recoil",
                  killer,
                  this.rules.recoil === "P"
                );

                if (killer) {
                  battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                    deathJson
                  );
                }
                victim = battle[victimSide].realName || battle[victimSide].name;

                reason = `recoil (${
                  this.rules.recoil === "P" ? "passive" : "direct"
                }) (Turn ${battle.turns})`;
              } else if (
                move.startsWith(`item: `) ||
                move.includes(`ability: `) ||
                (parts[3] && parts[3].includes("Spiky Shield"))
              ) {
                const item = parts[3]
                  ? parts[3].split("[from] ")[1]
                  : move.split(": ")[1];
                const owner = parts[4]
                  ? parts[4].split(": ")[0].split("] ")[1] || ""
                  : parts[1].split(": ")[0];

                if (owner === victimSide) {
                  victim = battle[owner].realName || battle[owner].name;
                  if (this.rules.suicide !== "N")
                    victim = battle[victimSide].realName || battle[victimSide].name;

                  const deathJson = battle[victimSide].died(
                    prevMove,
                    killer,
                    this.rules.suicide === "P"
                  );
                  if (killer) {
                    battle.p2Pokemon[killer].killed(deathJson);
                  }
                  killer = "suicide";
                  reason = `${item} (${
                    this.rules.suicide === "P" ? "passive" : "direct"
                  }) (Turn ${battle.turns})`;
                } else {
                  if (!battle[victimSide].isDead) {
                    victim = battle[victimSide].realName || battle[victimSide].name;

                    if (this.rules.abilityitem !== "N")
                      killer =
                        battle[oppositeSide].realName || battle[oppositeSide].name;
                    else killer = "";

                    const deathJson = battle[victimSide].died(
                      item,
                      killer,
                      this.rules.abilityitem === "P"
                    );
                    if (killer)
                      battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                        deathJson
                      );
                  }

                  reason = `${item} (${
                    this.rules.abilityitem === "P" ? "passive" : "direct"
                  }) (Turn ${battle.turns})`;
                }
              } else {
                let afflictionMove = move.includes("move: ")
                  ? move.split(": ")[1]
                  : move;

                killer = battle[victimSide].otherAffliction[afflictionMove] || "";
                victim = battle[victimSide].realName || battle[victimSide].name;

                if (victim.includes(killer) || killer.includes(victim))
                  killer =
                    battle[oppositeSide].realName || battle[oppositeSide].name;

                const deathJson = battle[victimSide].died(
                  prevMove,
                  killer,
                  this.rules.suicide === "P"
                );
                battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                  deathJson
                );

                reason = `${afflictionMove} (passive) (Turn ${battle.turns})`;
              }
            } else if (prevMove === "Future Sight" || prevMove === "Doom Desire") {
              killer = battle.hazardsSet[victimPlayerSide][prevMove];
              const deathJson = battle[victimSide].died(prevMove, killer, false);
              battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(deathJson);

              reason = `${prevMove} (passive) (Turn ${battle.turns})`;
            } else if (prevMoveLine.includes("|-activate|")) {
              killer = battle[victimSide].otherAffliction[prevMove];
              const deathJson = battle[victimSide].died(prevMove, killer, false);
              battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(deathJson);

              victim = battle[victimSide].realName || battle[victimSide].name;
              reason = `${prevMove} (direct) (Turn ${battle.turns})`;
            } else {
              if (
                !(
                  ((prevMoveLine.startsWith(`|move|`) &&
                    (prevMoveLine.includes("Self-Destruct") ||
                      prevMoveLine.includes("Explosion") ||
                      prevMoveLine.includes("Misty Explosion") ||
                      prevMoveLine.includes("Memento") ||
                      prevMoveLine.includes("Healing Wish") ||
                      prevMoveLine.includes("Final Gambit") ||
                      prevMoveLine.includes("Lunar Dance"))) ||
                    prevMoveLine.includes("Curse")) &&
                  prevMoveParts[1].includes(victimSide)
                )
              ) {
                prevMove = prevMoveLine.split("|").slice(1)[2];
                const prevMoveUserSide = prevMoveParts[1].split(": ")[0] as
                  | "p1a"
                  | "p1b"
                  | "p2a"
                  | "p2b";

                killer =
                  battle[prevMoveUserSide].realName || battle[prevMoveUserSide].name;
                const deathJson = battle[victimSide].died("direct", killer, false);
                battle[prevMoveUserSide].killed(deathJson);

                if (
                  (victimSide ||
                    (victimSide &&
                      prevMoveParts[4] &&
                      prevMoveParts[4].includes("[spread]") &&
                      prevMoveParts[4].includes(victimSide))) &&
                  battle[victimSide].isDead
                )
                  victim = battle[victimSide].realName || battle[victimSide].name;

                reason = `${prevMove} (direct) (Turn ${battle.turns})`;
              }
            }

            if (victim && reason) {
              battle.history.push(
                `${victim} was killed by ${killer} due to ${reason}.`
              );
            }
          }
          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|faint|`)) {
          const victimSide = parts[1].split(": ")[0] as
            | "p1a"
            | "p1b"
            | "p2a"
            | "p2b";
          const victimPlayerSide = victimSide.substring(0, 2) as "p1" | "p2";
          const oppositeSide = (
            victimSide.startsWith("p1")
              ? victimSide.replace("1", "2")
              : victimSide.replace("2", "1")
          ) as "p1a" | "p1b" | "p2a" | "p2b";
          const oppositePlayerSide = oppositeSide.substring(0, 2) as "p1" | "p2";
          const prevLine = dataArr[dataArr.length - 2];
          if (prevLine) {
            const prevParts = prevLine.split("|").slice(1);

            if (
              prevLine.startsWith(`|-activate|`) &&
              prevLine.endsWith(`Destiny Bond`)
            ) {
              const killerSide = prevLine.split("|").slice(1)[1].split(": ")[0] as
                | "p1a"
                | "p1b"
                | "p2a"
                | "p2b";
              let killer = "";
              const victim = battle[victimSide].realName || battle[victimSide].name;
              if (this.rules.db !== "N") {
                killer = battle[killerSide].name;
              }

              const deathJson = battle[victimSide].died(
                "Destiny Bond",
                killer,
                this.rules.db === "P"
              );
              battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(deathJson);

              battle.history.push(
                `${victim} was killed by ${killer} due to Destiny Bond (Turn ${battle.turns}).`
              );
            } else if (
              (prevLine.startsWith(`|move|`) &&
                (prevLine.includes("Self-Destruct") ||
                  prevLine.includes("Explosion") ||
                  prevLine.includes("Misty Explosion") ||
                  prevLine.includes("Memento") ||
                  prevLine.includes("Healing Wish") ||
                  prevLine.includes("Final Gambit") ||
                  prevLine.includes("Lunar Dance"))) ||
              prevLine.includes("Curse")
            ) {
              const prevMove = prevParts[2];

              let killer = "";
              let victim = "";
              if (this.rules.suicide !== "N") {
                const newSide = (
                  prevParts[1].split(": ")[0].endsWith("a") ||
                  prevParts[1].split(": ")[0].endsWith("b")
                    ? prevParts[1].split(": ")[0]
                    : `${prevParts[1].split(": ")[0]}a`
                ) as "p1a" | "p1b" | "p2a" | "p2b";

                killer = battle[newSide].realName || battle[newSide].name;
              }

              if (!battle[victimSide].isDead) {
                victim = battle[victimSide].realName || battle[victimSide].name;

                const deathJson = battle[victimSide].died(
                  prevMove,
                  killer,
                  this.rules.suicide === "P"
                );
                if (killer && killer !== victim) {
                  battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(
                    deathJson
                  );
                }

                battle.history.push(
                  `${victim} was killed by ${killer || "suicide"} due to ${prevMove} (${
                    this.rules.suicide === "P" ? "passive" : "direct"
                  }) (Turn ${battle.turns}).`
                );
              }
            } else {
              let killer = "";
              let victim = "";
              if (!battle[victimSide].isDead) {
                const killerSide = prevParts[1].split(": ")[0] as
                  | "p1a"
                  | "p1b"
                  | "p2a"
                  | "p2b";
                killer = battle[killerSide].realName || battle[killerSide].name;
                victim = battle[victimSide].realName || battle[victimSide].name;

                const deathJson = battle[victimSide].died("faint", killer, false);
                battle[`${oppositePlayerSide}Pokemon` as const][killer].killed(deathJson);
              }

              if (killer && victim) {
                battle.history.push(
                  `${victim} was killed by ${killer} (Turn ${battle.turns}).`
                );
              }
            }
          }

          dataArr.splice(dataArr.length - 1, 1);
        } else if (line.startsWith(`|-message|`)) {
          const messageParts = parts[1].split(" forfeited");
          if (line.endsWith("forfeited.")) {
            const forfeiter = messageParts[0];
            const forfeiterSide = (forfeiter === battle.p1 ? "p1" : "p2") as
              | "p1"
              | "p2";
            const winnerSide = (forfeiterSide === "p1" ? "p2" : "p1") as "p1" | "p2";
            if (this.rules.forfeit !== "N") {
              let numDead = 0;

              for (const pokemon of Object.values(
                battle[`${forfeiterSide}Pokemon` as const]
              )) {
                if (!pokemon.isDead) numDead++;
              }
              battle[`${winnerSide}a` as const][
                `current${this.rules.forfeit as "D" | "P"}Kills` as const
              ] += numDead;
            }
            battle.forfeiter = forfeiter;
          }

          dataArr.splice(dataArr.length - 1, 1);
        }
      }

      return this.buildErrorResult(
        [battle.p1, battle.p2],
        "Replay could not be analyzed properly. Please try again."
      );
    } catch (e: any) {
      return this.buildErrorResult(
        [battle.p1, battle.p2],
        `Error analyzing match ${this.battlelink}: ${e.message}`
      );
    }
  }

  private buildErrorResult(playerNames: string[], error: string): ReplayAnalysis {
    return {
      players: {},
      playerNames,
      info: {
        replay: "",
        history: "",
        turns: 0,
        winner: "",
        loser: "",
        rules: this.rules,
        result: "",
        battleId: "",
      },
      error,
    };
  }
}
