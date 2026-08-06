import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { EmailLog } from './email-log.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column('text')
  content: string; // HTML Template with placeholders

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: true })
  sentBy: User;

  @OneToMany(() => EmailLog, (log) => log.campaign)
  logs: EmailLog[];
}
