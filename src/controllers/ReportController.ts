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
import { AccountService } from 'src/services/AccountService';
import { ReportService } from 'src/services/ReportService';

@Controller('/api/reports')
export class ReportController {
  /** PROPERTIES **/

  /** CONSTRUCTOR **/
  constructor(
    protected readonly reportService: ReportService,
    protected readonly accountService: AccountService,
  ) {}

  /** METHODS **/
  /**
   * to get user growth report
   */
  @Get('/user-growth')
  async getUserGrowthReport(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Fount');
      return res.status(403).json(false);
    }

    const report = await this.reportService.getUserGrowthReport();

    return res.status(200).json(report);
  }

  /**
   * to get user growth report
   */
  @Get('/topic-growth')
  async getTopicGrowthReport(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Fount');
      return res.status(403).json(false);
    }

    const report = await this.reportService.getTopicGrowthReport();

    return res.status(200).json(report);
  }

  /**
   * to get prompt counting report
   */
  @Get('/prompt-counting')
  async getPromptCountingReport(
    @Res() res,
    @Headers() header: { token: string },
    @Query() query: { max: number },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Fount');
      return res.status(403).json(false);
    }

    const report = await this.reportService.getPromptCountingReport(query.max);

    return res.status(200).json(report);
  }

  /**
   * to get marketing counting report
   */
  @Get('/marketing-counting')
  async getMarketingCountingReport(
    @Res() res,
    @Headers() header: { token: string },
    @Query() query: { max: number },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Fount');
      return res.status(403).json(false);
    }

    const report = await this.reportService.getMarketingCountingReport(query.max);

    return res.status(200).json(report);
  }

  /**
   * to get conversation comparation report
   */
  @Get('/con-comparation')
  async getConversationComparationReport(
    @Res() res,
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Fount');
      return res.status(403).json(false);
    }

    const report = await this.reportService.getConversationComparationReport();

    return res.status(200).json(report);
  }
  
  /** STATIC METHODS **/
}
