import { redirect } from "next/navigation";

/** Qualities are free text on purchase lines; this screen was removed from the workflow. */
export default function SalesSystemQualitiesRedirectPage() {
  redirect("/admin/sales-system/dashboard");
}
