import AdminChrome from "./AdminChrome";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminChrome>{children}</AdminChrome>;
}
