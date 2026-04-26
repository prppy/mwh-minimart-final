import { prisma } from '../lib/db.js';

export const getFeedbackList = async ({ search = "", category = "all", rating = 0, sortBy = "newest", status = "new", page = 1, pageSize = 5 } = {}) => {
  const where = {
    ...(status !== "all" && { Feedback_Status: status }),
    ...(category !== "all" && { Feedback_Category: category }),
    ...(rating !== 0 && { Rating: rating }),
    ...(search && {
      OR: [
        { Resident_Name: { contains: search, mode: "insensitive" } },
        { Feedback: { contains: search, mode: "insensitive" } },
        { MWH_Resident: { user: { userName: { contains: search, mode: "insensitive" } } } },
      ],
    }),
  };

  const secondarySort = {
    newest:      { Submitted_At: "desc" },
    oldest:      { Submitted_At: "asc"  },
    rating_desc: { Rating: "desc"       },
    rating_asc:  { Rating: "asc"        },
  }[sortBy] ?? { Submitted_At: "desc" };

  const orderBy = [
    { Feedback_Status: "asc" },
    secondarySort,
  ];

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
    // ── Name: prefer typed name, fall back to linked resident, then Unknown
    const name     = row.Resident_Name
      ?? row.MWH_Resident?.user?.userName
      ?? "Unknown";
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    return {
      feedbackId:       Number(row.Feedback_ID),
      userId:           row.User_ID ?? null,
      residentName:     name,
      initials,
      rating:           row.Rating,
      feedback:         row.Feedback ?? null,
      feedbackCategory: row.Feedback_Category ?? null,
      feedbackStatus:   row.Feedback_Status,
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
};

export const getFeedbackStats = async () => {
  const [total, complaints, avg, newCount] = await Promise.all([
    prisma.mWH_Rating_Feedback.count(),
    prisma.mWH_Rating_Feedback.count({ where: { Feedback_Category: "complaint" } }),
    prisma.mWH_Rating_Feedback.aggregate({ _avg: { Rating: true } }),
    prisma.mWH_Rating_Feedback.count({ where: { Feedback_Status: "new" } }),
  ]);

  return {
    total,
    complaints,
    newCount,
    avg: avg._avg.Rating != null ? avg._avg.Rating.toFixed(1) : "—",
  };
};

export const getAllFeedbackForExport = async () => {
  const rows = await prisma.mWH_Rating_Feedback.findMany({
    orderBy: [
      { Feedback_Status: "asc"  },
      { Submitted_At:    "desc" },
    ],
    include: {
      MWH_Resident: {
        include: { user: true },
      },
    },
  });

  return rows.map((row) => ({
    feedbackId:       Number(row.Feedback_ID),
    residentName:     row.Resident_Name ?? row.MWH_Resident?.user?.userName ?? "Unknown",
    userId:           row.User_ID ?? null,
    rating:           row.Rating,
    feedback:         row.Feedback ?? "",
    feedbackCategory: row.Feedback_Category ?? "",
    feedbackStatus:   row.Feedback_Status,
    submittedAt:      row.Submitted_At.toISOString().replace("T", " ").slice(0, 19),
  }));
};

export const updateFeedbackStatus = async (feedbackId, status) => {
  return prisma.mWH_Rating_Feedback.update({
    where: { Feedback_ID: BigInt(feedbackId) },
    data:  { Feedback_Status: status },
  });
};

export const createRating = async ({ residentName, rating, feedbackCategory, feedback }) => {
  return prisma.mWH_Rating_Feedback.create({
    data: {
      Resident_Name:     residentName || null,
      Rating:            rating,
      Feedback:          feedback || null,
      Feedback_Category: feedbackCategory || null,
      Feedback_Status:   "new",
    },
  });
};

export const createProductRequest = async ({ residentName, productName, description, requestCategory }) => {
  return prisma.mWH_Product_Request.create({
    data: {
      Resident_Name:    residentName || null,
      Product_Name:     productName,
      Description:      description || null,
      Request_Category: requestCategory || null,
      Request_Status:   "pending",
    },
  });
};