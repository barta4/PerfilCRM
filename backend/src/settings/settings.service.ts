import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private repo: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.repo.findOneBy({ key });
    return setting?.value || null;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const val = await this.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    type: Setting['type'] = 'string',
  ): Promise<Setting> {
    let setting = await this.repo.findOneBy({ key });
    if (setting) {
      setting.value = value;
      setting.type = type;
    } else {
      setting = this.repo.create({ key, value, type });
    }
    return this.repo.save(setting);
  }

  async getAll(): Promise<Setting[]> {
    return this.repo.find();
  }
}
