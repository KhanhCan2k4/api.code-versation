import { Column, Entity, ManyToOne } from 'typeorm';
import { Account } from './Account';

@Entity('tokens')
export class Token {
  @Column({ primary: true })
  token: string;

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
