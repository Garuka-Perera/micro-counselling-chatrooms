const express = require("express");
const prisma = require("../prisma");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);
router.use(requireRole("ADMIN"));

function parsePagination(req) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 5));
  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
  };
}

function buildPagedResponse({ items, total, page, pageSize, key }) {
  return {
    [key]: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasNextPage: page * pageSize < total,
      hasPrevPage: page > 1,
    },
  };
}

router.get("/overview", async (req, res) => {
  try {
    const [
      totalListeners,
      pendingListeners,
      approvedListeners,
      suspendedListeners,
      availableListeners,
      totalReports,
      openReports,
      resolvedReports,
      totalFeedback,
      avgFeedback,
      highRiskSessions,
      flaggedSessions,
      deactivatedUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "LISTENER" } }),
      prisma.user.count({ where: { role: "LISTENER", listenerStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "LISTENER", listenerStatus: "APPROVED" } }),
      prisma.user.count({ where: { role: "LISTENER", listenerStatus: "SUSPENDED" } }),
      prisma.user.count({ where: { role: "LISTENER", isAvailable: true } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.feedback.count(),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
      prisma.chatSession.count({
        where: {
          OR: [{ riskLevel: "HIGH" }, { highRiskDetected: true }],
        },
      }),
      prisma.chatSession.count({
        where: {
          flaggedCount: { gt: 0 },
        },
      }),
      prisma.user.count({
        where: {
          isActive: false,
        },
      }),
    ]);

    return res.json({
      stats: {
        totalListeners,
        pendingListeners,
        approvedListeners,
        suspendedListeners,
        availableListeners,
        totalReports,
        openReports,
        resolvedReports,
        totalFeedback,
        averageRating: avgFeedback?._avg?.rating
          ? Number(avgFeedback._avg.rating).toFixed(1)
          : "0.0",
        highRiskSessions,
        flaggedSessions,
        deactivatedUsers,
      },
    });
  } catch (error) {
    console.error("GET /admin/overview error:", error);
    return res.status(500).json({ message: "Failed to load admin overview." });
  }
});

router.get("/listeners", async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePagination(req);

    const where = {
      role: "LISTENER",
    };

    const [total, listeners] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ listenerStatus: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          language: true,
          specialty: true,
          listenerStatus: true,
          isAvailable: true,
          isActive: true,
          suspendedAt: true,
          suspendedReason: true,
          createdAt: true,
        },
      }),
    ]);

    return res.json(buildPagedResponse({ items: listeners, total, page, pageSize, key: "listeners" }));
  } catch (error) {
    console.error("GET /admin/listeners error:", error);
    return res.status(500).json({ message: "Failed to load listeners." });
  }
});

router.patch("/listeners/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const listener = await prisma.user.findFirst({
      where: {
        id,
        role: "LISTENER",
      },
    });

    if (!listener) {
      return res.status(404).json({ message: "Listener not found." });
    }

    const updatedListener = await prisma.user.update({
      where: { id },
      data: {
        listenerStatus: "APPROVED",
        isActive: true,
        suspendedAt: null,
        suspendedReason: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        language: true,
        specialty: true,
        listenerStatus: true,
        isAvailable: true,
        isActive: true,
      },
    });

    return res.json({
      message: "Listener approved successfully.",
      listener: updatedListener,
    });
  } catch (error) {
    console.error("PATCH /admin/listeners/:id/approve error:", error);
    return res.status(500).json({ message: "Failed to approve listener." });
  }
});

