import { Week } from "../entities/week.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { WeekInputDto } from "../dtos/week.dto";

@Service()
export class WeekService extends BaseService<Week, WeekInputDto> {
  constructor(
    @Inject('WeekRepository')
    private WeekRepository: Repository<Week>
  ) {
    super(WeekRepository, 'Week');
  }
}
