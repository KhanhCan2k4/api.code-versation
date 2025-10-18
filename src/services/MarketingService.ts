import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PaginatedObject from 'src/models/PaginatedObject';
import { In, Repository } from 'typeorm';
import { AppService } from 'src/app.service';
import { Status } from 'src/datas/enums/status';
import { Marketing } from 'src/models/Marketing';

@Injectable()
export class MarketingService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Marketing)
    protected readonly marketingRepo: Repository<Marketing>,
  ) {}

  /** METHODS **/
  /**
   * to get paginated marketings
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Marketing>>
   */
  async getPaginatedMarketings(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    key: string = '',
  ): Promise<PaginatedObject<Marketing>> {
    try {
      const totalData = await this.marketingRepo.count();

      if (perPage < 1) {
        perPage = this.PER_PAGE;
      }

      const lastPage = Math.ceil((totalData * 1.0) / perPage);

      if (page < 1 || page > lastPage) {
        page = 1;
      }
    } catch (e) {
      page = 1;
      perPage = this.PER_PAGE;
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    try {
      const [marketings, total] = await this.marketingRepo
        .createQueryBuilder('marketings')
        .where(
          'marketings.status = :status AND (marketings.title LIKE :key OR marketings.content LIKE :key OR marketings.updated_at LIKE :key)',
          {
            status: Status.ACTIVE,
            key: `%${key}%`,
          },
        )
        .skip(skip)
        .take(take)
        .orderBy('marketings.updated_at', 'DESC')
        .addOrderBy('marketings.title', 'ASC')
        .getManyAndCount();

      // AppService.debug('marketings', marketings);

      return new PaginatedObject(page, perPage, key, total, marketings);
    } catch (e) {
      AppService.error('Cannot paginate marketings', e);
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * get deleted marketings
   * @returns
   */
  async getDeletedMarketings(): Promise<Marketing[]> {
    // GET DELETED AI ACCOUNTS
    const marketings = await this.marketingRepo.find({
      where: { status: Status.DELETED },
    });

    return marketings;
  }

  /**
   * get a marketing by id
   * @returns
   */
  async getMarketingById(id: number): Promise<Marketing | null> {
    // QUERY AND RETURN DATA
    const marketing = await this.marketingRepo.findOne({
      where: { id: id },
    });

    return marketing;
  }

  /**
   * get a marketings by ids
   * @returns
   */
  async getMarketingsByIds(ids: number[]): Promise<Marketing[]> {
    // QUERY AND RETURN DATA
    const marketings = await this.marketingRepo.find({
      where: { id: In(ids) },
    });

    return marketings;
  }

  /**
   * to store a marketing into databse
   * @param marketing
   * @returns boolean
   */
  async store(marketing: Marketing): Promise<boolean> {
    try {
      await this.marketingRepo.save(marketing);

      return true;
    } catch (error) {
      AppService.error('Cannot store marketing', error);
      return false;
    }
  }

  /**
   * to delete marketings by their ids
   * @param ids
   * @returns
   */
  async deleteByIds(ids: number[]): Promise<boolean> {
    // CHECK EXIST IDS
    let marketings: Marketing[] = [];

    try {
      marketings = await this.marketingRepo.find({
        where: { id: In(ids) },
      });

      // SET STATUS
      marketings.forEach((mar) => {
        mar.status = Status.DELETED;
      });

      await this.marketingRepo.save(marketings);

      return true;
    } catch (error) {
      AppService.debug('Cannot get marketings with their ids', error);
      return false;
    }
  }

  /**
   * to delete marketing forever
   */
  async delete(marketing: Marketing): Promise<boolean> {
    try {
      await this.marketingRepo.remove(marketing);

      return true;
    } catch (error) {
      AppService.error('Cannot delete marketing', error);
      return false;
    }
  }
}
