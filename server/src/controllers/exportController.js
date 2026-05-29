// controllers/exportController.js
import * as XLSX from 'xlsx';
import { prisma } from '../lib/db.js';

/**
 * Convert array of objects to Excel buffer using SheetJS
 */
const toExcelBuffer = (data, columns, sheetName = 'Records') => {
  if (!data || data.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // Format data for sheet consumption (map with exact headers)
  const formattedData = data.map(row => {
    const obj = {};
    columns.forEach(col => {
      let val = col.accessor(row);
      if (val === null || val === undefined) val = '';
      obj[col.label] = val;
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);

  // Set nice auto-calculated column widths
  const maxProps = {};
  formattedData.forEach(row => {
    Object.keys(row).forEach(key => {
      const len = String(row[key] || '').length;
      maxProps[key] = Math.max(maxProps[key] || 10, len, key.length);
    });
  });
  ws['!cols'] = Object.keys(maxProps).map(key => ({ wch: maxProps[key] + 3 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Export individual resident's transaction records as Excel
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

    // Flatten transactions for Excel with points-inflation fix
    const flatData = [];
    for (const tx of transactions) {
      if (tx.transactionType === 'completion') {
        if (!tx.completions || tx.completions.length === 0) {
          flatData.push({
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
            type: 'Voucher Completion',
            item: '',
            category: '',
            points: tx.pointsChange || 0,
            transactionId: tx.id
          });
        } else {
          for (const comp of tx.completions) {
            flatData.push({
              date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
              type: 'Voucher Completion',
              item: comp.task?.taskName || '',
              category: comp.task?.taskCategory?.taskCategoryName || '',
              points: comp.task?.points || 0, // FIXED: use individual task points to prevent duplication/inflation
              transactionId: tx.id
            });
          }
        }
      } else if (tx.transactionType === 'redemption') {
        if (!tx.redemptions || tx.redemptions.length === 0) {
          flatData.push({
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
            type: 'Redemption',
            item: '',
            category: '',
            points: tx.pointsChange || 0,
            transactionId: tx.id
          });
        } else {
          for (const red of tx.redemptions) {
            const prodQuantity = red.productQuantity || 1;
            const prodPoints = red.product?.points || 0;
            flatData.push({
              date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
              type: 'Redemption',
              item: `${red.product?.productName || ''} (Qty: ${prodQuantity})`,
              category: '',
              points: -(prodPoints * prodQuantity) || tx.pointsChange || 0, // FIXED: use individual product cost * quantity
              transactionId: tx.id
            });
          }
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

    const buffer = toExcelBuffer(flatData, columns, 'Resident Records');
    const filename = `${resident.user.userName.replace(/\s+/g, '_')}_records_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Export resident records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Export voucher category records as Excel
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
                user: {
                  select: {
                    userName: true,
                    resident: {
                      select: {
                        serialNumber: true,
                        batchNumber: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Flatten data including serial and batch numbers
    const flatData = [];
    for (const task of tasks) {
      for (const comp of task.completions) {
        flatData.push({
          taskName: task.taskName,
          points: task.points,
          residentName: comp.transaction?.user?.userName || '',
          serialNumber: comp.transaction?.user?.resident?.serialNumber || '',
          batchNumber: comp.transaction?.user?.resident?.batchNumber || '',
          date: comp.transaction?.transactionDate 
            ? new Date(comp.transaction.transactionDate).toISOString().split('T')[0] 
            : 'N/A',
          transactionId: comp.transactionId
        });
      }
    }

    const columns = [
      { label: 'Voucher Name', accessor: r => r.taskName },
      { label: 'Points', accessor: r => r.points },
      { label: 'Resident Name', accessor: r => r.residentName },
      { label: 'Serial Number', accessor: r => r.serialNumber },
      { label: 'Batch Number', accessor: r => r.batchNumber },
      { label: 'Completion Date', accessor: r => r.date },
      { label: 'Transaction ID', accessor: r => r.transactionId }
    ];

    const buffer = toExcelBuffer(flatData, columns, 'Category Records');
    const catName = (category.taskCategoryName || 'category').replace(/\s+/g, '_');
    const filename = `${catName}_records_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Export category records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * Export all voucher records as Excel
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
        user: {
          select: {
            userName: true,
            resident: {
              select: {
                serialNumber: true,
                batchNumber: true
              }
            }
          }
        },
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
      if (!tx.completions || tx.completions.length === 0) {
        flatData.push({
          date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
          residentName: tx.user?.userName || '',
          serialNumber: tx.user?.resident?.serialNumber || '',
          batchNumber: tx.user?.resident?.batchNumber || '',
          voucherName: '',
          category: '',
          points: tx.pointsChange || 0,
          transactionId: tx.id
        });
      } else {
        for (const comp of tx.completions) {
          flatData.push({
            date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
            residentName: tx.user?.userName || '',
            serialNumber: tx.user?.resident?.serialNumber || '',
            batchNumber: tx.user?.resident?.batchNumber || '',
            voucherName: comp.task?.taskName || '',
            category: comp.task?.taskCategory?.taskCategoryName || '',
            points: comp.task?.points || 0,
            transactionId: tx.id
          });
        }
      }
    }

    const columns = [
      { label: 'Date', accessor: r => r.date },
      { label: 'Resident Name', accessor: r => r.residentName },
      { label: 'Serial Number', accessor: r => r.serialNumber },
      { label: 'Batch Number', accessor: r => r.batchNumber },
      { label: 'Voucher Name', accessor: r => r.voucherName },
      { label: 'Category', accessor: r => r.category },
      { label: 'Points', accessor: r => r.points },
      { label: 'Transaction ID', accessor: r => r.transactionId }
    ];

    const buffer = toExcelBuffer(flatData, columns, 'All Voucher Records');
    const filename = `all_voucher_records_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Export all records error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
