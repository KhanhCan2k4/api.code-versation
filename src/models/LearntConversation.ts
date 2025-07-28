import { Column, Entity } from 'typeorm';

@Entity('learnt_conversations')
export class LearntConversation {
  @Column({ name: 'conversation_id', primary: true })
  conversationId: number;

  @Column({ name: 'account_id', primary: true })
  accountId: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
