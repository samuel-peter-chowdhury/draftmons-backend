import { Expose } from 'class-transformer';

export class DiscordGuildOutputDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  linkedLeagueName: string | null;
}

export class DiscordChannelOutputDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
