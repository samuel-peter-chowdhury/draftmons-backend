import { Service, Inject } from 'typedi';
import { DomainEventBus, MatchCompletedPayload, DraftPickPayload } from '../events/domain-event-bus';
import { DiscordService } from './discord.service';

@Service()
export class NotificationService {
  constructor(
    @Inject()
    private eventBus: DomainEventBus,
    @Inject()
    private discordService: DiscordService,
  ) {}

  initialize(): void {
    this.eventBus.on('match.completed', async (payload: MatchCompletedPayload) => {
      await this.discordService
        .sendMatchNotification(payload.match)
        .catch((err: unknown) => {
          console.error('[notification] match.completed listener error', err);
        });
    });

    this.eventBus.on('draft.pick', async (payload: DraftPickPayload) => {
      await this.discordService
        .sendDraftPickNotification(payload.seasonPokemonTeam)
        .catch((err: unknown) => {
          console.error('[notification] draft.pick listener error', err);
        });
    });
  }
}
