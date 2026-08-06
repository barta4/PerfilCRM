import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('module_registry')
export class ModuleRegistry {
  @PrimaryColumn()
  id: string; // e.g. 'crm_clients', 'sales_quotations', 'inventory_stock'

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: '1.0.0' })
  version: string;

  @Column({ default: 'operations' })
  category: string;

  @Column({ default: false })
  isCore: boolean;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  dependencies: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  permissions: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  navigation: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  widgets: any[];

  @Column({ type: 'jsonb', nullable: true, default: {} })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
