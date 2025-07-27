import { AccountStatus, Status } from 'src/datas/enums/status';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Token } from './Token';
import { LineOfSpeech } from './LineOfSpeech';
import { Practice } from './Practice';
import { Comment } from './Comment';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'ai_key', unique: true })
  aiKey: string;

  @Column({ name: 'short_desc', type: 'mediumtext', nullable: true })
  shortDesc: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true, default: 'en-US' })
  language: string;

  @Column({ nullable: true, name: 'voice' })
  voice: string;

  @Column({ name: 'short_intro', nullable: true, default: 'Hello' })
  shortIntro: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    default: Status.INACTIVE,
  })
  status: Status | AccountStatus;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
  }

  // RELATIONS
  @OneToMany(() => Token, (token) => token.account)
  tokens: Token[];

  @OneToMany(() => LineOfSpeech, (line) => line.speaker)
  lines: LineOfSpeech[];

  @OneToMany(() => Practice, (practice) => practice.account)
  practices: Practice[];
}
