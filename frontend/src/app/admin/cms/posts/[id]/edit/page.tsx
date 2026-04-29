import { AdminCmsFormPage } from "features/admin/AdminCmsForms";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCmsPostEditRoute({ params }: Props) {
  const { id } = await params;
  return <AdminCmsFormPage id={decodeURIComponent(id)} kind="posts" mode="edit" />;
}
