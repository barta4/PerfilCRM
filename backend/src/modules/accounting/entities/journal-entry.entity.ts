import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { JournalEntryLine } from './journal-entry-line.entity';

export type JournalEntryStatus = 'Draft' | 'Posted';

@Entity('accounting_journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  entryNumber: string; // Ej: 'ASI-2026-0001'

  @Column({ type: 'date' })
  date: string;

  @Column('text')
  concept: string; // Ej: 'Venta de Cereal según e-Factura A-001'

  @Column({ nullable: true })
  documentReference: string; // Ej: 'e-Factura A-001234' (DGI)

  @Column({
    type: 'enum',
    enum: ['Draft', 'Posted'],
    default: 'Posted',
  })
  status: JournalEntryStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @OneToMany(() => JournalEntryLine, (line) => line.entry, {
    cascade: true,
    eager: true,
  })
  lines: JournalEntryLine[];

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
