import { Request, Response } from 'express';
import { RegisterMerchant } from '../../usecases/merchant/RegisterMerchant';
import { GetMerchantRestaurant } from '../../usecases/merchant/GetMerchantRestaurant';
import { UpdateMerchantProfile } from '../../usecases/merchant/UpdateMerchantProfile';
import { VerifyMerchant } from '../../usecases/merchant/VerifyMerchant';
import { AuthService } from '../services/AuthService';
import { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';

export class MerchantController {
  constructor(
    private readonly registerMerchant: RegisterMerchant,
    private readonly getMerchantRestaurant: GetMerchantRestaurant,
    private readonly updateMerchantProfile: UpdateMerchantProfile,
    private readonly verifyMerchant: VerifyMerchant,
    private readonly authService: AuthService,
    private readonly merchantRepository: IMerchantRepository
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const merchantData = req.body;
      const { merchant, accessToken, refreshToken } = await this.registerMerchant.execute(merchantData);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Return merchant data and access token
      res.status(201).json({
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          status: merchant.status,
          isVerified: merchant.isVerified
        },
        accessToken
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.params.merchantId;
      const { page = 1, limit = 10 } = req.query;

      const restaurants = await this.getMerchantRestaurant.execute({
        merchantId,
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json(restaurants);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const merchant = await this.authService.verifyMerchantCredentials(email, password);
      
      const accessToken = this.authService.generateAccessToken(merchant);
      const refreshToken = this.authService.generateRefreshToken(merchant);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          status: merchant.status,
          isVerified: merchant.isVerified
        },
        accessToken
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
      }

      const { accessToken, newRefreshToken } = await this.authService.refreshMerchantTokens(refreshToken);
      
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({ accessToken });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.id;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const merchant = await this.merchantRepository.findById(merchantId);
      if (!merchant) {
        res.status(404).json({ error: 'Merchant not found' });
        return;
      }

      res.status(200).json({
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        phoneNumber: merchant.phoneNumber,
        businessAddress: merchant.businessAddress,
        status: merchant.status,
        isVerified: merchant.isVerified,
        documentsUrls: merchant.documentsUrls
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.id;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updateData = req.body;
      const updatedMerchant = await this.updateMerchantProfile.execute(merchantId, updateData);
      
      res.status(200).json({
        id: updatedMerchant.id,
        businessName: updatedMerchant.businessName,
        email: updatedMerchant.email,
        phoneNumber: updatedMerchant.phoneNumber,
        businessAddress: updatedMerchant.businessAddress,
        status: updatedMerchant.status,
        isVerified: updatedMerchant.isVerified
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.params.id;
      await this.verifyMerchant.execute(merchantId);
      res.status(200).json({ message: 'Merchant verified successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
