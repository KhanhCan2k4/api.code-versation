import { Injectable } from '@nestjs/common';
import { Account } from 'src/models/Account';

@Injectable()
export class AccountService {
    /**
     * get account by email address
     * 
     * @param email 
     * @returns Account | null 
     */
    async getAccountByEmail(email: string): Promise<Account | null> {
        return null;
    }

    async getAccountByToken(token: string): Promise<Account | null> {
        return null;
    }
}
