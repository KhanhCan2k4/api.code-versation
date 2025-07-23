import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './Conversation';
import { Status } from 'src/datas/enums/status';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, name: 'short_desc', type: 'longtext' })
  shortDesc;

  @Column({ nullable: true })
  image: string;

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

  // RELATIONS
  @OneToMany(() => Conversation, (con) => con.topic, {
    onDelete: 'CASCADE',
  })
  conversations: Conversation[];
}
