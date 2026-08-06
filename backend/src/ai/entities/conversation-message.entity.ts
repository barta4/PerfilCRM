import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @Column()
  role: 'user' | 'assistant' | 'system' | 'tool';

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  toolCalls: any;

  @Column({ type: 'jsonb', nullable: true })
  pendingAction: any;

  @CreateDateColumn()
  createdAt: Date;
}
