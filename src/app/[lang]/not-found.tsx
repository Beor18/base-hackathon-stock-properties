import { ButtonLink } from "@/components/ui/button";
import { Screen, StateMessage } from "@/components/layout/screen";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <Screen>
      <StateMessage title={dict.notFound.title} body={dict.notFound.body}>
        <ButtonLink href={`/${lang}`} variant="secondary">
          {dict.notFound.cta}
        </ButtonLink>
      </StateMessage>
    </Screen>
  );
}
