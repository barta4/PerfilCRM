import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { EmailService } from './email.service';
import { User } from '../auth/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private emailService: EmailService,
  ) { }

  findForUser(userId: number): Promise<Notification[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  findUnreadCount(userId: number): Promise<number> {
    return this.repo.count({ where: { user: { id: userId }, isRead: false } });
  }

  async create(data: {
    title: string;
    message: string;
    type?: string;
    userId?: number;
  }): Promise<Notification> {
    const notif = this.repo.create({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      user: data.userId ? { id: data.userId } : undefined,
    });

    const saved = await this.repo.save(notif);

    // Send email notification if user exists
    if (data.userId) {
      this.userRepo.findOneBy({ id: data.userId }).then((user) => {
        if (user && user.email) {
          const html = `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #002233;">${data.title}</h2>
              <p>${data.message}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Este es un aviso automático de PERFIL CRM v2.0</p>
            </div>
          `;
          this.emailService.sendEmail(
            user.email,
            `Notificación: ${data.title}`,
            html,
          );
        }
      });
    }

    return saved;
  }

  async markRead(id: number): Promise<void> {
    await this.repo.update(id, { isRead: true });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .execute();
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
