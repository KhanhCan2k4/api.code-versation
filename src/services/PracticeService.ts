import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from 'src/models/Question';
import { AppService } from 'src/app.service';
import { Conversation } from 'src/models/Conversation';

@Injectable()
export class PracticeService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Conversation)
    protected readonly conRepo: Repository<Conversation>,
    @InjectRepository(Question)
    protected readonly questionRepo: Repository<Question>,
  ) {}

  /** METHODS **/
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
      });
    } catch (error) {
      AppService.error('Cannot find question', error);
      return null;
    }
  }

  async getQuestionsInPractice(id: number): Promise<Question[]> {
    try {
      return this.questionRepo.find({
        where: { conversationId: id },
      });
    } catch (error) {
      AppService.error('Cannot find questions', error);
      return [];
    }
  }
}
