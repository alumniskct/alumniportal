import Alumni from "../models/Alumni.js";
import asyncHandler from "express-async-handler";
import { getAlumniIds } from "../utils/controller-utils.js";
import User from "../models/User.js";
import AlumniRequest from "../models/AlumniRequest.js";
import notificationConstants from "../constants/notification-constants.js";
import Notification from "../models/Notification.js";
import RejectedApplication from "../models/RejectedApplication.js";
import sendEmail, { base64ToDirect } from "../utils/email.js";
import path, { resolve } from "path";
import QRCode from "qrcode";
import { __dirname } from "../index.js";
import PdfPrinter from "pdfmake";
import mongoose from "mongoose";
import fs from "fs";
import { Base64Encode } from "base64-stream";
import concat from "concat-stream";
import ejs from "ejs";
import puppeteer from "puppeteer";

export const registerAlumni = asyncHandler(async (req, res) => {
  const { user } = req.body;

  const existingAlumni = await Alumni.findOne({ user });

  if (existingAlumni) {
    return res.status(400).json({
      error: "You're already registered as an Alumni",
    });
  }

  const alumni = await Alumni.create(req.body);

  if (alumni) {
    await User.findByIdAndUpdate(user, {
      $set: {
        alumni: alumni._id,
      },
    });

    await Notification.create({
      user,
      type: notificationConstants.ALUMNI_REQUEST,
      message:
        "Your request has been sent to the admin. You will be notified once your request is approved.",
    });

    return res.status(200).json({
      _id: alumni._id,
      user: alumni.user,
      isEntrepreneur: alumni.isEntrepreneur,
      isInHigherStudies: alumni.isInHigherStudies,
      designation: alumni.designation,
      companyName: alumni.companyName,
      companyEmail: alumni.companyEmail,
      companyPan: alumni.companyPan,
      companyTin: alumni.companyTin,
      organization: alumni.organization,
      secondaryCollegeName: alumni.secondaryCollegeName,
      domain: alumni.domain,
      courseName: alumni.courseName,
      social: alumni.social,
      isOfficeBearer: alumni.isOfficeBearer,
      profileDescription: alumni.profileDescription,
      isApproved: alumni.isApproved,
    });
  }

  return res.status(400).json({
    error: "Cannot register as an Alumni at this time, please try again later",
  });
});

export const deleteAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alumni = await Alumni.findOneAndDelete({ user: id });

  if (alumni) {
    await User.updateOne(
      { _id: alumni.user },
      {
        $set: {
          isAlumni: false,
          alumni: null,
        },
      }
    );

    res.status(200).json({
      message: "Alumni deleted successfully",
    });
  } else {
    res.status(400).json({
      error: "Cannot delete Alumni at this time, please try again later",
    });
  }
});

