import { redirect } from "next/navigation";

/** Purchase entry for the sales system is per supplier only (open a supplier, then add purchase). */
export default function SalesSystemPurchasesRedirectPage() {
  redirect("/admin/sales-system/suppliers");
}
