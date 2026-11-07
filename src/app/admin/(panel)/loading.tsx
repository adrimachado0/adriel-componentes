import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";

export default function AdminLoading() {
  return (
    <div className="container-page flex flex-1 flex-col gap-5 pt-6 pb-24 sm:pt-8">
      <AdminListSkeleton />
    </div>
  );
}
