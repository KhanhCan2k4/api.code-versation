import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/models/Account';
import { Conversation } from 'src/models/Conversation';
import PaginatedObject from 'src/models/PaginatedObject';
import { In, Not, Repository } from 'typeorm';
import { AccountService } from './AccountService';
import { AppService } from 'src/app.service';
import { LineOfSpeech } from 'src/models/LineOfSpeech';
import { Status } from 'src/datas/enums/status';
import { TopicService } from './TopicService';
import { Topic } from 'src/models/Topic';

@Injectable()
export class ConversationService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Conversation)
    protected readonly conRepo: Repository<Conversation>,
    @InjectRepository(LineOfSpeech)
    protected readonly lineRepo: Repository<LineOfSpeech>,
    protected readonly accountService: AccountService,
    protected readonly topicService: TopicService,
  ) {}

  /** METHODS **/
  /**
   * to get paginated conversations
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Account>>
   */
  async getPaginatedConversations(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    excludedIds: number[] = [],
    key?: string,
    attachedWelcome: boolean = true,
    lang: string = 'en-US',
  ): Promise<PaginatedObject<Conversation>> {
    try {
      const totalData = await this.conRepo.count();

      if (perPage < 1) {
        perPage = this.PER_PAGE;
      }

      const lastPage = Math.ceil((totalData * 1.0) / perPage);

      if (page < 1) {
        page = 1;
      }

      if (page > lastPage) {
        page = lastPage;
      }
    } catch (e) {
      page = 1;
      perPage = this.PER_PAGE;
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    try {
      const [cons, total] = await this.conRepo
        .createQueryBuilder('conversations')
        .where(
          `conversations.id NOT IN (:...excludedIds) 
            AND (conversations.lang = :lang)
            AND (conversations.topic_id > :min)
            AND (conversations.status = :status) 
            AND (conversations.title LIKE :key 
              OR conversations.short_desc LIKE :key 
              OR conversations.updated_at LIKE :key)`,
          {
            lang: lang,
            excludedIds: [...excludedIds, -1, -1],
            key: `%${key ?? ''}%`,
            status: Status.ACTIVE,
            min: attachedWelcome ? -2 : 0,
          },
        )
        .skip(skip)
        .take(take)
        .orderBy('updated_at', 'DESC')
        .addOrderBy('title', 'ASC')
        .getManyAndCount();

      // GET TOPICS WITH IDS IN LIST OF CONVERSATIONS
      const topics = await this.topicService.getTopicsByIds(
        cons.map((c) => c.topic_id),
      );

      // ATTACH TOPIC INTO CONVERSATION LIST
      cons.forEach((c) => {
        const newTopic = topics.find((t) => t.id === c.topic_id) ?? new Topic();
        newTopic.id = c.topic_id;
        c.topic = newTopic;
      });

      return new PaginatedObject(page, perPage, key, total, cons);
    } catch (e) {
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * to get paginated conversations by ids
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Account>>
   */
  async getPaginatedConversationsByIds(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    ids: number[] = [],
  ): Promise<PaginatedObject<Conversation>> {
    try {
      const totalData = await this.conRepo.count({
        where: { id: In(ids) },
      });

      if (perPage < 1) {
        perPage = this.PER_PAGE;
      }

      const lastPage = Math.ceil((totalData * 1.0) / perPage);

      if (page < 1) {
        page = 1;
      }

      if (page > lastPage) {
        page = lastPage;
      }
    } catch (e) {
      page = 1;
      perPage = this.PER_PAGE;
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    AppService.debug('paginated params: ', { ids, skip, take });

    try {
      const [cons, total] = await this.conRepo
        .createQueryBuilder('conversations')
        .where(
          `conversations.id IN (:...ids)
            AND (conversations.topic_id > 0)
            AND (conversations.status = :status)`,
          {
            ids: [...ids, -1, -1],
            status: Status.ACTIVE,
          },
        )
        .skip(skip)
        .take(take)
        .orderBy('updated_at', 'DESC')
        .addOrderBy('title', 'ASC')
        .getManyAndCount();

      // AppService.debug('cons', cons);

      // GET TOPICS WITH IDS IN LIST OF CONVERSATIONS
      const topics = await this.topicService.getTopicsByIds(
        cons.map((c) => c.topic_id),
      );

      // ATTACH TOPIC INTO CONVERSATION LIST
      cons.forEach((c) => {
        const newTopic = topics.find((t) => t.id === c.topic_id) ?? new Topic();
        newTopic.id = c.topic_id;
        c.topic = newTopic;
      });

      return new PaginatedObject(page, perPage, '', total, cons);
    } catch (e) {
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * get a random welcome conversation
   * @returns
   */
  async getWelcomeConversation(lang: string): Promise<{
    conversation: Conversation | null;
    lang: string;
  }> {
    // GET WELCOME CONVERSATION IDS
    const welcomeConIds = (
      await this.conRepo
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.lines', 'line')
        .where(
          `conversation.topic_id = :topicId 
            AND (conversation.lang = :lang 
            OR conversation.lang = :langDefault)`,
          { topicId: -1, lang: lang, langDefault: 'en-US' },
        )
        .groupBy('conversation.id, line.id')
        .having('COUNT(line.id) > 0')
        .getMany()
    ).map((c) => c.id);

    const id = welcomeConIds[Math.floor(Math.random() * welcomeConIds.length)];

    // AppService.debug('Welcome conversation id', { id });

    // QUERY AND RETURN DATA
    const conversation = await this.conRepo.findOne({
      where: { id: id },
      relations: ['lines', 'lines.speaker'],
    });

    return { conversation, lang: conversation?.lang ?? 'en-US' };
  }

  /**
   * get lines by ids
   */
  async getLinesByIds(ids: number[]): Promise<LineOfSpeech[]> {
    try {
      return await this.lineRepo.find({
        where: { id: In(ids) },
        relations: ['speaker'],
      });
    } catch (error) {
      AppService.error('Cannot get lines by ids', error);
      return [];
    }
  }

  /**
   * to save conversation into database
   * @param conversation
   * @returns boolean
   */
  async saveConversation(
    conversation: Conversation,
  ): Promise<Conversation | null> {
    // AppService.debug('conversation', conversation);
    const line_of_speechs = [...conversation.lines];

    try {
      const savedCon = await this.conRepo.save({ ...conversation, lines: [] });
      // AppService.debug('savedCon', savedCon);

      try {
        // SAVE LINES OF SPEECHS
        // AppService.debug('lines', line_of_speechs);

        line_of_speechs.forEach((line) => {
          line.conversation = new Conversation();
          line.conversation.id = savedCon.id;
          line.conversation_id = savedCon.id;
          line.speaker = new Account();
          line.speaker.id = line.speaker_id;
        });

        // AppService.debug('lines', line_of_speechs);

        await this.lineRepo.save(line_of_speechs);
      } catch (error) {
        AppService.error(
          "Cannot save conversation's lines into database",
          error,
        );
        await this.conRepo.delete(savedCon);
        return null;
      }

      return savedCon;
    } catch (error) {
      AppService.error('Cannot save conversation into database', error);
      return null;
    }
  }

  /**
   * get all deleted conversations
   */
  async getDeletedConversations(): Promise<Conversation[]> {
    try {
      const cons = await this.conRepo.find({
        where: { status: Status.DELETED },
      });

      return cons;
    } catch (error) {
      AppService.error('Cannot get deleted conversations', error);
      return [];
    }
  }

  /**
   * to save conversations into database
   * @param conversations
   * @returns boolean
   */
  async saveConversations(conversations: Conversation[]): Promise<boolean> {
    try {
      await this.conRepo.save(conversations);

      return true;
    } catch (error) {
      AppService.error('Cannot save conversations into database', error);
      return false;
    }
  }

  /**
   * get all conversations by ids
   * @param ids
   * @returns
   */
  async getConversationsByIds(
    ids: number[],
    loadLine: boolean = false,
  ): Promise<Conversation[]> {
    try {
      const conversations = await this.conRepo.find({
        where: { id: In(ids) },
        relations: loadLine ? ['lines'] : [],
      });

      return conversations;
    } catch (error) {
      AppService.error('Cannot get conversations by ids', error);
      return [];
    }
  }

  /**
   * get 50 latest conversations
   * @returns
   */
  async getLatestConversations(
    limit: number = 50,
    loadLine: boolean = false,
    oldId: number[] = [],
  ): Promise<Conversation[]> {
    try {
      const conversations = await this.conRepo.find({
        where: { id: Not(In([...oldId, -1, -1])) },
        relations: loadLine ? ['lines'] : [],
        take: limit,
        order: { updatedAt: { direction: 'DESC' } },
      });

      return conversations;
    } catch (error) {
      AppService.error('Cannot get latest conversations', error);
      return [];
    }
  }

  /**
   * get all conversation by id
   * @param id
   * @returns
   */
  async getConversationById(id: number): Promise<Conversation | null> {
    try {
      const conversation = await this.conRepo.findOne({
        where: { id: id },
        relations: ['lines', 'lines.speaker', 'topic'],
      });

      return conversation;
    } catch (error) {
      AppService.error('Cannot get conversation by id', error);
      return null;
    }
  }

  /**
   * to delete a conversation forever
   * @param con
   * @returns
   */
  async delete(con: Conversation): Promise<boolean> {
    try {
      await this.conRepo.remove(con);

      return true;
    } catch (error) {
      AppService.error('Cannot delete conversation', error);
      return false;
    }
  }

  /**
   * to get a line in a conversation by it's id
   * @param id
   * @returns
   */
  async getLineOfSpeechById(id: number): Promise<LineOfSpeech | null> {
    return this.lineRepo.findOne({
      where: { id: id },
      relations: ['conversation'],
    });
  }

  /**
   * to save line of speech into database
   * @param line
   * @returns
   */
  async saveLineOfSpeech(line: LineOfSpeech): Promise<boolean> {
    try {
      await this.lineRepo.save(line);

      return true;
    } catch (error) {
      AppService.error('Cannot save line into database', error);
      return false;
    }
  }
}
