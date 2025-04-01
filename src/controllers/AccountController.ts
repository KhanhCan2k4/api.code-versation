import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { AccountService } from 'src/services/AccountService';
import { MailService } from 'src/services/MailService';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly mailService: MailService,
  ) {}

  /**
   * to login account with email and token/otp sent via email
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  @Post('/login')
  readAll(@Req() req, @Res() res) {
    const account = {
      name: 'Le Viet Khanh',
      email: 'levietkhanh2k4@gmail.com',
    };
    this.mailService.sendLoginMessage(account.email, account.name);

    AppService.success('Register successfully');
    return res.status(201).json(account);
  }

  /**
   * to register account and send email to active account
   *
   * @param req
   * @param res
   * @returns
   */
  @Post('/register')
  registerAccount(@Req() req, @Res() res) {
    //prepare and validate data
    const account = {
      name: 'Le Viet Khanh',
      email: 'levietkhanh2k4@gmail.com',
    };

    //call service to store the account information

    //call service to send email
    this.mailService.sendWelcomingMessage(account.email, account.name);

    AppService.success('Register successfully');
    return res.status(201).json(account);
  }


  
}
