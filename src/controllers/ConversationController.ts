import { Body, Controller, Get, Query, Res } from '@nestjs/common';
import { AppService } from 'src/app.service';
import PaginatedObject from 'src/models/PaginatedObject';
import { ConversationService } from 'src/services/ConversationService';

@Controller('/api/conversations')
export class ConversationController {
  // CONSTRUCTOR
  constructor(private readonly conService: ConversationService) {}

  //   METHODS
  @Get('/paginated')
  async getPaginated(
    @Res() res,
    @Query()
    query: { page: number; 'per-page': number; 'excluded-ids[]': number[] },
  ) {
    try {
      const result = await this.conService.getPaginatedConversations(
        query.page,
        query['per-page'],
        query['excluded-ids[]'],
      );

      result.data.forEach((con) => {
        con['image'] = `/topics/${con.topic_id ?? con.id}.jpg`;
      });

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot get paginated list of conversations', error);
      return res.status(500);
    }
  }

  @Get('/')
  async getWelcome(@Res() res) {
    const conversation = await this.conService.getWelcomeConversation();

    if (!conversation) {
      AppService.error('Cannot get welcome conversation');
      return res.status(500);
    }

    AppService.success('Get welcome conversation successfully');
    return res.status(200).json(conversation);
  }

  // STATIC METHODS
}
