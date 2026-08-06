import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AccountType = 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Egreso';

@Entity('accounting_accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Ej: '1.1.01', '1.1.01.01'

  @Column()
  name: string; // Ej: 'Caja M/N', 'Banco BROU M/N'

  @Column({
    type: 'enum',
    enum: ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Egreso'],
    default: 'Activo',
  })
  type: AccountType;

  @Column({ nullable: true })
  parentCode?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
