import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Status } from 'src/datas/enums/status';
import { AccountService } from 'src/services/AccountService';
import { ConversationService } from 'src/services/ConversationService';

@Controller('/api/conversations')
export class ConversationController {
  // CONSTRUCTOR
  constructor(
    private readonly conService: ConversationService,
    private readonly accountService: AccountService,
  ) {}

  //   METHODS
  @Post('/paginated')
  async getPaginated(
    @Res() res,
    @Body()
    body: {
      page: number;
      per_page: number;
      excluded_ids: number[];
      key: string;
      attached_welcome: boolean;
    },
  ) {
    try {
      const result = await this.conService.getPaginatedConversations(
        body.page,
        body.per_page,
        body.excluded_ids,
        body.key,
        body.attached_welcome,
      );

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot get paginated list of conversations', error);
      return res.status(500).json(false);
    }
  }

  @Post('/delete')
  async deleteByIds(
    @Res() res,
    @Body() body: { ids: number[] },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // GET BY IDS
    const conversations = await this.conService.getConversationsByIds(body.ids);

    // SET NEW STATUS
    conversations.forEach((con) => {
      con.status = Status.DELETED;
    });

    try {
      const result = await this.conService.saveConversations(conversations);

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot delete conversations with ids', error);
      return res.status(500).json(false);
    }
  }

  @Get('/welcome')
  async getWelcome(@Res() res) {
    const conversation = await this.conService.getWelcomeConversation();

    if (!conversation) {
      AppService.error('Cannot get welcome conversation');
      return res.status(500);
    }

    AppService.success('Get welcome conversation successfully');
    return res.status(200).json(conversation);
  }

  @Get('/')
  async getConversationById(@Res() res, @Query() query: { id: number }) {
    const conversation = await this.conService.getConversationById(query.id);

    if (!conversation) {
      AppService.error('Cannot get conversation with id');
      return res.status(500).json(false);
    }

    AppService.success('Get conversation with id successfully');
    return res.status(200).json(conversation);
  }

  // STATIC METHODS
}
