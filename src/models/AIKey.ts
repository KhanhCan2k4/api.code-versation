import { Column, Entity } from 'typeorm';

@Entity('ai_keys')
export class AIKey {
  @Column({ primary: true })
  key: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
