// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import taskRoutes from './routes/tasks';
import transactionRoutes from './routes/transactions';
import leaderboardRoutes from './routes/leaderboard';
import feedbackRoutes from './routes/feedback';

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/tasks', taskRoutes);
app.use('/transactions', transactionRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/auth', authRoutes);