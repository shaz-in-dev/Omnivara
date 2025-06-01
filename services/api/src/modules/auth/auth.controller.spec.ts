import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
  validateUser:       jest.fn(),
  login:              jest.fn(),
  register:           jest.fn(),
  refreshTokens:      jest.fn(),
  logout:             jest.fn(),
  forgotPassword:     jest.fn(),
  resetPassword:      jest.fn(),
  updateMe:           jest.fn(),
  updateAvatar:       jest.fn(),
  sendVerificationEmail: jest.fn(),
  verifyEmail:        jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers:   [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get(AuthController);
  });

  describe('login', () => {
    it('calls validateUser then login and returns tokens', async () => {
      const user = { id: 'u-1', email: 'a@b.com' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({ accessToken: 'tok', refreshToken: 'ref', user });

      const result = await controller.login({ email: 'a@b.com', password: 'Password1!' } as any);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('a@b.com', 'Password1!');
      expect(mockAuthService.login).toHaveBeenCalledWith(user.id);
      expect(result.accessToken).toBe('tok');
    });

    it('propagates UnauthorizedException from validateUser', async () => {
      mockAuthService.validateUser.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      await expect(controller.login({ email: 'x@y.com', password: 'bad' } as any))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('delegates to AuthService.register', async () => {
      const dto = { name: 'Alice', email: 'a@b.com', password: 'P123!', orgName: 'Corp' };
      const result = { accessToken: 'tok', refreshToken: 'ref', user: { id: 'u-1' } };
      mockAuthService.register.mockResolvedValue(result);

      const out = await controller.register(dto as any);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(out).toEqual(result);
    });
  });

  describe('me', () => {
    it('returns the request user from JWT payload', () => {
      const user = { id: 'u-1', email: 'a@b.com', orgId: 'org-1' };
      const result = controller.me({ user } as any);
      expect(result).toEqual(user);
    });
  });

  describe('refresh', () => {
    it('delegates to AuthService.refreshTokens', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({ accessToken: 'new-tok' });
      const result = await controller.refresh({ refreshToken: 'old-ref' });
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old-ref');
      expect(result.accessToken).toBe('new-tok');
    });
  });

  describe('logout', () => {
    it('delegates to AuthService.logout', async () => {
      mockAuthService.logout.mockResolvedValue({ message: 'logged out' });
      await controller.logout({ refreshToken: 'ref' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('ref');
    });
  });

  describe('forgotPassword', () => {
    it('delegates to AuthService.forgotPassword', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'email sent' });
      await controller.forgotPassword({ email: 'a@b.com' });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('a@b.com');
    });
  });

  describe('verifyEmail', () => {
    it('delegates to AuthService.verifyEmail', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ verified: true });
      await controller.verifyEmail('tok-123');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('tok-123');
    });
  });
});
