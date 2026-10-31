import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { ApoiaSeService } from '../apoiase/apoiase.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };
  let apoiase: { verify: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  const baseUser = {
    id: 'u1',
    email: 'jogador@email.com',
    passwordHash: 'hash-real',
    role: 'BACKER',
    monthlyContribution: 15,
    isAdmin: false,
    isApoiadorAtivo: true,
    isExApoiador: false,
    apoiandoDesde: new Date('2026-01-01'),
    nome: 'João',
    nick: 'joao',
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
    };
    apoiase = { verify: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-abc') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ApoiaSeService, useValue: apoiase },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('autentica e retorna accessToken quando a senha confere', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const res = await service.login(baseUser.email, 'senha-ok');

      expect(res.accessToken).toBe('token-abc');
      expect(res.user).toMatchObject({ id: 'u1', email: baseUser.email, isAdmin: false });
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u1', email: baseUser.email }),
      );
    });

    it('401 quando a senha não confere', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.login(baseUser.email, 'errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('401 quando o usuário não existe (ainda roda verify com dummy hash)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.login('nao@existe.com', 'x')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifySpy).toHaveBeenCalled();
    });
  });

  describe('requestLogin', () => {
    it('marca ex-apoiador e lança 401 quando não é mais backer', async () => {
      apoiase.verify.mockResolvedValue({ isBacker: false, isPaidThisMonth: false });
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, isApoiadorAtivo: true });

      await expect(service.requestLogin(baseUser.email)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isApoiadorAtivo: false, isExApoiador: true }),
        }),
      );
    });

    it('401 quando o apoio do mês ainda não foi processado', async () => {
      apoiase.verify.mockResolvedValue({ isBacker: true, isPaidThisMonth: false });

      await expect(service.requestLogin(baseUser.email)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('401 quando é apoiador mas não tem conta cadastrada', async () => {
      apoiase.verify.mockResolvedValue({
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 15,
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.requestLogin('novo@email.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('reativa o apoiador e retorna token quando tudo confere', async () => {
      apoiase.verify.mockResolvedValue({
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 20,
      });
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, apoiandoDesde: null });
      prisma.user.update.mockResolvedValue({ ...baseUser, monthlyContribution: 20 });

      const res = await service.requestLogin(baseUser.email);

      expect(res.accessToken).toBe('token-abc');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isApoiadorAtivo: true, isExApoiador: false }),
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('404 quando o usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.changePassword('u1', 'a', 'b')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('401 quando a senha atual está incorreta', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.changePassword('u1', 'errada', 'nova')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('400 quando a nova senha é igual à atual', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      // 1ª verify (senha atual) = true; 2ª verify (nova == atual) = true
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      await expect(service.changePassword('u1', 'atual', 'atual')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('atualiza o hash quando a troca é válida', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      jest
        .spyOn(argon2, 'verify')
        .mockResolvedValueOnce(true) // senha atual confere
        .mockResolvedValueOnce(false); // nova é diferente
      jest.spyOn(argon2, 'hash').mockResolvedValue('novo-hash');
      prisma.user.update.mockResolvedValue(baseUser);

      await service.changePassword('u1', 'atual', 'nova');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: 'novo-hash' } }),
      );
    });
  });
});
