import { prisma } from '../lib/db.js';

export const getFeedbackList = async ({ search = "", category = "all", rating = 0, sortBy = "newest", page = 1, pageSize = 5 } = {}) => {
  const where = {
    ...(category !== "all" && {
      Feedback_Category: category,
    }),
    ...(rating !== 0 && {
      Rating: rating,
    }),
    ...(search && {
      OR: [
        { MWH_Resident: { user: { userName: { contains: search, mode: "insensitive" } } } },
        { Feedback: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy = {
    newest:      { Submitted_At: "desc" },
    oldest:      { Submitted_At: "asc"  },
    rating_desc: { Rating: "desc"       },
    rating_asc:  { Rating: "asc"        },
  }[sortBy] ?? { Submitted_At: "desc" };

  const [rows, total] = await Promise.all([
    prisma.mWH_Rating_Feedback.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        MWH_Resident: {
          include: { user: true },
        },
      },
    }),
    prisma.mWH_Rating_Feedback.count({ where }),
  ]);

  const data = rows.map((row) => {
    const name     = row.MWH_Resident.user.userName ?? "Unknown";
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    return {
      feedbackId:       Number(row.Feedback_ID),
      userId:           row.User_ID,
      residentName:     name,
      initials,
      rating:           row.Rating,
      feedback:         row.Feedback ?? null,
      feedbackCategory: row.Feedback_Category ?? null,
      submittedAt:      row.Submitted_At.toISOString().split("T")[0],
    };
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getFeedbackStats = async () => {
  const [total, complaints, avg] = await Promise.all([
    prisma.mWH_Rating_Feedback.count(),
    prisma.mWH_Rating_Feedback.count({ where: { Feedback_Category: "complaint" } }),
    prisma.mWH_Rating_Feedback.aggregate({ _avg: { Rating: true } }),
  ]);

  return {
    total,
    complaints,
    avg: avg._avg.Rating != null ? avg._avg.Rating.toFixed(1) : "—",
  };
}