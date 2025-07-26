import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Practice } from 'src/models/Practice';
import { Account } from 'src/models/Account';
import { Question } from 'src/models/Question';
import { AppService } from 'src/app.service';
import PaginatedObject from 'src/models/PaginatedObject';

@Injectable()
export class PracticeService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Practice)
    protected readonly practiceRepo: Repository<Practice>,
    @InjectRepository(Question)
    protected readonly questionRepo: Repository<Question>,
  ) {}

  /** METHODS **/
  /**
   * to get paginated practices
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Topic>>
   */
  async getPaginatedPractices(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    key: string = '',
  ): Promise<PaginatedObject<Practice>> {
    try {
      const totalData = await this.practiceRepo.count();

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
      const [practices, total] = await this.practiceRepo
        .createQueryBuilder('practices')
        .skip(skip)
        .take(take)
        .orderBy('practices.updated_at', 'DESC')
        .getManyAndCount();

      // AppService.debug('practices', practices);

      return new PaginatedObject(page, perPage, key, total, practices);
    } catch (e) {
      AppService.error('Cannot paginate practices', e);
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * get a practice with the id or return the default one
   * @param id
   * @param account
   * @returns
   */
  async getPractice(
    id: number,
    account: Account | null,
  ): Promise<Practice | null> {
    // DEFAULT PRACTICE WHEN ACCESSING NOT AS A USER
    if (!account) {
      const defaultPractices = await this.practiceRepo.find({
        where: { account: undefined },
        relations: ['account', 'questions'],
      });

      if (defaultPractices.length === 0) return null;

      return defaultPractices[
        Math.floor(Math.random() * defaultPractices.length)
      ];
    }

    // PRACTICE OF AN ACCOUNT
    const practice = await this.practiceRepo.findOne({
      where: { id: id, account_id: account.id },
      relations: ['account', 'questions'],
    });

    return practice;
  }

  /**
   * to save a question into database
   * @param question
   * @returns boolean
   */
  async saveQuestionInPractice(question: Question): Promise<boolean> {
    try {
      await this.questionRepo.save(question);
      return true;
    } catch (error) {
      AppService.error('Cannot save question', error);
      return false;
    }
  }

  /**
   * to get a question by its id
   * @param id
   * @returns
   */
  async getQuestionInPracticeById(id: number): Promise<Question | null> {
    try {
      return this.questionRepo.findOne({
        where: { id: id },
        relations: ['practice'],
      });
    } catch (error) {
      AppService.error('Cannot find question', error);
      return null;
    }
  }
}
