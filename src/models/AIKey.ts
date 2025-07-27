import { Column, Entity, ManyToOne } from 'typeorm';
import { Account } from './Account';

@Entity('ai_keys')
export class AIKey {
  @Column({ primary: true })
  key: string;

  @Column({ name: 'account_id' })
  accountId: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
