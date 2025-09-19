import { Move } from "../entities/move.entity";
import { BaseService } from "./base.service";
import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { MoveInputDto } from "../dtos/move.dto";

@Service()
export class MoveService extends BaseService<Move, MoveInputDto> {
  constructor(
    @Inject('MoveRepository')
    private MoveRepository: Repository<Move>
  ) {
    super(MoveRepository, 'Move');
  }
}
