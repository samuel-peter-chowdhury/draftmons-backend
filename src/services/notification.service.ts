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
      // Added in Plan 02
      await (this.discordService as any)
        .sendMatchNotification(payload.match)
        .catch((err: unknown) => {
          console.error('[notification] match.completed listener error', err);
        });
    });

    this.eventBus.on('draft.pick', async (payload: DraftPickPayload) => {
      // Added in Plan 02
      await (this.discordService as any)
        .sendDraftPickNotification(payload.seasonPokemonTeam)
        .catch((err: unknown) => {
          console.error('[notification] draft.pick listener error', err);
        });
    });
  }
}
