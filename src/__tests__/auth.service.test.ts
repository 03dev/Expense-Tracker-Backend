import { AuthServices } from '../services/auth.service';
import { authRepository } from '../repositories/auth.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { TokenUtils } from '../utils/token.utils';
import { BadRequestError } from '../errors/BadRequestError';
import { UnauthorizedError } from '../errors/UnauthorizedError';

jest.mock('../repositories/auth.repository', () => ({
  authRepository: {
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
  },
}));

jest.mock('../repositories/refreshToken.repository', () => ({
  refreshTokenRepository: {
    createRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    deleteAllRefreshTokens: jest.fn(),
    deleteExpiredTokens: jest.fn(),
  },
}));

jest.mock('../utils/token.utils', () => ({
  TokenUtils: {
    hashedFunction: jest.fn(),
    compareFunction: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn().mockReturnValue('mock-token-id'),
}));

const mockAuthRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;
const mockTokenUtils = TokenUtils as jest.Mocked<typeof TokenUtils>;

// ---------------------------------------------------------------------------
// registerService
// ---------------------------------------------------------------------------

describe('registerService', () => {
  const input = { name: 'Jane Doe', email: 'jane@example.com', password: 'secret123' };

  const createdUser = { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' };

  describe('happy path', () => {
    beforeEach(() => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockTokenUtils.hashedFunction
        .mockResolvedValueOnce('hashed-password')
        .mockResolvedValueOnce('hashed-refresh-token');
      mockAuthRepo.createUser.mockResolvedValue(createdUser);
      mockTokenUtils.generateAccessToken.mockReturnValue('access-token');
      mockTokenUtils.generateRefreshToken.mockReturnValue('refresh-token');
      mockRefreshRepo.createRefreshToken.mockResolvedValue({
        id: 'mock-token-id',
        userId: createdUser.id,
        expiresAt: new Date(),
      });
    });

    it('returns user, accessToken, and refreshToken', async () => {
      const result = await AuthServices.registerService(input);

      expect(result).toEqual({
        user: createdUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('checks for existing email before creating user', async () => {
      await AuthServices.registerService(input);

      expect(mockAuthRepo.findUserByEmail).toHaveBeenCalledWith(input.email);
      expect(mockAuthRepo.findUserByEmail).toHaveBeenCalledTimes(1);
    });

    it('hashes the plain-text password before storing', async () => {
      await AuthServices.registerService(input);

      expect(mockTokenUtils.hashedFunction).toHaveBeenNthCalledWith(1, input.password);
      expect(mockAuthRepo.createUser).toHaveBeenCalledWith({
        name: input.name,
        email: input.email,
        hashedPassword: 'hashed-password',
      });
    });

    it('generates tokens for the newly created user', async () => {
      await AuthServices.registerService(input);

      expect(mockTokenUtils.generateAccessToken).toHaveBeenCalledWith(createdUser.id);
      expect(mockTokenUtils.generateRefreshToken).toHaveBeenCalledWith(createdUser.id, 'mock-token-id');
    });

    it('stores a hashed refresh token in the repository', async () => {
      await AuthServices.registerService(input);

      expect(mockTokenUtils.hashedFunction).toHaveBeenNthCalledWith(2, 'refresh-token');
      expect(mockRefreshRepo.createRefreshToken).toHaveBeenCalledWith(
        createdUser.id,
        'hashed-refresh-token',
        'mock-token-id',
      );
    });
  });

  describe('error path', () => {
    it('throws BadRequestError when email is already registered', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        ...createdUser,
        password: 'existing-hash',
      });

      await expect(AuthServices.registerService(input)).rejects.toThrow(BadRequestError);
      await expect(AuthServices.registerService(input)).rejects.toThrow('Email already in use');
    });

    it('does not create a user or tokens when email is taken', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        ...createdUser,
        password: 'existing-hash',
      });

      await expect(AuthServices.registerService(input)).rejects.toThrow(BadRequestError);

      expect(mockAuthRepo.createUser).not.toHaveBeenCalled();
      expect(mockTokenUtils.generateAccessToken).not.toHaveBeenCalled();
      expect(mockRefreshRepo.createRefreshToken).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// loginService
// ---------------------------------------------------------------------------

describe('loginService', () => {
  const input = { email: 'jane@example.com', password: 'secret123' };

  const storedUser = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
  };

  describe('happy path', () => {
    beforeEach(() => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(storedUser);
      mockTokenUtils.compareFunction.mockResolvedValue(true);
      mockRefreshRepo.deleteAllRefreshTokens.mockResolvedValue({ count: 1 });
      mockTokenUtils.generateAccessToken.mockReturnValue('access-token');
      mockTokenUtils.generateRefreshToken.mockReturnValue('refresh-token');
      mockTokenUtils.hashedFunction.mockResolvedValue('hashed-refresh-token');
      mockRefreshRepo.createRefreshToken.mockResolvedValue({
        id: 'mock-token-id',
        userId: storedUser.id,
        expiresAt: new Date(),
      });
    });

    it('returns user (without password), accessToken, and refreshToken', async () => {
      const result = await AuthServices.loginService(input);

      expect(result).toEqual({
        user: { id: storedUser.id, name: storedUser.name, email: storedUser.email },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('does not expose the stored password in the returned user', async () => {
      const result = await AuthServices.loginService(input);

      expect(result.user).not.toHaveProperty('password');
    });

    it('validates the provided password against the stored hash', async () => {
      await AuthServices.loginService(input);

      expect(mockTokenUtils.compareFunction).toHaveBeenCalledWith(input.password, storedUser.password);
    });

    it('deletes all existing refresh tokens before issuing a new one', async () => {
      await AuthServices.loginService(input);

      expect(mockRefreshRepo.deleteAllRefreshTokens).toHaveBeenCalledWith(storedUser.id);
      expect(mockRefreshRepo.deleteAllRefreshTokens).toHaveBeenCalledTimes(1);
    });

    it('generates and stores a new hashed refresh token', async () => {
      await AuthServices.loginService(input);

      expect(mockTokenUtils.generateAccessToken).toHaveBeenCalledWith(storedUser.id);
      expect(mockTokenUtils.generateRefreshToken).toHaveBeenCalledWith(storedUser.id, 'mock-token-id');
      expect(mockTokenUtils.hashedFunction).toHaveBeenCalledWith('refresh-token');
      expect(mockRefreshRepo.createRefreshToken).toHaveBeenCalledWith(
        storedUser.id,
        'hashed-refresh-token',
        'mock-token-id',
      );
    });
  });

  describe('error paths', () => {
    it('throws UnauthorizedError when no user exists for the given email', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      await expect(AuthServices.loginService(input)).rejects.toThrow(UnauthorizedError);
      await expect(AuthServices.loginService(input)).rejects.toThrow('Invalid email or password');
    });

    it('does not compare passwords when user is not found', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      await expect(AuthServices.loginService(input)).rejects.toThrow(UnauthorizedError);

      expect(mockTokenUtils.compareFunction).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedError when the password does not match', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(storedUser);
      mockTokenUtils.compareFunction.mockResolvedValue(false);

      await expect(AuthServices.loginService(input)).rejects.toThrow(UnauthorizedError);
      await expect(AuthServices.loginService(input)).rejects.toThrow('Invalid email or password');
    });

    it('does not delete tokens or issue new ones when the password is wrong', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(storedUser);
      mockTokenUtils.compareFunction.mockResolvedValue(false);

      await expect(AuthServices.loginService(input)).rejects.toThrow(UnauthorizedError);

      expect(mockRefreshRepo.deleteAllRefreshTokens).not.toHaveBeenCalled();
      expect(mockRefreshRepo.createRefreshToken).not.toHaveBeenCalled();
    });
  });
});
