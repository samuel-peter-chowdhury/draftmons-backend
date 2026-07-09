import { EventEmitter } from 'events';
import { Service } from 'typedi';
import { Match } from '../entities/match.entity';
import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';

export interface MatchCompletedPayload {
  match: Match;
}

export interface DraftPickPayload {
  seasonPokemonTeam: SeasonPokemonTeam;
}

@Service()
export class DomainEventBus extends EventEmitter {
  emitMatchCompleted(payload: MatchCompletedPayload): void {
    this.emit('match.completed', payload);
  }

  emitDraftPick(payload: DraftPickPayload): void {
    this.emit('draft.pick', payload);
  }
}
