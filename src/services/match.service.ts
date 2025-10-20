import { Match } from '../entities/match.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { MatchInputDto } from '../dtos/match.dto';

@Service()
export class MatchService extends BaseService<Match, MatchInputDto> {
  constructor(
    @Inject('MatchRepository')
    private MatchRepository: Repository<Match>,
  ) {
    super(MatchRepository, 'Match');
  }
}
