import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { ItemInputDto } from '../dtos/item.dto';

@Service()
export class ItemService extends BaseService<Item, ItemInputDto> {
  constructor(
    @Inject('ItemRepository')
    private ItemRepository: Repository<Item>,
  ) {
    super(ItemRepository, 'Item');
  }
}
