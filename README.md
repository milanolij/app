# Reddersnet mobile — Fase 1 t/m 6, 9

Expo/TypeScript app (Expo Router, SDK 57). Fase 1 bevat het project-scaffold, de auth-flow (registratie/login voor beide rollen) en rol-gebaseerde navigatie na inloggen. Fase 2 voegt brevetbeheer voor de redder toe (upload + kleurstatus). Fase 3 voegt beschikbaarheid en actiestraal toe. Fase 4 voegt de oproepenlijst toe (accepteren/weigeren). Fase 5 voegt het bevestigingsscherm toe (adres/contact/vergoeding + annuleren). Fase 6 voegt de zwembad-kant toe (oproep plaatsen + status bekijken). Fase 7 en 8 waren backend-only (zie `../backend/README.md`); Fase 9 voegt hier echte pushmeldingen toe.

## Lokale setup

Vereisten: de backend moet lokaal draaien (zie `../backend/README.md`).

1. Installeer dependencies:
   ```
   npm install
   ```
2. Kopieer `.env.example` naar `.env` (staat al lokaal, gitignored). `EXPO_PUBLIC_API_URL` wijst standaard naar `http://localhost:3000`.
3. Start de webserver (enige manier om dit zonder Android/iOS-toolchain te testen op dit Windows-systeem):
   ```
   npm run web
   ```
4. Voor een echt toestel via Expo Go: zet `EXPO_PUBLIC_API_URL` in `.env` op het LAN-IP van je ontwikkelmachine (bv. `http://192.168.1.x:3000`) — `localhost` op een telefoon verwijst naar de telefoon zelf, niet naar je computer.

## Architectuur

