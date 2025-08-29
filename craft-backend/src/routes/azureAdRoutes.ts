import { Router } from 'express';
import { AzureAdController } from '@/controllers/AzureAdController';

const router = Router();
const azureAdController = new AzureAdController();

// Azure AD SSO routes
router.get('/auth-url', azureAdController.getAuthUrl);
router.get('/callback', azureAdController.handleCallback);
router.get('/config', azureAdController.getConfig);
router.post('/logout', azureAdController.logout);

export default router;