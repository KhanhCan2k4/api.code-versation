import { Module } from '@nestjs/common';
import { AccountController } from 'src/controllers/AccountController';
import { AccountService } from 'src/services/AccountService';
import { MailService } from 'src/services/MailService';

@Module({
  imports: [],
  controllers: [AccountController],
  providers: [AccountService, MailService],
})
export class AccountModule {}