export const approveAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const alumni = await Alumni.findOneAndUpdate(
    { user: id, isApproved: false },
    {
      $set: {
        isApproved: true,
      },
    }
  ).populate("user");

  await RejectedApplication.findOneAndRemove({ user: alumni.user._id });

  if (alumni) {
    await User.findByIdAndUpdate(id, { isAlumni: true, alumni: alumni._id });

    await AlumniRequest.deleteOne({ user: id });

    await Notification.create({
      user: alumni.user._id,
      type: notificationConstants.ALUMNI_APPROVED,
      approvedBy: user._id,
      message:
        "Your request has been approved. You can now access alumni features.",
    });

    // For Sending Emails 👇
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "user_avatar_images",
    });

    const files = await bucket
      .find({
        _id: mongoose.Types.ObjectId(alumni.user?.avatar),
      })
      .toArray();

    const { contentType } = files[0];

    await new Promise((resolve, reject) => {
      let fileBase64 = "";

      const concatCb = (data) => {
        fileBase64 = `data:${contentType};base64,${data}`;
      };

      const readStream = bucket.openDownloadStream(
        mongoose.Types.ObjectId(alumni.user?.avatar)
      );

      readStream
        .pipe(new Base64Encode())
        .pipe(concat(concatCb))
        .on("error", (error) => {
          reject(error);
        })
        .on("finish", async () => {
          const qrCodeUrl = await QRCode.toDataURL(
            `${req.get("host")}/qr?user=${alumni.user._id}`
          );

          const avatarUrl = `${req.get("host")}/api/v1/users/user-avatar/${
            alumni.user._id
          }`;
          const rollno = alumni.user.registerNumber;
          const name = alumni.user.name;
          const dept = alumni.user?.department;
          const yearOfPassing = alumni.user?.yearOfPassing.getFullYear();
          const yearsPassed = dept === "MBA" ? 2 : 4;
          const batch = `${yearOfPassing - yearsPassed} - ${yearOfPassing} `;

          const contact = alumni.user?.phoneNumber;

          const templatePath = path.join(
            __dirname,
            "templates",
            "approval-mail.ejs"
          );

          const template = fs.readFileSync(templatePath, "utf-8");

          const html = ejs.render(template, {
            avatarUrl: fileBase64,
            name,
            rollno,
            dept,
            batch,
            contact,
            qrCodeUrl,
          });

          const browser = await puppeteer.launch({
            headless: false,
          });

          const page = await browser.newPage();

          await page.setDefaultNavigationTimeout(0);

          const scrollDimension = await page.evaluate(() => {
            return {
              width: document.scrollingElement.scrollWidth,
              height: document.scrollingElement.scrollHeight,
            };
          });

          await page.setViewport({
            width: 906,
            height: scrollDimension.height,
          });

          await page.setContent(html);

          const pdf = await page.pdf({
            printBackground: true,
            height: scrollDimension.height,
            preferCSSPageSize: false,
            margin: {
              top: 0,
              bottom: 0,
              right: 0,
              left: 0,
            },
          });

          await browser.close();

          const { error } = await sendEmail(
            alumni.user?.email,
            "SKCT Alumni Portal - Your Alumni Request has been approved",
            {
              avatarUrl: fileBase64,
              name,
              rollno,
              dept,
              batch,
              contact,
              qrCodeUrl,
            },
            path.join(__dirname, "templates", "mail-content.ejs"),
            {
              attachments: [
                {
                  filename: `${name}'s Alumni Membership Card | SKCT.pdf`,
                  content: pdf,
                },
                {
                  filename: "Instructions.pdf",
                  path: path.join(
                    __dirname,
                    "uploads",
                    "alumni_instructions.pdf"
                  ),
                },
              ],
            }
          );

          fs.writeFileSync(
            path.join(__dirname, "uploads", "generated", `${rollno}.pdf`),
            pdf
          );

          if (error) {
            console.log(error);
            res.status(400);
            throw new Error("Sorry, Couldn't Send you a Email right now!");
          }
        });

      readStream.on("error", function (err) {
        const filename = __dirname + "/uploads/default.jpeg";
        const fsStream = fs.createReadStream(filename);
        fsStream.on("open", function () {
          fsStream.pipe(new Base64Encode()).pipe(concat(concatCb));
        });
        fsStream.on("error", function (err) {
          res.end(err);
        });
      });

      resolve(true);
    });

    return res.status(200).json({
      message: "Alumni approved successfully",
    });
  }

  return res.status(400).json({
    error: "User not registered as an Alumni or already approved",
  });
});

export const updateAlumni = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alumni = Alumni.findOneAndUpdate({ user: id }, req.body, (err) => {
    console.log(err);
  });

  if (alumni) {
    res.status(200).json({
      message: "Alumni updated successfully",
    });
  } else {
    res.status(400).json({
      error: "Cannot update Alumni at this time, please try again later",
    });
  }
});

