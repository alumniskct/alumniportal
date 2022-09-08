import asyncHandler from "express-async-handler";
import AlumniData from "../models/Alumni-data.js";

export const getAlumniData = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  const alumniData = await AlumniData.findOne({
    email: email,
  });

  if (!alumniData) {
    return res.status(400).json({
      message: "No Alumni Data found",
    });
  }

  return res.json(alumniData);
});

export const getAllAlumniData = asyncHandler(async (req, res) => {
  const { offset = 0, entries = 10 } = req.query;

  const alumniData = await AlumniData.aggregate([
    { $skip: +offset },
    {
      $limit: +entries,
    },
  ]);

  if (!alumniData) {
    res.status(400);
    throw new Error("No Alumni Data Available");
  }

  res.json(alumniData);
});
