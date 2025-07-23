import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PaginatedObject from 'src/models/PaginatedObject';
import { In, Repository } from 'typeorm';
import { Topic } from 'src/models/Topic';
import { AppService } from 'src/app.service';
import { Status } from 'src/datas/enums/status';

@Injectable()
export class TopicService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Topic)
    protected readonly topicRepo: Repository<Topic>,
  ) {}

  /** METHODS **/
  /**
   * to get paginated topics
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Topic>>
   */
  async getPaginatedTopics(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    key: string = '',
  ): Promise<PaginatedObject<Topic>> {
    try {
      const totalData = await this.topicRepo.count();

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
      const [topics, total] = await this.topicRepo
        .createQueryBuilder('topics')
        .where(
          'topics.status = :status AND (topics.title LIKE :key OR topics.short_desc LIKE :key OR topics.updated_at LIKE :key)',
          {
            status: Status.ACTIVE,
            key: `%${key}%`,
          },
        )
        .skip(skip)
        .take(take)
        .orderBy('topics.updated_at', 'DESC')
        .addOrderBy('topics.title', 'ASC')
        .getManyAndCount();

      // AppService.debug('topics', topics);

      return new PaginatedObject(page, perPage, key, total, topics);
    } catch (e) {
      AppService.error('Cannot paginate topics', e);
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * get deleted topics
   * @returns
   */
  async getDeletedTopics(): Promise<Topic[]> {
    // GET DELETED AI ACCOUNTS
    const topics = await this.topicRepo.find({
      where: { status: Status.DELETED },
    });

    return topics;
  }

  /**
   * get a topic by id
   * @returns
   */
  async getTopicById(id: number): Promise<Topic | null> {
    // QUERY AND RETURN DATA
    const topic = await this.topicRepo.findOne({
      where: { id: id },
    });

    return topic;
  }

  /**
   * get a random topic
   * @returns
   */
  async getRandomTopic(): Promise<Topic | null> {
    // QUERY AND RETURN DATA
    const topic = await this.topicRepo
      .createQueryBuilder('topics')
      .orderBy('RAND()') // MySQL uses RAND()
      .limit(1)
      .getOne();

    return topic;
  }

  /**
   * to store a topic into databse
   * @param topic
   * @returns boolean
   */
  async store(topic: Topic): Promise<boolean> {
    try {
      await this.topicRepo.save(topic);

      return true;
    } catch (error) {
      AppService.error('Cannot store topic', error);
      return false;
    }
  }

  /**
   * to delete topic by their ids
   * @param ids
   * @returns
   */
  async deleteByIds(ids: number[]): Promise<boolean> {
    // CHECK EXIST IDS
    let topics: Topic[] = [];

    try {
      topics = await this.topicRepo.find({
        where: { id: In(ids) },
        relations: ['conversations'],
      });
    } catch (error) {
      AppService.debug('Cannot get topics with their ids', error);
      return false;
    }

    if (topics.length !== ids.length) {
      AppService.error('List of ids has not found topic(s)');
      return false;
    }

    let flag = true;
    topics.forEach((topic) => {
      if (topic.conversations.length > 0) {
        AppService.error('List of ids has used topic(s)');
        flag = false;
      } else {
        topic.status = Status.DELETED;
      }
    });

    if (!flag) return flag;

    try {
      await this.topicRepo.save(topics);

      return true;
    } catch (error) {
      AppService.error('Cannot set deleted status for topcis', error);
      return false;
    }
  }

  /**
   * to delete topic forever
   */
  async delete(topic: Topic): Promise<boolean> {
    try {
      await this.topicRepo.remove(topic);

      return true;
    } catch (error) {
      AppService.error('Cannot delete topic', error);
      return false;
    }
  }
}
