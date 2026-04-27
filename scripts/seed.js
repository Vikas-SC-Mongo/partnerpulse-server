require("dotenv").config();
const mongoose = require("mongoose");
const { TeamMember, Partner, NarrSnapshot, Opportunity } = require("../models");

const SAMPLE = [
  { member:"Iman Roy", partners:[
    { name:"Infosys",  type:"Primary",   narr:4200000, prevNarr:3600000, strategic: 0, nonStrategic: 0,
    { name:"EY",       type:"Secondary", narr:1800000, prevNarr:1500000, strategic: 0, nonStrategic: 0,
    { name:"Wipro",    type:"Secondary", narr:1100000, prevNarr:980000,  strategic: 0, nonStrategic: 0,
  ], opps:[
    { oppId:"O-101", partner:"Infosys", title:"Cloud Migration Suite", value:520000, stage:"Proposal",    motionType:"Sell-through", close:"2025-04-15", daysAgo:3  },
    { oppId:"O-102", partner:"EY",      title:"Analytics Platform",    value:310000, stage:"Negotiation", motionType:"Co-sell",      close:"2025-03-28", daysAgo:7  },
    { oppId:"O-103", partner:"Wipro",   title:"Security Assessment",   value:180000, stage:"Discovery",   motionType:"Co-sell",      close:"2025-05-10", daysAgo:12 },
  ]},
  { member:"Deepak Mirchandani", partners:[
    { name:"Accenture",     type:"Primary",   narr:5100000, prevNarr:4300000, strategic: 0, nonStrategic: 0,
    { name:"Tech Mahindra", type:"Secondary", narr:1400000, prevNarr:1250000, strategic: 0, nonStrategic: 0,
  ], opps:[
    { oppId:"O-201", partner:"Accenture",     title:"ERP Transformation",  value:740000, stage:"Proposal",  motionType:"Co-sell",      close:"2025-04-01", daysAgo:2 },
    { oppId:"O-202", partner:"Tech Mahindra", title:"IT Managed Services", value:290000, stage:"Discovery", motionType:"Sell-through", close:"2025-05-20", daysAgo:9 },
  ]},
  { member:"Meena M", partners:[
    { name:"TCS",      type:"Primary",   narr:3800000, prevNarr:3100000, strategic: 0, nonStrategic: 0,
    { name:"Hexaware", type:"Secondary", narr:950000,  prevNarr:820000,  strategic: 0, nonStrategic: 0,
  ], opps:[
    { oppId:"O-301", partner:"TCS",      title:"Digital Workplace", value:480000, stage:"Negotiation", motionType:"Sell-through", close:"2025-03-31", daysAgo:5  },
    { oppId:"O-302", partner:"Hexaware", title:"DevOps Enablement", value:165000, stage:"Proposal",    motionType:"Co-sell",      close:"2025-04-22", daysAgo:11 },
  ]},
  { member:"Shivani Tripathy", partners:[
    { name:"Capgemini", type:"Primary",   narr:4600000, prevNarr:3900000, strategic: 0, nonStrategic: 0,
    { name:"Cognizant", type:"Primary",   narr:3200000, prevNarr:2700000, strategic: 0, nonStrategic: 0,
    { name:"LTIM",      type:"Secondary", narr:1200000, prevNarr:1050000, strategic: 0, nonStrategic: 0,
  ], opps:[
    { oppId:"O-401", partner:"Capgemini", title:"AI/ML Integration",    value:630000, stage:"Proposal",    motionType:"Co-sell",      close:"2025-04-10", daysAgo:1  },
    { oppId:"O-402", partner:"Cognizant", title:"Data Lakehouse Build",  value:410000, stage:"Discovery",   motionType:"Sell-through", close:"2025-05-05", daysAgo:8  },
    { oppId:"O-403", partner:"LTIM",      title:"ServiceNow Deployment", value:220000, stage:"Negotiation", motionType:"Co-sell",      close:"2025-04-18", daysAgo:13 },
  ]},
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing
  await Promise.all([
    TeamMember.deleteMany({}),
    Partner.deleteMany({}),
    NarrSnapshot.deleteMany({}),
    Opportunity.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const weekDate = new Date("2025-03-10");

  for (const row of SAMPLE) {
    const initials = row.member.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const member = await TeamMember.create({ name: row.member, avatar: initials });

    for (const p of row.partners) {
      const partner = await Partner.create({ name: p.name, type: p.type, owner: member._id });
      await NarrSnapshot.create({
        partner: partner._id, weekDate,
        narr: p.narr, prevNarr: p.prevNarr,
        strategic: Math.round(p.narr * 0.6), nonStrategic: Math.round(p.narr * 0.4),
        source: "seed",
      });

      // Create opps for this partner
      const partnerOpps = row.opps.filter(o => o.partner === p.name);
      for (const o of partnerOpps) {
        const createdDate = new Date(weekDate.getTime() - o.daysAgo * 86400000);
        await Opportunity.create({
          oppId: o.oppId, partner: partner._id,
          title: o.title, value: o.value,
          stage: o.stage, motionType: o.motionType,
          closeDate: new Date(o.close),
          createdDate, weekDate, source: "seed",
        });
      }
    }
    console.log(`  ✅ ${row.member} — ${row.partners.length} partners, ${row.opps.length} opps`);
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
