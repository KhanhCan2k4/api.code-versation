import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Topic } from './Topic';
import { LineOfSpeech } from './LineOfSpeech';
import { Status } from 'src/datas/enums/status';
import { Comment } from './Comment';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, name: 'short_desc', type: 'longtext' })
  shortDesc;

  @Column({
    type: 'tinyint',
    nullable: false,
    default: Status.ACTIVE,
  })
  status: Status;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  //   REALTIONS
  @Column({ default: -1 })
  topic_id: number;

  @ManyToOne(() => Topic, (topic) => topic.conversations, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  topic: Topic;

  @OneToMany(() => LineOfSpeech, (line) => line.conversation, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  lines: LineOfSpeech[];

  @OneToMany(() => Comment, (comment) => comment.conversation, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  comments: Comment[];
}
