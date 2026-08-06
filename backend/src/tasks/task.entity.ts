import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Visit } from '../visits/visit.entity';
import { User } from '../auth/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 'To Do' })
  status: string; // To Do, In Progress, Done, Cancelled

  @Column({ default: 'Normal' })
  priority: string; // Low, Normal, High, Critical

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => Visit, { onDelete: 'SET NULL', nullable: true, eager: true })
  sourceVisit: Visit;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: true })
  assignedTo: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
