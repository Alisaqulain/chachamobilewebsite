import { redirect } from "next/navigation";

export default function WebsiteRootPage() {
  redirect("/admin/website/dashboard");
}
