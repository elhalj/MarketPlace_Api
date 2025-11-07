import { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { IUser } from '../../domain/entities/User';
import { Merchant } from '../../domain/entities/Merchant';

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

type TokenExpiration = '15m' | '7d';

interface JwtConfiguration {
  readonly secret: Secret;
  readonly access: {
    readonly expiresIn: TokenExpiration;
  };
  readonly refresh: {
    readonly expiresIn: TokenExpiration;
  };
  readonly algorithm: 'HS256';
  readonly issuer: string;
  readonly audience: string;
}

const JWT: Readonly<JwtConfiguration> = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  access: {
    expiresIn: '15m',
  },
  refresh: {
    expiresIn: '7d',
  },
  algorithm: 'HS256',
  issuer: 'marketplace-api',
  audience: 'marketplace-client',
};

function createPayload(user: IUser | Merchant, type: TokenPayload['type']): TokenPayload {
  if (!user.id || !user.email) {
    throw new Error('User must have id and email');
  }

  return {
    id: user.id,
    email: user.email,
    role: 'role' in user ? user.role : 'merchant',
    type,
    iat: Math.floor(Date.now() / 1000),
  };
}

function createSignOptions(expiresIn: TokenExpiration): SignOptions {
  return {
    expiresIn,
    algorithm: JWT.algorithm,
    issuer: JWT.issuer,
    audience: JWT.audience,
  } as const;
}

export const tokens = {
  generateAccess(user: IUser | Merchant): string {
    const payload = createPayload(user, 'access');
    const options = createSignOptions(JWT.access.expiresIn);
    return jwt.sign(payload, JWT.secret, options);
  },

  generateRefresh(user: IUser | Merchant): string {
    const payload = createPayload(user, 'refresh');
    const options = createSignOptions(JWT.refresh.expiresIn);
    return jwt.sign(payload, JWT.secret, options);
  },

  verify<T extends TokenPayload>(token: string): T {
    try {
      const decoded = jwt.verify(token, JWT.secret, {
        algorithms: [JWT.algorithm],
        issuer: JWT.issuer,
        audience: JWT.audience,
      });

      if (typeof decoded === 'string' || !decoded) {
        throw new Error('Invalid token payload');
      }

      return decoded as T;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not yet valid');
      }
      throw error;
    }
  },
};

export function decodeToken(token: string): TokenPayload | null {
  return jwt.decode(token) as TokenPayload | null;
}

export function isTokenExpired(token: string): boolean {
  try {
    tokens.verify(token);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    throw error;
  }
}
