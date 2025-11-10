import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { TULSI_SALES } from "./data/tulsi_sales_two_salespersons.js";
const prisma = new PrismaClient();

// 👇 Apna JSON data import kar le
// import { TULSI_SALES } from "../vp-tulsi-enterprises4/src/data/tulsi_sales_two_salespersons"; // is file me tera data export const TULSI_SALES = [...]
// import { TULSI_SALES } from "C:\Users\Dell\Downloads\vp-tulsi-enterprises4\vp-tulsi-enterprises4\src\data\tulsi_sales_two_salespersons.js";
// import data from "../src/data/tulsi_sales_two_salespersons.js";
// const TULSI_SALES = data.TULSI_SALES;


async function main() {
  for (const record of TULSI_SALES) {
    // ✅ Salesperson ko create/find kar
    let salesperson = await prisma.salesPerson.findFirst({
      where: { name: record.salesperson },
    });
    if (!salesperson) {
      salesperson = await prisma.salesPerson.create({
        data: { name: record.salesperson },
      });
    }

    // ✅ Company ko create/find kar
    let company = await prisma.company.findFirst({
      where: { name: record.company },
    });
    if (!company) {
      company = await prisma.company.create({
        data: { name: record.company },
      });
    }

    // ✅ Sale record create kar
    await prisma.sale.create({
      data: {
        month: record.month,
        amount: record.amount,
        salespersonId: salesperson.id,
        companyId: company.id,
      },
    });
  }

  console.log("✅ Data inserted successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
