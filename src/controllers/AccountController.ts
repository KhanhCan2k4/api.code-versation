import { Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { AccountService } from 'src/services/AccountService';
import { MailService } from 'src/services/MailService';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  readAll() {
    return 'Get all accounts';
  }

  @Get('/register')
  registerAccount(@Res() res) {
    const account = {
      name: 'Le Viet Khanh',
      email: 'levietkhanh2k4@gmail.com',
    };
    this.mailService.sendWelcomingMessage(account.email, account.name);

    AppService.success('Register successfully');
    return res.status(201).json(account);
  }
}