export const generateAlumniPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const alumni = await Alumni.findOne({
    user: mongoose.Types.ObjectId(id),
  }).populate("user");

  if (!alumni) {
    return res.status(404).json({ error: "Alumni not found" });
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "user_avatar_images",
  });

  const files = await bucket
    .find({
      _id: mongoose.Types.ObjectId(alumni.user?.avatar),
    })
    .toArray();

  const { contentType } = files[0];

  await new Promise((resolve, reject) => {
    let fileBase64 = "";

    const concatCb = (data) => {
      fileBase64 = `data:${contentType};base64,${data}`;
    };

    const readStream = bucket.openDownloadStream(
      mongoose.Types.ObjectId(alumni.user?.avatar)
    );

    readStream
      .pipe(new Base64Encode())
      .pipe(concat(concatCb))
      .on("error", (error) => {
        reject(error);
      })
      .on("finish", async () => {
        const qrCodeUrl = await QRCode.toDataURL(
          `${req.get("host")}/qr?user=${alumni.user._id}`
        );

        const avatarUrl = `${req.get("host")}/api/v1/users/user-avatar/${
          alumni.user._id
        }`;
        const rollno = alumni.user.registerNumber;
        const name = alumni.user.name;
        const dept = alumni.user?.department;
        const yearOfPassing = alumni.user?.yearOfPassing.getFullYear();
        const yearsPassed = dept === "MBA" ? 2 : 4;
        const batch = `${yearOfPassing - yearsPassed} - ${yearOfPassing} `;

        const contact = alumni.user?.phoneNumber;

        const templatePath = path.join(
          __dirname,
          "templates",
          "approval-mail.ejs"
        );

        const template = fs.readFileSync(templatePath, "utf-8");

        const html = ejs.render(template, {
          avatarUrl: fileBase64,
          name,
          rollno,
          dept,
          batch,
          contact,
          qrCodeUrl,
        });

        const browser = await puppeteer.launch({
          headless: "new",
          args: ["--no-sandbox"],
          env: {
            DISPLAY: ":10.0",
          },
        });

        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(0);

        const scrollDimension = await page.evaluate(() => {
          return {
            width: document.scrollingElement.scrollWidth,
            height: document.scrollingElement.scrollHeight,
          };
        });

        await page.setViewport({
          width: 906,
          height: scrollDimension.height,
        });

        await page.setContent(html);

        const pdf = await page.pdf({
          printBackground: true,
          height: "600px",
          preferCSSPageSize: false,
          margin: {
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
          },
        });

        await browser.close();

        fs.writeFileSync(
          path.join(__dirname, "uploads", "generated", `${rollno}.pdf`),
          pdf
        );

        const filePath = path.join(
          __dirname,
          "uploads",
          "generated",
          `${rollno}.pdf`
        );
        const fileName = `${rollno}.pdf`;

        res.setHeader("Content-disposition", fileName);

        res.setHeader("Content-Type", "application/pdf");

        res.download(filePath, fileName, (err) => {
          if (err) {
            res.send({
              error: err,
              msg: "Problem downloading the file",
            });
          }
        });
      });

    readStream.on("error", function (err) {
      const filename = __dirname + "/uploads/default.jpeg";
      const fsStream = fs.createReadStream(filename);
      fsStream.on("open", function () {
        fsStream.pipe(new Base64Encode()).pipe(concat(concatCb));
      });
      fsStream.on("error", function (err) {
        res.end(err);
      });
    });

    resolve(true);
  });
});

export const getAlumniById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alumni = await Alumni.findOne({ user: id }).populate("user");

  if (alumni) {
    res.status(200).json({
      _id: alumni._id,
      user: alumni.user,
      isEntrepreneur: alumni.isEntrepreneur,
      isInHigherStudies: alumni.isInHigherStudies,
      designation: alumni.designation,
      companyName: alumni.companyName,
      companyEmail: alumni.companyEmail,
      companyPan: alumni.companyPan,
      companyTin: alumni.companyTin,
      organization: alumni.organization,
      secondaryCollegeName: alumni.secondaryCollegeName,
      domain: alumni.domain,
      courseName: alumni.courseName,
      social: alumni.social,
      isOfficeBearer: alumni.isOfficeBearer,
      profileDescription: alumni.profileDescription,
    });
  } else {
    res.status(400).json({
      error: "Cannot find Alumni at this time, please try again later",
    });
  }
});

