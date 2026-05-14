// controllers/exportController.js
// Feature 6: Download records as CSV
import { prisma } from '../lib/db.js';

/**
 * Convert array of objects to CSV string
 */
const toCSV = (data, columns) => {
  if (!data || data.length === 0) return '';
  
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      let val = c.accessor(row);
      if (val === null || val === undefined) val = '';
      // Escape commas and quotes in CSV
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

/**
 * Export individual resident's transaction records as CSV
 */
export const exportResidentRecords = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get resident info
    const resident = await prisma.resident.findUnique({
      where: { userId: parseInt(userId) },
      include: { user: { select: { userName: true } } }
    });

    if (!resident) {
      return res.status(404).json({ error: { message: 'Resident not found' } });
    }

    // Get all transactions for this resident
    const transactions = await prisma.transaction.findMany({
      where: { userId: parseInt(userId) },
      include: {
        completions: {
          include: {
            task: {
              select: {
                taskName: true,
                points: true,
                taskCategory: { select: { taskCategoryName: true } }
              }
            }
          }
        },
        redemptions: {
          include: {
            product: { select: { productName: true, points: true } }
          }
        },
        abscondence: true
      },
      orderBy: { transactionDate: 'desc' }
    });

    // Flatten transactions for CSV
    const flatData = [];
    for (const tx of transactions) {
      if (tx.transactionType === 'completion') {
        for (const comp of tx.completions) {
          flatData.push({
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
            type: 'Voucher Completion',
            item: comp.task?.taskName || '',
            category: comp.task?.taskCategory?.taskCategoryName || '',
            points: tx.pointsChange || 0,
            transactionId: tx.id
          });
        }
      } else if (tx.transactionType === 'redemption') {
        for (const red of tx.redemptions) {
          flatData.push({
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
            type: 'Redemption',
            item: red.product?.productName || '',
            category: '',
            points: tx.pointsChange || 0,
            transactionId: tx.id
          });
        }
      } else if (tx.transactionType === 'abscondence') {
        flatData.push({
          date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
          type: 'Abscondence',
          item: tx.abscondence?.reason || '',
          category: '',
          points: tx.pointsChange || 0,
          transactionId: tx.id
        });
      }
    }

    const columns = [
      { label: 'Date', accessor: r => r.date },
      { label: 'Type', accessor: r => r.type },
      { label: 'Item', accessor: r => r.item },
      { label: 'Category', accessor: r => r.category },
      { label: 'Points', accessor: r => r.points },
      { label: 'Transaction ID', accessor: r => r.transactionId }
    ];

    const csv = toCSV(flatData, columns);
    const filename = `${resident.user.userName.replace(/\s+/g, '_')}_records_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('Export resident records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Export voucher category records as CSV
 */
export const exportCategoryRecords = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get category info
    const category = await prisma.taskCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    // Get all tasks in this category with their completions
    const tasks = await prisma.task.findMany({
      where: { taskCategoryId: parseInt(categoryId) },
      include: {
        completions: {
          include: {
            transaction: {
              include: {
                user: { select: { userName: true } }
              }
            }
          }
        }
      }
    });

    // Flatten data
    const flatData = [];
    for (const task of tasks) {
      for (const comp of task.completions) {
        flatData.push({
          taskName: task.taskName,
          points: task.points,
          residentName: comp.transaction?.user?.userName || '',
          date: comp.transaction?.transactionDate 
            ? new Date(comp.transaction.transactionDate).toISOString().split('T')[0] 
            : '',
          transactionId: comp.transactionId
        });
      }

      // If no completions, still include the task
      if (task.completions.length === 0) {
        flatData.push({
          taskName: task.taskName,
          points: task.points,
          residentName: '',
          date: '',
          transactionId: ''
        });
      }
    }

    const columns = [
      { label: 'Voucher Name', accessor: r => r.taskName },
      { label: 'Points', accessor: r => r.points },
      { label: 'Resident', accessor: r => r.residentName },
      { label: 'Completion Date', accessor: r => r.date },
      { label: 'Transaction ID', accessor: r => r.transactionId }
    ];

    const csv = toCSV(flatData, columns);
    const catName = (category.taskCategoryName || 'category').replace(/\s+/g, '_');
    const filename = `${catName}_records_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('Export category records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Export all voucher records as CSV
 */
export const exportAllRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { transactionType: 'completion' };
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { userName: true } },
        completions: {
          include: {
            task: {
              select: {
                taskName: true,
                points: true,
                taskCategory: { select: { taskCategoryName: true } }
              }
            }
          }
        }
      },
      orderBy: { transactionDate: 'desc' }
    });

    const flatData = [];
    for (const tx of transactions) {
      for (const comp of tx.completions) {
        flatData.push({
          date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
          residentName: tx.user?.userName || '',
          voucherName: comp.task?.taskName || '',
          category: comp.task?.taskCategory?.taskCategoryName || '',
          points: comp.task?.points || 0,
          transactionId: tx.id
        });
      }
    }

    const columns = [
      { label: 'Date', accessor: r => r.date },
      { label: 'Resident', accessor: r => r.residentName },
      { label: 'Voucher Name', accessor: r => r.voucherName },
      { label: 'Category', accessor: r => r.category },
      { label: 'Points', accessor: r => r.points },
      { label: 'Transaction ID', accessor: r => r.transactionId }
    ];

    const csv = toCSV(flatData, columns);
    const filename = `all_voucher_records_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('Export all records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
