import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Status } from 'src/datas/enums/status';
import { AccountService } from 'src/services/AccountService';
import { ConversationService } from 'src/services/ConversationService';

enum TAB {
  AI_SUGGESTION = 0,
  ON_FIRE = 1,
  ON_HISTORY = 2,
  WITH_LOVE = 3,
}

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
      liked_ids: number[];
      key: string;
      attached_welcome: boolean;
      tab: TAB;
    },
    @Headers() header: { token: string },
  ) {
    // GET ACCOUNT
    const account = await this.accountService.loginWithToken(header.token);

    try {
      let data;
      switch (body.tab) {
        case TAB.AI_SUGGESTION:
        case TAB.ON_FIRE:
          data = await this.conService.getPaginatedConversations(
            body.page,
            body.per_page,
            body.excluded_ids,
            body.key,
            body.attached_welcome,
          );
          break;
        case TAB.ON_HISTORY:
        case TAB.WITH_LOVE:
          data = await this.conService.getPaginatedLikedConversations(
            body.page,
            body.per_page,
            body.liked_ids,
            account,
          );
          break; 
      }
      return res.status(200).json(data);
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

  @Put('')
  async updateLikeOrView(
    @Res() res,
    @Query()
    query: {
      id: number;
      like?: boolean;
      unlike?: boolean;
      view?: boolean;
      unview?: boolean;
    },
    @Headers() header: { token: string },
  ) {
    // GET ACCOUNT WITH TOKEN
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(403).json(false);
    }
  }

  // STATIC METHODS
}
