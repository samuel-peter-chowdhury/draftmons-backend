export class Pokemon {
  name: string;
  realName: string;
  status: string;
  statusInflictor: string;
  statusType: string;
  otherAffliction: { [key: string]: string };
  causeOfDeath: string;
  currentDKills: number;
  directKills: number;
  currentPKills: number;
  passiveKills: number;
  isDead: boolean;
  killer: string;
  hasSubstitute: boolean;

  constructor(pokemonName: string, realName?: string) {
    this.name = pokemonName;
    this.realName = realName || pokemonName;
    this.status = "n/a";
    this.statusInflictor = "";
    this.statusType = "";
    this.otherAffliction = {};
    this.causeOfDeath = "n/a";
    this.currentDKills = 0;
    this.directKills = 0;
    this.currentPKills = 0;
    this.passiveKills = 0;
    this.isDead = false;
    this.killer = "";
    this.hasSubstitute = false;
  }

  statusEffect(statusInflicted: string, statusInflictor: string, statusType: string) {
    this.status = statusInflicted;
    this.statusInflictor = statusInflictor;
    this.statusType = statusType;
  }

  statusFix() {
    this.status = "n/a";
    this.statusInflictor = "";
    this.statusType = "";
  }

  clearAfflictions() {
    this.otherAffliction = {};
  }

  killed(deathJson: { killer: string; isPassive: boolean }) {
    if (deathJson.killer) {
      if (deathJson.isPassive) this.currentPKills++;
      else this.currentDKills++;
    }
  }

  unkilled(isPassive?: boolean) {
    if (isPassive) this.currentPKills--;
    else this.currentDKills--;
  }

  died(causeOfDeath: string, killer: string, isPassive: boolean) {
    this.causeOfDeath = causeOfDeath;
    this.killer = killer ? killer : "";
    this.isDead = true;

    return {
      killer: killer,
      isPassive: isPassive,
    };
  }

  undied() {
    this.causeOfDeath = "";
    this.isDead = false;
  }
}
