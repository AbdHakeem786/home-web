import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkerProfile, IAvailabilitySlot } from "../models/WorkerProfile";
import { Review } from "../models/Review";
import { Category } from "../models/Category";
import { AppError } from "../utils/AppError";
import { ok, created, paginated } from "../utils/apiResponse";
import { getIO } from "../realtime/socket";
import { escapeRegex } from "../utils/regex";
import { initials } from "../utils/initials";

export async function listWorkers(req: Request, res: Response): Promise<void> {
  const { category, online, verified, minRating, search, lat, lng, sort } = req.query as Record<string, string>;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  const match: Record<string, unknown> = {};
  if (category) {
    const cat = await Category.findOne({ name: new RegExp(`^${escapeRegex(category)}$`, "i") });
    if (cat) {
      match.category = cat._id;
    } else if (mongoose.Types.ObjectId.isValid(category)) {
      match.category = new mongoose.Types.ObjectId(category);
    } else {
      // Unknown category name/id - no worker can match, so short-circuit to an empty page
      // instead of letting an invalid ObjectId string crash the request with a 500.
      paginated(res, [], page, limit, 0);
      return;
    }
  }
  if (online !== undefined) match.online = online === "true";
  if (verified !== undefined) match.verified = verified === "true";
  if (minRating !== undefined) match.rating = { $gte: Number(minRating) };

  const lookups: mongoose.PipelineStage[] = [
    { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
  ];
  const searchMatch: mongoose.PipelineStage[] = search
    ? [
        {
          $match: {
            $or: [
              { "user.name": new RegExp(escapeRegex(search), "i") },
              { "category.name": new RegExp(escapeRegex(search), "i") },
              { skills: new RegExp(escapeRegex(search), "i") },
              { bio: new RegExp(escapeRegex(search), "i") },
            ],
          },
        },
      ]
    : [];

  const sortStage: Record<string, 1 | -1> =
    sort === "rating"
      ? { rating: -1 }
      : sort === "price"
      ? { priceFrom: 1 }
      : sort === "experience"
      ? { experienceYears: -1 }
      : lat !== undefined && lng !== undefined
      ? { distanceMeters: 1 }
      : { createdAt: -1 };

  let workers: mongoose.AnyObject[];
  let total: number;

  if (lat !== undefined && lng !== undefined) {
    // $geoNear silently excludes documents without a location field (that's how the
    // 2dsphere index works) - most workers never share GPS coordinates, so a plain
    // geoNear pipeline would make them flicker in and out as soon as the customer's
    // browser resolves its position. Run distance-sort and no-location workers as two
    // branches and merge, so everyone still shows up (just without a distance badge).
    const withLocationPipeline: mongoose.PipelineStage[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distanceMeters",
          spherical: true,
          query: match,
        },
      },
      ...lookups,
      ...searchMatch,
      { $sort: sortStage },
    ];
    const noLocationMatch = {
      ...match,
      $or: [
        { location: { $exists: false } },
        { "location.coordinates": { $exists: false } },
        { "location.coordinates": { $size: 0 } },
      ],
    };
    const fallbackSort = sortStage.distanceMeters ? { rating: -1 as const } : sortStage;
    const withoutLocationPipeline: mongoose.PipelineStage[] = [
      { $match: noLocationMatch },
      ...lookups,
      ...searchMatch,
      { $sort: fallbackSort },
    ];

    const [withLocation, withoutLocation] = await Promise.all([
      WorkerProfile.aggregate(withLocationPipeline),
      WorkerProfile.aggregate(withoutLocationPipeline),
    ]);
    const combined = [...withLocation, ...withoutLocation];
    total = combined.length;
    workers = combined.slice((page - 1) * limit, (page - 1) * limit + limit);
  } else {
    const pipeline: mongoose.PipelineStage[] = [{ $match: match }, ...lookups, ...searchMatch, { $sort: sortStage }];
    const countPipeline = [...pipeline, { $count: "total" }];
    const dataPipeline = [...pipeline, { $skip: (page - 1) * limit }, { $limit: limit }];

    const [countResult, dataResult] = await Promise.all([
      WorkerProfile.aggregate(countPipeline),
      WorkerProfile.aggregate(dataPipeline),
    ]);
    total = countResult[0]?.total ?? 0;
    workers = dataResult;
  }

  const shaped = workers.map((w) => ({
    id: w._id.toString(),
    name: w.user.name,
    avatar: w.user.avatar ?? initials(w.user.name),
    category: w.category.name,
    categoryId: w.category._id.toString(),
    rating: w.rating,
    reviewCount: w.reviewCount,
    completedJobs: w.completedJobs,
    experienceYears: w.experienceYears,
    priceFrom: w.priceFrom,
    distanceKm: w.distanceMeters !== undefined ? Math.round((w.distanceMeters / 1000) * 10) / 10 : null,
    online: w.online,
    verified: w.verified,
    bio: w.bio,
  }));

  paginated(res, shaped, page, limit, total);
}

