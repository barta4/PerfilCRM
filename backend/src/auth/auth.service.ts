import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../notifications/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  async register(
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      name,
      email,
      password: hashed,
      role: role || UserRole.SALES,
    });
    return this.userRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      allowedModules: user.allowedModules,
      imageUrl: user.imageUrl,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedModules: user.allowedModules,
        imageUrl: user.imageUrl,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      // Security measure to avoid user enumeration
      return {
        message:
          'Si el correo está registrado, recibirás un enlace de recuperación.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepo.save(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const recoveryLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d2c54; text-align: center;">Recuperación de Contraseña — PERFIL CRM</h2>
        <p>Hola, <strong>${user.name}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña en PERFIL CRM. Haz clic en el botón de abajo para continuar con el restablecimiento:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #00a8e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">© 2026 PERFIL CRM. Todos los derechos reservados.</p>
      </div>
    `;

    try {
      await this.emailService.sendEmail(
        user.email,
        'Recuperación de Contraseña — PERFIL CRM',
        html,
      );
    } catch (e) {
      console.error('Failed to send password recovery email', e);
      throw new BadRequestException(
        'Error al enviar el correo. Por favor verifica la configuración SMTP.',
      );
    }

    return {
      message:
        'Si el correo está registrado, recibirás un enlace de recuperación.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El enlace de recuperación es inválido o ha expirado.',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepo.save(user);

    return {
      message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.',
    };
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'allowedModules', 'imageUrl'],
    });
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    if (data.password && data.password.trim() !== '') {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@perfilgranos.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Perfilgranos2026!';

    // Seed Main Admin
    let existingAdmin = await this.userRepo.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await this.register('Administrador Perfilgranos', adminEmail, adminPass, UserRole.ADMIN);
      console.log(`[PERFILGRANOS] Admin seed created: ${adminEmail}`);
    }

    // Seed Legacy Admin for compatibility
    let legacyAdmin = await this.userRepo.findOne({ where: { email: 'admin@pureza.uy' } });
    if (!legacyAdmin) {
      await this.register('Administrador Legacy', 'admin@pureza.uy', 'Pureza2026!', UserRole.ADMIN);
    }

    // Seed Sales Executive
    let salesUser = await this.userRepo.findOne({ where: { email: 'ejecutivo@perfilgranos.com' } });
    if (!salesUser) {
      await this.register('Ejecutivo Comercial', 'ejecutivo@perfilgranos.com', 'Perfilgranos2026!', UserRole.SALES);
      console.log(`[PERFILGRANOS] Sales seed created: ejecutivo@perfilgranos.com`);
    }
  }
}
