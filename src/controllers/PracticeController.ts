import { Body, Controller, Get, Headers, Query, Res } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { AccountService } from 'src/services/AccountService';
import { PracticeService } from 'src/services/PracticeService';

@Controller('/api/practices')
export class PracticeController {
  // CONSTRUCTOR
  constructor(
    private readonly practiceService: PracticeService,
    private readonly accountService: AccountService,
  ) {}

  //   METHODS
  @Get('/')
  async getWelcome(@Res() res, @Query() query: { id: number }) {
    const practice = await this.practiceService.getQuestionsInPractice(
      query.id,
    );

    if (!practice) {
      AppService.error('Cannot get practice');
      return res.status(500).json(false);
    }

    AppService.success('Get practice successfully');
    return res.status(200).json(practice);
  }

  // STATIC METHODS
}
