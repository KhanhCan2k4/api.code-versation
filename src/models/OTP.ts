import { Column, Entity, ManyToOne } from 'typeorm';
import { Account } from './Account';

@Entity('otps')
export class OTP {
  @Column({ primary: true })
  otp: number;

  @Column({ name: 'account_id', primary: true })
  accountId: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => Account, (account) => account.tokens, {
    onDelete: 'CASCADE',
  })
  account: Account;
}
