import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './setting.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting]), NotificationsModule],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
