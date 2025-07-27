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
import { AccountService } from 'src/services/AccountService';
import { CommentService, Parent } from 'src/services/CommentService';

@Controller('/api/comments')
export class CommentController {
  /** PROPERTIES **/

  /** CONSTRUCTOR **/
  constructor(
    protected readonly commentService: CommentService,
    protected readonly accountService: AccountService,
  ) {}

  /** METHODS **/

  /**
   * to get suitables comments of it parent
   */
  @Get('/')
  async getCommentsOf(@Res() res, @Query() query: { of: Parent; id: number }) {
    // GET SUITABLE COMMENTS
    const comments = await this.commentService.getCommentsOf(
      query.of,
      query.id,
    );

    return res.status(200).json(comments);
  }

  /**
   * to like/dislike comment
   */
  @Put('/')
  async updateComment(
    @Res() res,
    @Query()
    query: {
      id: number;
      like?: boolean;
      unlike?: boolean;
      dislike?: boolean;
      undislike?: boolean;
    },
  ) {
    const result = await this.commentService.upadteComment(
      query.id,
      query.like,
      query.unlike,
      query.dislike,
      query.undislike,
    );

    return res.status(200).json(result);
  }

  /**
   * to like/dislike comment
   */
  @Post('/')
  async addComment(
    @Res() res,
    @Body()
    body: {
      id: number;
      of: Parent;
      comment: string;
      is_report?: boolean;
    },
    @Headers() header: { token: string },
  ) {
    // GET ACCOUNT
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(403).json(false);
    }

    const result = await this.commentService.addComment(
      body.comment,
      body.of,
      body.id,
      account,
      body.is_report,
    );

    return res.status(200).json(result);
  }

  /** STATIC METHODS **/
}
