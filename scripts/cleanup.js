const mongoose = require("mongoose");
const { Partner, NarrSnapshot, Opportunity } = require("../models");
const { normalisePartnerName, isBlockedPartner } = require("../importService");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/partnerpulse";

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const partners = await Partner.find().populate("owner");
  console.log(`Found ${partners.length} partners\n`);

  let merged = 0, deleted = 0;

  for (const partner of partners) {
    // Delete blocked partners entirely
    if (isBlockedPartner(partner.name)) {
      await NarrSnapshot.deleteMany({ partner: partner._id });
      await Opportunity.deleteMany({ partner: partner._id });
      await Partner.deleteOne({ _id: partner._id });
      console.log(`Deleted blocked: ${partner.name}`);
      deleted++;
      continue;
    }

    const canonical = normalisePartnerName(partner.name);
    if (canonical === partner.name) continue;

    // Find or create canonical partner
    let canonicalDoc = await Partner.findOne({ name: canonical });
    if (!canonicalDoc) {
      canonicalDoc = await Partner.create({
        name: canonical,
        type: partner.type,
        owner: partner.owner?._id || partner.owner,
      });
      console.log(`Created canonical: ${canonical}`);
    }

    // Merge each snapshot — sum values if week already exists for canonical
    const dupSnaps = await NarrSnapshot.find({ partner: partner._id });
    for (const snap of dupSnaps) {
      const existing = await NarrSnapshot.findOne({
        partner: canonicalDoc._id,
        weekDate: snap.weekDate,
      });

      if (existing) {
        // Merge NARR values into existing canonical snapshot
        await NarrSnapshot.updateOne({ _id: existing._id }, {
          $inc: {
            narr:         snap.narr         || 0,
            partnerNarr:  snap.partnerNarr  || 0,
            closedNarr:   snap.closedNarr   || 0,
            pipelineNarr: snap.pipelineNarr || 0,
            strategic:    snap.strategic    || 0,
            nonStrategic: snap.nonStrategic || 0,
          }
        });
        await NarrSnapshot.deleteOne({ _id: snap._id });
      } else {
        // No conflict — repoint to canonical
        await NarrSnapshot.updateOne({ _id: snap._id }, { $set: { partner: canonicalDoc._id } });
      }
    }

    // Repoint all opportunities
    await Opportunity.updateMany({ partner: partner._id }, { $set: { partner: canonicalDoc._id } });

    // Remove duplicate partner
    await Partner.deleteOne({ _id: partner._id });
    console.log(`Merged: "${partner.name}" -> "${canonical}"`);
    merged++;
  }

  console.log(`\nDone — merged: ${merged}, deleted: ${deleted}`);
  await mongoose.disconnect();
}

cleanup().catch(err => { console.error(err); process.exit(1); });
