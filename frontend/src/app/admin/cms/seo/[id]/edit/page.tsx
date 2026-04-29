import { AdminCmsFormPage } from "features/admin/AdminCmsForms";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCmsSeoEditRoute({ params }: Props) {
  const { id } = await params;
  return <AdminCmsFormPage id={decodeURIComponent(id)} kind="seo" mode="edit" />;
}