export const setOfficeBearer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const alumni = await Alumni.findOneAndUpdate(
      { user: id },
      {
        $set: {
          isOfficeBearer: true,
        },
      }
    );

    if (alumni) {
      return res.status(200).json({
        message: "Alumni set as Office Bearer successfully",
      });
    }

    return res.status(400).json({
      error:
        "Cannot set Alumni as Office Bearer at this time, please try again later",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        error: "Wrong User Id",
      });
    }
    res.status(400).json({
      error,
    });
  }
});

export const removeOfficeBearer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const alumni = await Alumni.findOneAndUpdate(
      { user: id },
      {
        $set: {
          isOfficeBearer: false,
        },
      }
    );

    if (alumni) {
      return res.status(200).json({
        message: "Alumni removed as Office Bearer successfully",
      });
    }

    return res.status(400).json({
      error:
        "Cannot remove Alumni as Office Bearer at this time, please try again later",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        error: "Wrong User Id",
      });
    }
    res.status(400).json({
      error,
    });
  }
});

export const getAlumniCities = asyncHandler(async (req, res) => {
  const isOnlyOfficeBearer = req.query["office-bearer"] === "true";
  const unwantedFields = [
    "user.password",
    "user.createdAt",
    "user.updatedAt",
    "user.alumni",
    "user.isAdmin",
  ];
  const cities = await Alumni.aggregate([
    {
      $match: isOnlyOfficeBearer
        ? {
            isApproved: true,
            isOfficeBearer: true,
          }
        : {
            isApproved: true,
          },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $unset: unwantedFields,
    },
    {
      $project: {
        "user.city": 1,
        _id: 0,
      },
    },
    {
      $group: {
        _id: "$user.city",
      },
    },
  ]);

  return res.json({ cities: cities.map((city) => city._id) });
});

export const getAlumniByCity = asyncHandler(async (req, res) => {
  const { city } = req.params;

  const alumniIds = await getAlumniIds();

  if (alumniIds) {
    const alumni = await User.find({
      _id: { $in: alumniIds },
      city,
    }).select(["-password", "-__v", "-isAdmin", "-createdAt", "-updatedAt"]);

    res.status(200).json({
      alumni,
    });
  } else {
    res.status(400).json({
      error:
        "Cannot fetch Alumni by their cities at this time, please try again later",
    });
  }
});

export const getAllAlumni = asyncHandler(async (_, res) => {
  const alumniIds = await getAlumniIds();

  if (alumniIds) {
    const alumni = await User.find({ _id: { $in: alumniIds } })
      .select(["-password", "-__v", "-isAdmin", "-createdAt", "-updatedAt"])
      .sort({
        registerNumber: 1,
      });

    res.status(200).json({
      success: true,
      alumni,
    });
  } else {
    res.status(400).json({
      success: false,
      error: "Cannot find Alumni at this time, please try again later",
    });
  }
});

export const getAllAlumniV2 = asyncHandler(async (req, res) => {
  const unwantedFields = [
    "user.password",
    "user.createdAt",
    "user.updatedAt",
    "user.alumni",
    "user.isAdmin",
  ];

  const isOnlyOfficeBearer = req.query["office-bearer"] === "true";

  const alumni = await Alumni.aggregate([
    {
      $match: isOnlyOfficeBearer
        ? {
            isApproved: true,
            isOfficeBearer: true,
          }
        : {
            isApproved: true,
          },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $unset: unwantedFields,
    },
  ]);

  if (!alumni) {
    return res.status(400).json({
      success: false,
      error: "Cannot find Alumni at this time, please try again later",
    });
  }

  return res.status(200).json({
    success: true,
    alumni,
  });
});