export async function getWorkerProfile(req: Request, res: Response): Promise<void> {
  const worker = await WorkerProfile.findById(req.params.id)
    .populate("user", "name avatar")
    .populate("category", "name icon");
  if (!worker) throw AppError.notFound("Worker not found");

  const reviews = await Review.find({ worker: worker._id })
    .populate("customer", "name")
    .sort({ createdAt: -1 })
    .limit(50);

  ok(res, { worker, reviews });
}

export async function createMyWorkerProfile(req: Request, res: Response): Promise<void> {
  const existing = await WorkerProfile.findOne({ user: req.auth!.userId });
  if (existing) throw AppError.conflict("Worker profile already exists");

  const { category, bio, priceFrom, experienceYears, lat, lng, skills, cnicImage, documents } = req.body;

  const categoryDoc = await Category.findById(category).catch(() => null);
  const resolvedCategory = categoryDoc?._id ?? (await Category.findOne({ name: category }))?._id;
  if (!resolvedCategory) throw AppError.badRequest("Invalid category");

  const profile = await WorkerProfile.create({
    user: req.auth!.userId,
    category: resolvedCategory,
    bio,
    priceFrom,
    experienceYears,
    skills: skills ?? [],
    cnicImage,
    documents: documents ?? [],
    location: lat !== undefined && lng !== undefined ? { type: "Point", coordinates: [lng, lat] } : undefined,
  });

  created(res, profile);
}

export async function updateMyWorkerProfile(req: Request, res: Response): Promise<void> {
  const profile = await WorkerProfile.findOne({ user: req.auth!.userId });
  if (!profile) throw AppError.notFound("Worker profile not found");

  const { category, bio, priceFrom, experienceYears, online, lat, lng, skills, cnicImage, documents } = req.body;

  if (category) {
    const categoryDoc = (await Category.findById(category).catch(() => null)) ?? (await Category.findOne({ name: category }));
    if (!categoryDoc) throw AppError.badRequest("Invalid category");
    profile.category = categoryDoc._id;
  }
  if (bio !== undefined) profile.bio = bio;
  if (priceFrom !== undefined) profile.priceFrom = priceFrom;
  if (experienceYears !== undefined) profile.experienceYears = experienceYears;
  if (online !== undefined) profile.online = online;
  if (lat !== undefined && lng !== undefined) profile.location = { type: "Point", coordinates: [lng, lat] };
  if (skills !== undefined) profile.skills = skills;
  if (cnicImage !== undefined) profile.cnicImage = cnicImage;
  if (documents !== undefined) profile.documents = documents;

  await profile.save();
  ok(res, profile);
}

export async function updateMyLocation(req: Request, res: Response): Promise<void> {
  const { lat, lng, bookingId } = req.body as { lat: number; lng: number; bookingId?: string };

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.auth!.userId },
    { location: { type: "Point", coordinates: [lng, lat] } },
    { new: true }
  );
  if (!profile) throw AppError.notFound("Worker profile not found");

  if (bookingId) {
    getIO()?.to(`booking:${bookingId}`).emit("tracking:location", { lat, lng, at: Date.now() });
  }

  ok(res, { location: profile.location });
}

export async function updateMyAvailability(req: Request, res: Response): Promise<void> {
  const { online } = req.body as { online: boolean };

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.auth!.userId },
    { online },
    { new: true }
  );
  if (!profile) throw AppError.notFound("Worker profile not found");

  ok(res, { online: profile.online });
}

export async function updateMySchedule(req: Request, res: Response): Promise<void> {
  const { schedule } = req.body as { schedule: IAvailabilitySlot[] };

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.auth!.userId },
    { schedule },
    { new: true }
  );
  if (!profile) throw AppError.notFound("Worker profile not found");

  ok(res, { schedule: profile.schedule });
}

export async function getMyWorkerProfile(req: Request, res: Response): Promise<void> {
  const profile = await WorkerProfile.findOne({ user: req.auth!.userId })
    .populate("user", "name avatar")
    .populate("category", "name icon");
  if (!profile) throw AppError.notFound("Worker profile not found");
  ok(res, profile);
}

export async function verifyWorker(req: Request, res: Response): Promise<void> {
  const profile = await WorkerProfile.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
  if (!profile) throw AppError.notFound("Worker not found");
  ok(res, profile);
}
