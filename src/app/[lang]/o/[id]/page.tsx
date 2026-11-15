import { notFound, redirect } from "next/navigation";

import { getLocale } from "@/i18n/get-dictionary";

/** `/o/<id>`: the broker's short reservation link. It opens the reservation screen with that offer. */
export default async function OfferLinkPage({ params }: PageProps<"/[lang]/o/[id]">) {
  const [{ id }, lang] = await Promise.all([params, getLocale()]);
  if (!/^[A-Za-z0-9]{10}$/.test(id)) notFound();
  redirect(`/${lang}/reservar?${new URLSearchParams({ oferta: id })}`);
}