export const getAlumniRequests = asyncHandler(async (req, res) => {
  const unwantedFields = [
    "user.password",
    "user.alumni",
    "user.__v",
    "user.createdAt",
    "user.updatedAt",
    "user.isAdmin",
    "__v",
    "alumni_data.__v",
    "alumni_data.user",
  ];

  const requests = await AlumniRequest.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "alumnis",
        localField: "user.alumni",
        foreignField: "_id",
        as: "alumni_data",
      },
    },
    { $unwind: "$alumni_data" },
    { $unwind: "$user" },
    {
      $replaceRoot: { newRoot: { $mergeObjects: ["$alumni_data", "$$ROOT"] } },
    },
    {
      $project: {
        alumni_data: 0,
      },
    },
    { $unset: unwantedFields },
  ]);

  if (requests) {
    return res.status(200).json({
      success: true,
      requests,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Cannot find Alumni Requests at this time, please try again later",
  });
});

export const rejectAlumniRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;
  const { user } = req;

  const request = await AlumniRequest.findOneAndUpdate(
    { _id: requestId },
    {
      $set: {
        rejected: true,
        reasonOfRejection: reason,
      },
    }
  );

  if (request) {
    const existingNotification = await Notification.findOne({
      user: request.user,
      type: notificationConstants.ALUMNI_REJECT,
      resolved: false,
    });

    if (!existingNotification) {
      await Notification.create({
        user: request.user,
        message: `Your request has been rejected. Reason: ${reason}`,
        rejectedBy: user._id,
        type: notificationConstants.ALUMNI_REJECT,
      });
    }

    await RejectedApplication.create({
      user: request.user,
    });

    return res.status(200).json({
      success: true,
      message: "Alumni Request rejected successfully",
    });
  }

  return res.status(400).json({
    success: false,
    error: "Cannot reject Alumni Request at this time, please try again later",
  });
});

export const getRejectedApplications = asyncHandler(async (req, res) => {
  const unwantedFields = [
    "user.password",
    "user.alumni",
    "user.__v",
    "user.createdAt",
    "user.updatedAt",
    "user.isAdmin",
    "__v",
    "alumni_data.__v",
    "alumni_data.user",
  ];
  const rejectedApplications = await RejectedApplication.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "alumnis",
        localField: "user.alumni",
        foreignField: "_id",
        as: "alumni_data",
      },
    },
    { $unwind: "$user" },
    { $unwind: "$alumni_data" },
    {
      $replaceRoot: { newRoot: { $mergeObjects: ["$alumni_data", "$$ROOT"] } },
    },
    {
      $project: {
        alumni_data: 0,
      },
    },
    { $unset: unwantedFields },
  ]);
  if (!rejectedApplications)
    return res.json({
      success: false,
      error:
        "Cannot find Rejected Applications at this time, please try again later",
    });

  return res.status(200).json({
    success: true,
    rejectedApplications,
  });
});

export const getSearchAlumniPartial = asyncHandler(async (req, res) => {
  const { search } = req.params;
  const alumniIds = await getAlumniIds();
  const unwantedFields = [
    "password",
    "createdAt",
    "updatedAt",
    "alumni",
    "isAdmin",
  ];

  if (alumniIds) {
    const alumni = await Alumni.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    name: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    email: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    registerNumber: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    department: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    phoneNumber: {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
            { $match: { isAlumni: true } },
          ],
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      { $unset: unwantedFields },
    ]);
    if (alumni.length > 0) {
      res.status(200).json({
        success: true,
        alumni,
      });
    } else {
      res.status(400).json({
        success: true,
        error: "No Match found",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      error: "Cannot find Alumni at this time, please try again later",
    });
  }
});

export const getSearchAlumniFull = asyncHandler(async (req, res) => {
  const { search } = req.params;
  const alumniIds = await getAlumniIds();
  const unwantedFields = [
    "password",
    "createdAt",
    "updatedAt",
    "alumni",
    "isAdmin",
  ];

  if (alumniIds) {
    const alumni = await User.aggregate([
      {
        $match: {
          $text: {
            $search: search,
          },
        },
      },
      { $match: { isAlumni: true } },
      { $unset: unwantedFields },
    ]);
    if (alumni.length > 0) {
      res.status(200).json({
        success: true,
        alumni,
      });
    } else {
      res.status(400).json({
        success: true,
        error: "No Match found",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      error: "Cannot find Alumni at this time, please try again later",
    });
  }
});
