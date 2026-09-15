import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { User } from '../auth/user.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // Presencial, Virtual, Llamada

  @Column()
  title: string;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column({ nullable: true })
  meetingLink: string;

  @Column({ nullable: true })
  googleEventId: string;

  @Column({ nullable: true })
  googleHtmlLink: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true, nullable: true })
  client: Client;

  @ManyToOne(() => User, { onDelete: 'SET NULL', eager: true, nullable: true })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