- `src/api/` — typed fetch-wrapper (`client.ts`, gooit `ApiError` voor zowel HTTP- als netwerkfouten), `types.ts` (matcht de backend-DTO's exact), `auth.ts` (dunne endpoint-wrappers).
- `src/auth/` — `storage.ts` (token-opslag: `expo-secure-store` op native, `localStorage`-fallback op web omdat SecureStore daar niet werkt), `AuthContext.tsx` (login/registreren/uitloggen + sessie-hydratie bij opstart).
- `src/components/` — `FormField`, `ErrorBanner`, `PrimaryButton` — gedeelde, simpele UI-bouwstenen (plain `StyleSheet`, geen UI-kit).
- `src/app/` — Expo Router routes: `index` (welkom), `login`, `register-lifeguard`, `register-pool`, `(lifeguard)/home` en `(pool)/home` (rol-gescheiden gebieden, onzichtbaar in de URL). De root `_layout.tsx` bevat de enige bron van waarheid voor rol-gebaseerde redirects.

**Let op:** registratie-endpoints geven geen token terug — `AuthContext.registerLifeguard`/`registerPool` loggen na een succesvolle registratie automatisch in met dezelfde gegevens.

## Verificatie

Volledig geverifieerd via de Expo web-preview (Claude Preview tools): redder registreren → auto-login → rol-redirect → uitloggen → zwembad registreren → auto-login → rol-redirect → onafhankelijk inloggen als beide rollen (bevestigt correcte rol-routing) → foutpaden (verkeerd wachtwoord, dubbel e-mailadres) tonen nette foutmeldingen → sessie overleeft page-reload.

**Niet getest (native-only, geen blocker voor Fase 1):** camera/documentpicker, pushmeldingen, de echte `expo-secure-store` Keychain/Keystore-opslag, native gesture-/safe-area-gedrag. Aanbevolen: zelf even spot-checken via Expo Go op je telefoon.

## Brevetbeheer (Fase 2)

- `(lifeguard)/brevetten.tsx` — redder ziet eigen brevetten met een kleurgecodeerde `StatusBadge` (dezelfde kleuren als het admin-dashboard: groen/geel/rood/grijs) en kan een nieuw brevet uploaden (type, vervaldatum, bestand via `expo-document-picker`).
- `src/api/brevetten.ts` — `uploadBrevet()` (multipart/form-data) en `listMyBrevetten()`. Bestandsupload heeft een web/native-branch: op web geeft de document-picker een echt `File`-object terug, op native een `{uri, name, type}`-object — beide vereisen een andere `FormData.append()`-vorm.
- `src/api/client.ts` — `apiRequest` herkent nu `FormData`-bodies en laat de browser/RN zelf de multipart-boundary zetten (geen handmatige `Content-Type`-header meer in dat geval).
- Lijst en upload gebruiken TanStack Query (`useQuery`/`useMutation`), met automatische her-ophaling na een succesvolle upload.

Live geverifieerd: brevet geüpload via een gesimuleerde bestandsselectie (echte OS-dialoog kan niet via browsermacro's) → verschijnt met grijze "In behandeling"-badge → goedgekeurd via de admin-API → na herladen toont de badge groen "Geldig".

## Beschikbaarheid & actiestraal (Fase 3)

- `(lifeguard)/beschikbaarheid.tsx` — actiestraal-slider (1–100km, via `@react-native-community/slider` — RN heeft sinds enkele versies geen ingebouwde slider meer) en een `Switch` per weekdag, geladen vanuit het huidige profiel en opgeslagen via `PATCH /users/me/lifeguard-profile`.
- `src/api/lifeguardProfile.ts` — `getMyLifeguardProfile()` en `updateMyLifeguardProfile()`.
- Lokale state wordt precies één keer geïnitialiseerd vanuit de opgehaalde profieldata (via een ref-guard), zodat een achtergrond-herophaling (TanStack Query's `refetchOnWindowFocus`) nooit ongemerkt niet-opgeslagen wijzigingen van de gebruiker overschrijft.

Live geverifieerd: dagen aangevinkt (ma/za/zo) → opgeslagen → `PATCH`-response bevestigt exact `{actiestraal_km: 10, beschikbare_dagen: ["ma","za","zo"]}` → na pagina-herlaad tonen de toggles nog steeds de opgeslagen staat (bevestigt zowel opslaan als correct herladen vanuit de backend).

## Oproepenlijst (Fase 4)

- `(lifeguard)/oproepen.tsx` — lijst van openstaande oproepen binnen actiestraal (`GET /callouts/me`, al gesorteerd op afstand door de backend), met per rij zwembadnaam, afstand, geformatteerde periode, een kleurenbadge voor `reden` en het vereiste brevettype. Accepteren/weigeren via `POST /callouts/:id/accept` resp. `/decline`.
- `src/api/callouts.ts` — `listOpenCallOutsForMe()`, `acceptCallOut(id)`, `declineCallOut(id)`.
- Ververst alleen via pull-to-refresh (`RefreshControl`, eerste gebruik in de app) — bewust géén achtergrond-polling, consistent met de rest van de app; er zijn nog geen pushmeldingen.
- Beide mutaties gebruiken `onSettled` (niet enkel `onSuccess`) om de lijst opnieuw op te halen: bij een `409` ("al ingevuld door een andere redder") blijft de eigen uitnodiging op de backend op `uitgenodigd` staan — pas een herophaling laat de inmiddels vervallen rij verdwijnen, omdat de oproep zelf niet meer `open` is.
- Per-rij laadstatus zonder nieuwe abstractie: één gedeelde `useMutation` per actie over de hele lijst, vergelijken van `mutation.variables` met het `id` van de rij bepaalt welke knop een spinner toont.

**Geverifieerd via directe API-calls tegen de lokale backend** (geen browser-previewtool beschikbaar in deze sessie, dus niet visueel bevestigd zoals Fase 1-3): testredder + testzwembad geregistreerd, brevet geüpload en goedgekeurd, actiestraal ruim gezet → oproep geplaatst → `GET /callouts/me` toont exact de verwachte velden, gesorteerd op afstand → accepteren geeft `201` en de oproep verdwijnt uit de lijst → weigeren geeft `200` en verdwijnt eveneens → race-pad: twee redders uitgenodigd voor dezelfde oproep, één accepteert (`201`), de ander krijgt bij een latere poging `409` met exact de boodschap "Deze shift is al ingevuld door een andere redder" en ziet de oproep na herophalen verdwijnen uit zijn lijst. TypeScript-typecheck (`tsc --noEmit`) slaagt zonder fouten. **Aanbevolen**: zelf nog even spot-checken in de browser (`npm run web`) of via Expo Go, vooral de pull-to-refresh-gesture (niet simuleerbaar via curl) en de daadwerkelijke UI-weergave.

## Bevestigingsscherm & annuleren (Fase 5)

- `(lifeguard)/bevestiging/[id].tsx` — eerste dynamische route in de app. Toont, na acceptatie van een oproep, zwembadnaam, statusbadge, reden-badge, periode, adres/contactpersoon/telefoon en vergoeding (`GET /callouts/:id`), met een annuleerknop (`POST /callouts/:id/cancel`) achter een natieve `Alert.alert`-bevestigingsdialoog.
- **Geen backend-endpoint lijst "mijn geaccepteerde shift" op** — enkel `GET /callouts/:id` op basis van een bekend id. Opgelost door het laatst geaccepteerde oproep-id (+ `eind_tijd`) lokaal op te slaan (`src/callouts/storage.ts`, zelfde `expo-secure-store`/`localStorage`-patroon als het JWT-token), zodat `(lifeguard)/home.tsx` een "Bevestigde shift"-knop kan tonen die ook na een herstart van de app werkt. Een verlopen entry (`eind_tijd` al voorbij) wordt bij het opnieuw laden van het thuisscherm automatisch opgeruimd, zonder extra netwerkcall.
- `src/callouts/display.ts` — `REDEN_LABELS`/`REDEN_COLORS`/`formatOproepPeriode`, geëxtraheerd uit `oproepen.tsx` zodra het bevestigingsscherm exact dezelfde weergavelogica nodig had (voorheen dubbel per scherm, nu één bron).
- Een `403` (nog niet geaccepteerd of geweigerd) of `404` (nooit uitgenodigd) op `GET /callouts/:id` toont een vriendelijke eigen staat in plaats van de generieke foutbanner, en ruimt de lokale opslag op als het getoonde id daarmee overeenkomt.
- Annuleren zet de oproep terug op `open` en herverdeelt automatisch (bestaand backend-gedrag, Fase 7) — de annulerende redder zelf ziet de oproep terecht niet terugkeren in zijn eigen lijst (zijn respons staat nu op `geweigerd`), maar andere nog-uitgenodigde redders wel.

Live geverifieerd via directe API-calls tegen de lokale backend (zelfde beperking als Fase 4: geen browser-previewtool beschikbaar in deze sessie): oproep aangemaakt → geaccepteerd (`201`) → `GET /callouts/:id` toont exact de verwachte velden inclusief `vergoeding: "72.5"` (string-serialisatie, zoals verwacht) → `403` voor een niet-accepterende redder → `404` voor een willekeurig id → geannuleerd (`201`, status terug `open`) → de annulerende redder ziet de oproep niet terug in `GET /callouts/me`, een andere nog-uitgenodigde redder wel (bevestigt de precieze herverdeel-semantiek) → herhaalde annulatie geeft `409` → bevestiging opnieuw bezoeken na annuleren geeft nu `403`. Webbundel compileert de nieuwe route zonder fouten (incl. server-side render van de dynamische `[id]`-route), `tsc --noEmit` slaagt zonder fouten. **Aanbevolen**: zelf nog spot-checken in de browser, vooral de `Alert.alert`-dialoog en het "Bevestigde shift"-herstel na een echte app-herstart (native, niet simuleerbaar via curl).

## Zwembad-schermen: oproep plaatsen & status bekijken (Fase 6)

- `(pool)/oproep-plaatsen.tsx` — formulier (reden, aantal redders, vereist brevet — inclusief "Automatisch" op basis van de geregistreerde diepte/oppervlakte van het zwembad, start-/eindtijd, vergoeding) → `POST /callouts`. Reden en brevet-type zijn knoppen-rijen (zelfde `variant`-toggle-patroon als het brevet-type in `brevetten.tsx`), geen dropdown-component nodig.
- `(pool)/oproepen.tsx` — "Mijn oproepen": lijst van lokaal bijgehouden geplaatste oproepen (reden-badge, periode, vergoeding), elk doorklikbaar naar de statusdetail. Geen live per-rij statuscheck (zou N parallelle calls betekenen); dat leeft in het detailscherm.
- `(pool)/oproep-status/[id].tsx` — combineert de lokaal opgeslagen "wat werd gevraagd"-data (aantal redders, vereist brevet — zit niet in de live response) met de live status via `GET /callouts/:id` (status, reden, periode, vergoeding, en zodra `bevestigd`: naam+telefoon van de redder). Geen polling — een "Verversen"-knop is het enige mechanisme om te zien of intussen iemand heeft geaccepteerd.
- **Twee backend-leemtes bewust opgevangen zonder de backend aan te passen**: (1) `GET /callouts/:id` (zwembad-kant) bevat geen `aantal_redders_nodig`/`vereist_brevet_type` — opgelost door de volledige `POST /callouts`-response lokaal te bewaren en te combineren met de live data; (2) er is geen endpoint om de eigen diepte/oppervlakte op te vragen (voor uitleg bij "Automatisch") — opgelost door in de UI geen concrete cijfers te tonen, enkel een statische uitlegzin.
- `src/callouts/poolStorage.ts` (nieuw, los van `src/callouts/storage.ts` dat de redder-kant bedient) — een **groeiende lijst** van geplaatste oproepen (niet slechts de laatste, zoals bij de redder-kant in Fase 5), want een zwembad kan realistisch meerdere oproepen tegelijk open hebben staan.
- `src/callouts/display.ts` — `CALLOUT_STATUS_LABELS`/`CALLOUT_STATUS_COLORS` verhuisd hierheen vanuit `(lifeguard)/bevestiging/[id].tsx`, zelfde "extraheren bij tweede gebruik"-precedent als in Fase 5.
- **Nieuwe dependency**: `@react-native-community/datetimepicker`. Op web rendert dit component niets (bevestigd in de broncode: `return null` met een console-waarschuwing) — daarom heeft `DateTimeField` in `oproep-plaatsen.tsx` een expliciete `Platform.OS === 'web'`-tak met gewone `FormField`-tekstvelden (datum `JJJJ-MM-DD` + tijd `UU:MM`) als fallback, en de echte native datum-dan-tijd-picker (`mode="date"` gevolgd door `mode="time"`, gecombineerd tot één `Date`) op iOS/Android.

Live geverifieerd via directe API-calls tegen de lokale backend (zelfde beperking als Fase 4/5): oproep aangemaakt met `vereist_brevet_type` weggelaten → backend suggereert automatisch `hoger_redder` op basis van de zwembaddiepte (1,8m > 1,4m-drempel), exact zoals `brevet-vereiste.util.ts` voorschrijft → een tweede oproep met expliciet `basisredder` → geaccepteerd door de testredder (`201`) → pool-view toont daarna `status: "bevestigd"` en `redder: {naam, telefoon}` → een ander zwembad-account krijgt `404` bij het opvragen van dezelfde oproep (ownership-afdwinging bevestigd). Webbundel compileert alle nieuwe routes (incl. de nieuwe dynamische `oproep-status/[id]`-route) zonder fouten, `tsc --noEmit` slaagt zonder fouten. **Aanbevolen**: zelf spot-checken in de browser voor de formulier-UI zelf en op een echt toestel/Expo Go voor de native datum/tijd-picker (niet simuleerbaar via curl of `npm run web`).

## Echte pushmeldingen (Fase 9)

- `src/notifications/registerForPushNotifications.ts` — vraagt pushrechten aan (stil falen als geweigerd, geen foutmelding), zet op Android eerst een notificatiekanaal, en haalt via `expo-notifications` een Expo-pushtoken op (`getExpoPushTokenAsync({ projectId })`). Slaat altijd `null` op bij simulators/emulators (`expo-device`'s `Device.isDevice`) of ontbrekende permissies/`projectId`.
- `src/notifications/pushTokenStorage.ts` — zelfde `expo-secure-store`/`localStorage`-patroon als `src/auth/storage.ts`, onthoudt het laatst geregistreerde token zodat herregistratie bij elke app-start een no-op is tenzij het token echt veranderde. Er bestaat geen aparte "token vernieuwd"-listener in `expo-notifications` (anders dan bij raw FCM-SDK's) — hertoetsen bij elke sign-in is hier de correcte aanpak.
- `src/notifications/notificationHandler.ts` — configureert hoe een melding verschijnt terwijl de app open staat (banner + lijst, geluid, geen badge).
- `src/api/pushTokens.ts` — `registerPushToken()`/`unregisterPushToken()`, dunne wrappers rond `POST`/`DELETE /users/me/push-token`.
- Aangesloten in `src/app/_layout.tsx` (`RootNavigator`): registratie loopt eenmalig per sign-in (ref-guard, reset bij signedOut), en een `addNotificationResponseReceivedListener` navigeert bij het tikken op een melding naar de oproepenlijst van de eigen rol. Bewust **geen** per-oproep deep-linking — dat zou de `notify(userId, title, body)`-signature in de backend moeten uitbreiden, wat expliciet buiten scope van deze fase valt (zie backend-README).
- `src/auth/AuthContext.tsx`: `logout()` doet een best-effort `unregisterPushToken()` + ruimt de lokale tokenopslag op vóór het JWT gewist wordt — een netwerkfout hierbij blokkeert uitloggen nooit.

**Belangrijke wijziging in workflow**: Expo Go ondersteunt sinds SDK 53 geen remote pushmeldingen meer op Android — `npm run web`/Expo Go volstaan dus niet langer om pushmeldingen te testen. Er is een **EAS development build** nodig:
```
eas login
eas build --profile development --platform android   # of --platform ios
```
Installeer de resulterende build op een fysiek toestel (of een emulator met Google Play Services voor Android — de iOS-simulator ontvangt geen echte APNs-push), en start daarna met:
```
npx expo start --dev-client
```
Zie `../backend/README.md` (Fase 9) voor de eenmalige Firebase/APNs/EAS-credential-setup.

## Roadmap na Fase 6

Echte pushmeldingen (FCM) waren bewust uitgesteld tot een aparte ontwerp-fase — dat is nu Fase 9 hierboven. Daarmee zijn alle geplande redder- en zwembad-schermen uit de roadmap gebouwd, inclusief pushmeldingen; er zijn geen verdere fases gepland.
