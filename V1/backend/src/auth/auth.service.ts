import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, firstName, lastName },
    });

    await this.prisma.settings.create({
      data: { userId: user.id },
    });

    const defaults = [
      { name: 'Private', color: '#6366f1', locked: true },
      { name: 'Public', color: '#10b981', locked: true },
      { name: 'Learning', color: '#f59e0b', locked: false },
    ];
    for (let i = 0; i < defaults.length; i++) {
      await this.prisma.collection.create({
        data: {
          userId: user.id,
          name: defaults[i].name,
          color: defaults[i].color,
          order: i,
          locked: defaults[i].locked,
        },
      });
    }

    return { token: this.generateToken(user.id, user.email) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { token: this.generateToken(user.id, user.email) };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    });
    return user;
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
