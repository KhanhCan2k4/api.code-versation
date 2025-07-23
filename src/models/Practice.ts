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

  // RELATIONS
  @Column()
  account_id: number;

  @ManyToOne(() => Account, (account) => account.practices)
  account?: Account;

  @OneToMany(() => Question, (question) => question.practice, {
    onDelete: 'CASCADE',
  })
  questions: Question[];
}