router.patch("/listeners/:id/suspend", async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason?.trim() || "Suspended by admin.";

    const listener = await prisma.user.findFirst({
      where: {
        id,
        role: "LISTENER",
      },
    });

    if (!listener) {
      return res.status(404).json({ message: "Listener not found." });
    }

    const updatedListener = await prisma.user.update({
      where: { id },
      data: {
        listenerStatus: "SUSPENDED",
        isAvailable: false,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        language: true,
        specialty: true,
        listenerStatus: true,
        isAvailable: true,
        isActive: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    return res.json({
      message: "Listener suspended successfully.",
      listener: updatedListener,
    });
  } catch (error) {
    console.error("PATCH /admin/listeners/:id/suspend error:", error);
    return res.status(500).json({ message: "Failed to suspend listener." });
  }
});

router.patch("/users/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason?.trim() || "Deactivated by admin.";

    const target = await prisma.user.findUnique({
      where: { id },
    });

    if (!target) {
      return res.status(404).json({ message: "User not found." });
    }

    if (target.role === "ADMIN") {
      return res.status(400).json({ message: "Admin accounts cannot be deactivated here." });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isAvailable: false,
        suspendedAt: new Date(),
        suspendedReason: reason,
        ...(target.role === "LISTENER" ? { listenerStatus: "SUSPENDED" } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        listenerStatus: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    return res.json({
      message: "Account deactivated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /admin/users/:id/deactivate error:", error);
    return res.status(500).json({ message: "Failed to deactivate user." });
  }
});

router.patch("/reports/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const adminNote = req.body?.adminNote?.trim() || null;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedById: req.user.id,
        adminNote,
      },
    });

    return res.json({
      message: "Report resolved successfully.",
      report: updatedReport,
    });
  } catch (error) {
    console.error("PATCH /admin/reports/:id/resolve error:", error);
    return res.status(500).json({ message: "Failed to resolve report." });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePagination(req);
    const status = (req.query.status || "").trim();
    const category = (req.query.category || "").trim();
    const search = (req.query.search || "").trim();

    const where = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { adminNote: { contains: search, mode: "insensitive" } },
        { reporter: { fullName: { contains: search, mode: "insensitive" } } },
        { reporter: { email: { contains: search, mode: "insensitive" } } },
        { reportedUser: { fullName: { contains: search, mode: "insensitive" } } },
        { reportedUser: { email: { contains: search, mode: "insensitive" } } },
        { session: { topic: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
              listenerStatus: true,
              suspendedAt: true,
              suspendedReason: true,
            },
          },
          session: {
            select: {
              id: true,
              topic: true,
              status: true,
              mode: true,
              riskLevel: true,
              riskReason: true,
              highRiskDetected: true,
              emergencyNoticeSent: true,
              flaggedCount: true,
              startedAt: true,
              endedAt: true,
              userId: true,
              listenerId: true,
            },
          },
        },
      }),
    ]);

    return res.json(buildPagedResponse({ items: reports, total, page, pageSize, key: "reports" }));
  } catch (error) {
    console.error("GET /admin/reports error:", error);
    return res.status(500).json({ message: "Failed to load reports." });
  }
});

router.get("/high-risk-sessions", async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePagination(req);
    const risk = (req.query.risk || "").trim();
    const search = (req.query.search || "").trim();

    const where = {
      OR: [
        { riskLevel: "HIGH" },
        { highRiskDetected: true },
        { flaggedCount: { gt: 0 } },
      ],
    };

    if (risk && risk !== "ALL") {
      where.AND = [...(where.AND || []), { riskLevel: risk }];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { topic: { contains: search, mode: "insensitive" } },
            { riskReason: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { listener: { fullName: { contains: search, mode: "insensitive" } } },
            { listener: { email: { contains: search, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [total, sessions] = await Promise.all([
      prisma.chatSession.count({ where }),
      prisma.chatSession.findMany({
        where,
        orderBy: [
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              anonymousAlias: true,
              isActive: true,
            },
          },
          listener: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
              listenerStatus: true,
            },
          },
        },
      }),
    ]);

    return res.json(buildPagedResponse({ items: sessions, total, page, pageSize, key: "sessions" }));
  } catch (error) {
    console.error("GET /admin/high-risk-sessions error:", error);
    return res.status(500).json({ message: "Failed to load high-risk sessions." });
  }
});

router.get("/feedback", async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePagination(req);

    const where = {};

    const [total, feedback] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
        include: {
          submittedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          session: {
            select: {
              id: true,
              topic: true,
              status: true,
              mode: true,
              riskLevel: true,
              startedAt: true,
              endedAt: true,
              userId: true,
              listenerId: true,
            },
          },
        },
      }),
    ]);

    return res.json(buildPagedResponse({ items: feedback, total, page, pageSize, key: "feedback" }));
  } catch (error) {
    console.error("GET /admin/feedback error:", error);
    return res.status(500).json({ message: "Failed to load feedback." });
  }
});

module.exports = router;