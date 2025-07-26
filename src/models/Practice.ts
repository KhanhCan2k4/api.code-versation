import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './Question';
import { Account } from './Account';

@Entity('practices')
export class Practice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // RELATIONS
  @Column({ default: -1 })
  account_id: number;

  @ManyToOne(() => Account, (account) => account.practices)
  account?: Account;

  @OneToMany(() => Question, (question) => question.practice, {
    onDelete: 'CASCADE',
  })
  questions: Question[];
}
