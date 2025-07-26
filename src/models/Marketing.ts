import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Status } from 'src/datas/enums/status';

@Entity('marketings')
export class Marketing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'longtext' })
  content;

  @Column({
    type: 'tinyint',
    nullable: false,
    default: Status.ACTIVE,
  })
  status: Status;

  @Column({ default: 0 })
  count: number;

  @Column({
    name: 'activated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  activatedAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
