import { prisma } from '../lib/db.js';

export const getProductRequestList = async ({
  search = "", category = "all", status = "all",
  sortBy = "newest", page = 1, pageSize = 5
} = {}) => {

  const where = {
    ...(status !== "all" && { Request_Status: status }),
    ...(category !== "all" && { Request_Category: category }),
    ...(search && {
      OR: [
        { Resident_Name: { contains: search, mode: "insensitive" } },
        { Product_Name:  { contains: search, mode: "insensitive" } },
        { Description:   { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy = sortBy === "oldest"
    ? { Submitted_At: "asc" }
    : { Submitted_At: "desc" };

  const [rows, total] = await Promise.all([
    prisma.mWH_Product_Request.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mWH_Product_Request.count({ where }),
  ]);

  const data = rows.map((row) => {
    const name     = row.Resident_Name ?? "Anonymous";
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    return {
      requestId:       Number(row.Request_ID),
      residentName:    name,
      initials,
      productName:     row.Product_Name,
      description:     row.Description ?? null,
      requestCategory: row.Request_Category ?? null,
      requestStatus:   row.Request_Status ?? "pending",
      submittedAt:     row.Submitted_At?.toISOString().split("T")[0] ?? null,
      updatedAt:       row.Updated_At?.toISOString().split("T")[0] ?? null,
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

export const updateProductRequestStatus = async (requestId, status) => {
  return prisma.mWH_Product_Request.update({
    where: { Request_ID: BigInt(requestId) },
    data:  { Request_Status: status, Updated_At: new Date() },
  });
};