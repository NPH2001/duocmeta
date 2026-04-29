import { AdminCmsFormPage } from "features/admin/AdminCmsForms";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCmsRedirectEditRoute({ params }: Props) {
  const { id } = await params;
  return <AdminCmsFormPage id={decodeURIComponent(id)} kind="redirects" mode="edit" />;
}
