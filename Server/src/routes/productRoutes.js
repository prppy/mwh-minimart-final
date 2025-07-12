// routes/leaderboard.js
const leaderboardRouter = express.Router();
import { getLeaderboard, getLeaderboardStats, getLeaderboardByBatch, getUserPosition } from '../controllers/leaderboardController';

leaderboardRouter.get('/', authenticateToken, getLeaderboard);
leaderboardRouter.get('/stats', authenticateToken, getLeaderboardStats);
leaderboardRouter.get('/batch/:batchNumber', authenticateToken, getLeaderboardByBatch);
leaderboardRouter.get('/user/:userId/position', authenticateToken, requireOwnershipOrStaff, getUserPosition);