import Link from "next/link";

export const metadata = {
  title: "Általános Szerződési Feltételek – HPVHelp Webshop",
};

export default function AszfPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="border-b border-brand-100/80 bg-white/90 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-md shadow-brand-200" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Webshop
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Jogi dokumentum</p>
          <h1 className="font-serif mt-1 text-3xl font-bold italic text-brand-900">Általános Szerződési Feltételek</h1>
          <p className="mt-2 text-sm text-red-950/50">Utoljára frissítve: 2026.01.18. 17:27</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-slate-700 leading-relaxed">

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-3">Jogok és kötelezettségek</h2>
            <p>A jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) a Sunmed Kft. (továbbiakban: Szolgáltató), és a Szolgáltató által a <strong>www.hpvhelp.hu</strong> weboldalon keresztül nyújtott elektronikus kereskedelmi szolgáltatásokat igénybe vevő Ügyfél (a továbbiakban: Ügyfél) jogait és kötelezettségeit tartalmazza. (Szolgáltató és Ügyfél a továbbiakban együttesen: Felek). Az ÁSZF minden jogügyletre és szolgáltatásra vonatkozik, amely a www.hpvhelp.hu weboldalon keresztül történik, függetlenül attól, hogy annak teljesítése Magyarországról vagy külföldről, a Szolgáltató vagy közreműködője által történik.</p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Szolgáltató adatai</h2>
            <p className="mb-3"><strong>Név:</strong> Sunmed Kft. &nbsp;<strong>Székhely:</strong> 7300 Komló, Ifjúság útja 35. &nbsp;<strong>Levelezési cím és Ügyfélszolgálat:</strong> 7623 Pécs, Megyeri út 26. fszt.108. &nbsp;<strong>Telefon:</strong> +36 72 794 379, +36 30 865 7792 &nbsp;<strong>Fax:</strong> +36 72 999 372 &nbsp;<strong>E-mail:</strong> info@sunmed.hu &nbsp;<strong>Cégjegyzékszám:</strong> 02-09-081275 &nbsp;<strong>Adószám:</strong> 11551373-2-02</p>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4 text-sm">
                <p className="font-bold text-brand-900 mb-2">FORINT alapú fizetés</p>
                <p>Számlaszám: <strong>10918001-00000124-71950001</strong></p>
                <p>UniCredit Bank Hungary Zrt.</p>
                <p>1054 Budapest, Szabadság tér 5-6.</p>
                <p>BIC/SWIFT: BACXHUHB</p>
                <p>IBAN: HU10109180010000012471950001</p>
              </div>
              <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4 text-sm">
                <p className="font-bold text-brand-900 mb-2">EURO alapú fizetés</p>
                <p>Számlaszám: <strong>11600006-00000000-84794190</strong></p>
                <p>Erste Bank</p>
                <p>BIC: GIBAHUHB</p>
                <p>IBAN: HU72116000060000000084794190</p>
              </div>
            </div>
            <p className="mt-3 text-sm"><strong>Adatkezelési nyilvántartási szám:</strong> NAIH-83651/2015.</p>
          </div>

          {[
            {
              id: "1",
              title: "1. Általános tudnivalók, a felek közötti szerződés létrejötte",
              content: (
                <div className="space-y-3">
                  <p>1.1. A jelen ÁSZF hatálya kiterjed a Magyarország területén nyújtott minden olyan elektronikus kereskedelmi szolgáltatásra, amely a www.hpvhelp.hu weboldalon (a továbbiakban: Weboldal) található elektronikus áruházon keresztül történik. Továbbá jelen ÁSZF hatálya kiterjed minden olyan kereskedelmi ügyletre Magyarország területén, amely jelen szerződésben meghatározott Felek között jön létre. A Sunmed Kft. online áruházaiban történő vásárlást az elektronikus kereskedelmi szolgáltatások, az információs társadalommal összefüggő szolgáltatások egyes kérdéseiről szóló 2001. évi CVIII. törvény (&quot;Elkertv.&quot;) szabályozza.</p>
                  <p>1.2. A Sunmed Kft. online áruházában www.hpvhelp.hu történő vásárlás elektronikus úton leadott megrendeléssel lehetséges, a jelen ÁSZF-ben meghatározott módon.</p>
                  <p>1.3. A megrendelés jóváhagyása után elektronikusan a megrendelés már nem törölhető. A megrendelés visszavonását a Megrendelő a Webáruház ügyfélszolgálati telefonszámán (06/30/8657792) elektronikus levelezési címén (info@sunmed.hu) teheti meg. <strong>A megrendelés visszavonása csak a postázás előtt lehetséges!</strong></p>
                  <p>1.4. A Megrendelő vállalja:</p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>a megrendelt tesztek mennyiségi és minőségi átvételét,</li>
                    <li>a megrendelt tesztek kifizetését az általa választott fizetési módnak megfelelően,</li>
                    <li>amennyiben a küldemény átvétele a Megrendelő hibájából meghiúsul, az ebből eredő többletköltséget a Szállítónak megtéríti. Az át nem vett, visszaküldött csomagok esetén a ki- és visszaszállítás díját (2.500.- Ft) a megrendelőre terheljük és kiszámlázzuk. A megrendelés újraküldését kizárólag az összeg ellenértékének előre történő átutalása esetén áll módunkban ismételten elindítani.</li>
                  </ul>
                  <p>1.5. A szerződés nyelve magyar.</p>
                  <p>1.6. Ügyfélszolgálat: Sunmed Kft., pécsi telephely. Nyitva: munkanapokon 8-16 h között. Telefon: +36 72 794 379, +36 30 865 7792. Fax: +36 72 999 372. E-mail: info@sunmed.hu</p>
                </div>
              ),
            },
            {
              id: "2",
              title: "2. Regisztráció",
              content: (
                <div className="space-y-3">
                  <p>2.1. Az Ügyfél a Weboldalon történő vásárlásával kijelenti, hogy jelen ÁSZF, és a Weboldalon közzétett Adatvédelmi nyilatkozat feltételeit megismerte és elfogadja, az Adatvédelmi nyilatkozatban foglalt adatkezelésekhez hozzájárul.</p>
                  <p><strong>2.3. Regisztráció törlése</strong></p>
                  <p>2.3.1. Ügyfél jogosult a regisztrációját bármikor törölni az ügyfélszolgálatnak küldött e-mail üzenettel. Az üzenet megérkezését követően a Szolgáltató köteles haladéktalanul gondoskodni a regisztráció törléséről. Az Ügyfél felhasználói adatai a törlést követően azonnal eltávolításra kerülnek a rendszerből; ez azonban nem érinti a már leadott rendelésekhez kapcsolódó adatok és dokumentumok megőrzését, nem eredményezi ezen adatok törlését. Az eltávolítás után az adatok visszaállítására többé nincs mód.</p>
                  <p>2.3.2. Ügyfél vállalja, hogy a regisztráció során megadott személyes adatokat szükség szerint frissíti annak érdekében, hogy azok időszerűek, teljesek és a valóságnak megfelelőek legyenek.</p>
                </div>
              ),
            },
            {
              id: "3",
              title: "3. Megrendelés",
              content: (
                <div className="space-y-3">
                  <p>3.1. A megrendelés leadása előtt megtekintheti a kosár tartalmát és azt ellenőrizheti. Itt módosíthatja azt, hogy a kosárba tett termékből milyen mennyiséget kíván rendelni, illetve törölheti az adott tételt. Lehetőség van a kosár teljes kiürítésére is. Megrendelést csak a szállítási és számlázási információk hiánytalan kitöltésével fogadunk el!</p>
                  <p>3.2. A megvásárolni kívánt terméket helyezze a kosárba. Ha nem szeretne további terméket vásárolni, ellenőrizze a megvásárolni kívánt termék darabszámát. A „törlés" gombra kattintva törölheti a kosár tartalmát.</p>
                  <p>3.3. Amennyiben egészségpénztári számlára szeretne vásárolni, akkor webáruház pénztárában kérjük kiválasztani a legördülő listából az egészségpénztár nevét és megadni a tag nevét, valamint tagi azonosító számát. A megrendelőnek a küldeményünkbe található számlát az adott egészségpénztár felé kell továbbítania az elszámoláshoz.</p>
                  <p>3.4. Amennyiben szükséges, a megrendeléséhez más egyéb fontos megjegyzést is fűzhet.</p>
                  <p>3.5. Minden beérkezett megrendelésről azonnal e-mail-es formában visszaigazolást küldünk, amellyel jelezzük megrendelőink felé, hogy fogadtuk a megrendelést. Kérjük, ügyeljen a megadott adatok pontosságára, hiszen azok alapján történik a kapcsolatfelvétel, a számlázás, illetve kiszállítás.</p>
                  <p>3.6. Ritkán előfordulhat, hogy az e-mailben történő visszaigazolás nem érkezik meg. Ennek a leggyakoribb okai:</p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>rosszul megadott e-mail cím</li>
                    <li>betelt az Ön postafiókjához tartozó tárhely</li>
                    <li>a levelező rendszer a visszaigazolást tévedésből a spamek közé teszi.</li>
                  </ul>
                  <p>3.7. Amennyiben 1 órán belül nem kapja meg a visszaigazolást a megrendeléséről és ellenőrizte a fenti hibákat, kérjük, a problémát jelezze telefonon vagy e-mail-en.</p>
                  <p>3.8. A felhasználók e-mail címük megadásával hozzájárulnak ahhoz, hogy a szolgáltató technikai jellegű üzenetet küldjön számukra (pl. megrendelés visszaigazolása).</p>
                  <p>3.9. Fenntartjuk a jogot a már visszaigazolt megrendelések visszautasítására részben, vagy teljes egészben. Részben történő teljesítésre kizárólag a megrendelővel történő egyeztetést követően kerülhet sor. A termék vételárának előre történő kiegyenlítése esetén a teljes összeg visszautalásra kerül az összeget küldő részére.</p>
                  <p><strong>3.10. A szerződés tárgyának lényeges tulajdonságai</strong></p>
                  <p>3.10.1. Az adott tesztek megrendelésének időpontja az az időpont, amikor megrendelését az áruházon keresztül eljuttatja a szolgáltatóhoz (Sunmed Kft.). A megrendelés akkor lép életbe, ha online megrendelését e-mail-ben visszaigazoljuk.</p>
                  <p>3.10.2. A „Kapcsolatfelvétel" vagy „Kapcsolat" menüpontban megtalálja elérhetőségi adatainkat. Ezen elérhetőségeken (vagy e-mail-en: info@sunmed.hu) jelezheti kifogását vagy kérhet információt valamely termékről vagy megrendelésről.</p>
                  <p>3.10.3. A szolgáltató és a vásárló között létrejött elektronikus szerződés nem tekinthető írásba foglalt szerződésnek, így az nem kerül iktatásra, és későbbiekben papír alapon nem hozzáférhető. Magatartási kódexre nem utal.</p>
                  <p>3.10.3. Felhívjuk figyelmét, hogy az esetleges elírásokért, téves adatokért semmilyen felelősséget nem vállalunk! A termékoldalakon található termék leírások csak tájékoztató jellegűek, nem minden esetben tartalmaznak az adott termékről minden információt. A tesztek felhasználása előtt kérjük, olvassák el használati útmutatót!</p>
                  <p>3.10.4. A Sunmed Kft. elkötelezett a webáruházai szolgáltatásának minőségének a legmagasabb szinten tartása irányában, azonban a www.hpvhelp.hu webáruházakhoz történő csatlakozásból és a weboldalak használatából eredő esetleges károkért semmilyen felelősséget nem vállal.</p>
                  <p>3.10.5. A webáruházak üzemeltetője fenntartja magának a jogot az ÁSZF bármikori megváltoztatására. Az üzemeltető magára nézve kötelezőnek ismeri el jelen jogi közlemény tartalmát. Amennyiben olyan kérdése lenne, amely jelen feltételek nem egyértelműek, kérjük, írja meg nekünk és kollégánk megválaszolja kérdését.</p>
                  <p>3.10.6. Amennyiben a Szolgáltató minden gondossága ellenére hibás ár kerül a Weboldal felületére, különös tekintettel a nyilvánvalóan téves, pl. a termék közismert, általánosan elfogadott vagy becsült árától jelentősen eltérő, esetleg rendszerhiba miatt megjelenő &quot;0&quot; Ft-os vagy &quot;1&quot; Ft-os árra, akkor a Szolgáltató nem köteles a terméket hibás áron szállítani, hanem felajánlhatja a helyes áron történő szállítást, amelynek ismeretében az Ügyfél elállhat vásárlási szándékától.</p>
                  <p>3.10.7. A rendelés átvételének megtagadása nem jelenti a megrendelés lemondását. A lemondott, azonban a futárszolgálatnak már átadott, illetve át nem vett küldemények esetén a szállítás költségével kapcsolatban cégünk kártérítésre jogosult, az okozott kárt (csomagonként bruttó 2.500 Ft-ot) a vásárlóra terheljük.</p>
                </div>
              ),
            },
            {
              id: "4",
              title: "4. Adatbeviteli hibák javítása",
              content: (
                <p>Az Ügyfélnek a rendelés bármely szakaszában és a megrendelés Szolgáltató részére való elküldéséig a Webáruházban bármikor lehetősége van az adatbeviteli hibák javítására a megrendelési felületen (pl. termék törlése a kosárból a „Törlés" feliratra kattintva).</p>
              ),
            },
            {
              id: "5",
              title: "5. Szállítási és fizetési feltételek",
              content: (
                <div className="space-y-3">
                  <p>Webáruházaink megrendeléseit a <strong>GLS</strong> vagy <strong>Magyar Posta (MPL)</strong> szállítja házhoz. A kézbesítés munkanapokon történik, 8-17 óra között. (általában a reggeli, délelőtti órákban) Amennyiben ebben időszakban nem tartózkodik otthon és utánvétes fizetési módot választott, tehát a szállítónak kell kifizetnie a csomag árát, akkor érdemes szállítási címként a munkahelyi címet megadni vagy postapontra, postaautomatába kérni a kiszállítást.</p>
                  <p>A Megrendelő elfogadja, hogy a megrendelés leadását követően, amennyiben házhozszállítást kért adatai továbbításra a lentebb felsorolt valamely logisztika szolgáltató rendszerébe.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4 text-sm">
                      <p className="font-bold text-brand-900 mb-2">GLS</p>
                      <p>GLS General L. S. H. Csomag-Logisztikai Kft.</p>
                      <p>Székhelye: 2351 Alsónémedi, GLS Európa u 2.</p>
                      <p>Tel: +36 29 886 660; +36 29 886 700</p>
                      <p>Web: www.gls-group.eu</p>
                    </div>
                    <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4 text-sm">
                      <p className="font-bold text-brand-900 mb-2">MPL</p>
                      <p>Magyar Posta Zrt.</p>
                      <p>Székhely: 1138 Budapest, Dunavirág utca 2-6.</p>
                      <p>Cégjegyzék: Cg. 01-10-042463</p>
                      <p>Tel: +36-1-767-8200</p>
                      <p>Web: www.posta.hu</p>
                    </div>
                  </div>
                  <p>A megrendelések leadása interneten, faxon időkorlát nélkül, telefonon munkaidőben történhet. A leadott megrendelések feldolgozása folyamatosan történik.</p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>A 14 óráig leadott rendeléseket általában 1 munkanapon belül elindítjuk, mely a következő munkanapon kiszállításra kerül (szabadság időszakában ez az idő hosszabb lehet)</li>
                    <li>A szállító a csomag kétszeri kézbesítését kísérli meg. Az első sikertelen kézbesítés után a vevővel telefonon próbál egyeztetni a második kézbesítési kísérletről. Amennyiben a szállító mégsem tudja személyesen átadni a küldeményt, egy hivatalos értesítést küld elektronikusan vagy helyez el postaládájában.</li>
                    <li>Az utánvétes fizetést kérjük, hogy csak abban az esetben válassza, ha a csomagot kiszállításkor át tudja venni. A kiszállításig le nem mondott és át nem vett, visszaküldött csomagok esetén a ki- és visszaszállítás díját (2.500.- Ft) a megrendelőnek kiszámlázzuk.</li>
                  </ul>
                  <p><strong>Szállítási és csomagolási díjak:</strong></p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>Utánvétes fizetés esetén bruttó <strong>690 Ft</strong> / csomag kezelés költséget számítunk fel a szállítási költségen felül.</li>
                    <li>Utánvétes fizetés esetén a maximális rendelési összeg nem haladhatja meg a bruttó 300 000 Ft-ot.</li>
                    <li>A szállítási költség bruttó 12.000 Ft / csomag EU országon belüli (nem magyarországi) szállítási címre.</li>
                    <li>Hűtést igénylő szállítás esetén minden csomag esetén a szállítás költsége bruttó 3500 Ft, melyet a Vevő felé jelez az Eladó.</li>
                    <li>EU területen kívüli szállítási címre történő megrendelés esetén a Sunmed Kft. visszajelzi a megrendelőnek az aktuális szállítási díjat.</li>
                    <li>A házhozszállítás és csomagolás díja minden esetben külön kerül feltüntetésre a honlapon és a számlán.</li>
                    <li>A csomag feladását követően a Magyar Posta vagy a GLS információs emailt küld a regisztrált email címére.</li>
                    <li>Szélsőséges meleg (kánikulai) vagy hideg (fagyos) időjárási körülmények között az egészségügyi gyorstesztek szállítása kültéri csomagautomatákba minőségbiztosítási okok miatt nem lehetséges.</li>
                  </ul>
                  <p><strong>Fizetési módok</strong></p>
                  <p><strong>Online bankkártyás fizetés (OTP Mobil – SimplePay):</strong> A Megrendelő a birtokában lévő bankkártya segítségével azonnal teljesítheti a fizetési kötelezettségét. A MEGRENDELÉS gombra kattintva az oldal 3-5 másodperc után átirányítja a Megrendelőt az OTP Mobil (SimplePay) fizető felületre, ahol megadhatja adatait és teljesítheti a fizetést.</p>
                  <p>Elfogadom és hozzájárulok, hogy a(z) Sunmed Kft. (7300 Komló, Ifjúság útja 35.) által a(z) hpvhelp.hu felhasználói adatbázisában tárolt alábbi személyes adataim átadásra kerüljenek az OTP Mobil Kft. (1143 Budapest, Hungária körút 17-19.), mint adatfeldolgozó részére.</p>
                  <p>Az adatkezelő által továbbított adatok köre: A Vásárló neve, e-mail címe, telefonszáma, a megrendelés végösszege.</p>
                  <p>Az adatfeldolgozó által végzett adatfeldolgozási tevékenység részletei: <a href="https://simplepay.hu/vasarlo-aff" target="_blank" rel="noopener noreferrer" className="text-brand-800 underline underline-offset-2">simplepay.hu/vasarlo-aff</a></p>
                  <p><strong>Átutalás:</strong></p>
                  <ul className="ml-5 list-disc space-y-1">
                    <li>Számlaszámunk: 10918001-00000124-71950001 (Ft alapú utalás esetére)</li>
                    <li>Számlaszámunk: 11600006-00000000-84794190 (EURO alapú utalás esetére)</li>
                    <li>EURO utaláshoz: BIC: GIBAHUHB · IBAN: HU72116000060000000084794190</li>
                    <li>Számlavezető bank: UniCredit Bank Hungary Zrt., 1054 Budapest, Szabadság tér 5-6.</li>
                    <li>A számla tulajdonosa: Sunmed Kft.</li>
                    <li><strong>Kérjük, a megrendelés azonosító számát tüntesse fel a közleményben!</strong></li>
                  </ul>
                  <p><strong>Utánvételes fizetés:</strong> Utánvéttel történő készpénzes fizetés esetében a Vevő a kézbesítő futárnak készpénzben fizeti meg a termék vételárát és a szállítási költséget maximum bruttó 300 000.-Ft értékhatárig. A futárnál is fizethet bankkártyával, de ez az eset is utánvételes fizetési módnak számít. Utánvétes fizetés esetén bruttó <strong>690 Ft</strong> / csomag kezelés költséget számítunk fel.</p>
                  <p>Jelen szerződés értelmezésekor szerződésszegésnek minősül az az eset, amikor a Vásárló nem veszi át az általa megrendelt Terméket, valamint elállási szándékát sem jelzi a Vállalkozás felé.</p>
                  <p>Amennyiben a Vásárló nem veszi át a megrendelt Terméket, úgy a Vállalkozás választása szerint azonnali hatállyal felmondja a szerződést, vagy akár harmadszor vagy negyedszer is megkísérli a Termék kiszállítását. A Vállalkozás fenntartja a jogot, hogy a sikertelen ki-, és visszaszállítási költséget kötbérként érvényesítse a Vásárlóval szemben.</p>
                </div>
              ),
            },
            {
              id: "6",
              title: "6. Elállási jog",
              content: (
                <div className="space-y-3">
                  <p>A megrendelt termék kézhez vételétől számított <strong>tizennégy (14) naptári napon belül</strong> a Vevőnek joga van elállni vásárlási szándékától. Ebben az esetben a cég köteles a termékért kifizetett vételárat visszatéríteni a vásárlónak, legkésőbb az elállást, illetve a termék, az eredeti számla visszaszolgáltatását követő tizennégy napon belül. A termék és a számla visszajuttatásának költsége a vevőt terheli.</p>
                  <p>A Vevőnek a terméket tizennégy (14) naptári napon belül az ITT LETÖLTHETŐ termék-visszaküldési lappal együtt szükséges postázni a webáruház pécsi telephelyére: <strong>7623 Pécs, Megyeri út 26. fszt.108.</strong></p>
                  <p>A Megrendelőnek, amennyiben fogyasztónak minősül, 14 munkanapig jogában áll a megkötött szerződéstől elállni, mely esetben köteles a megrendelt terméket a Szállító részére hiánytalanul visszaküldeni. A 17/1999. (II. 5.) Kormányrendelet értelmében a visszaküldés költségei a Megrendelőt terhelik. A Szállító köteles a tesztek ellenértékét a csomag kézhezvételétől számítva 30 napon belül visszajuttatni a Megrendelőnek.</p>
                  <p>Az elállásra nyitva álló 14 munkanapos határidő attól a naptól kezdődik, amikor a Megrendelő a csomagot átvette.</p>
                  <p><strong>Az elállási jog gyakorlásának menete:</strong> A Sunmed Kft. rendelkezik Elállási/Felmondási nyilatkozattal, melyet a megrendelőinknek elállás/felmondás esetén elektronikusan elküldünk. A megrendelt terméket juttassa vissza cégünk címére a kitöltött nyilatkozattal. <strong>A terméket ne utánvéttel küldje vissza!</strong></p>
                  <p>A webáruházainkban egészségügyi gyorsteszteket forgalmazunk. Higiéniai és minőség-biztosítási okokból nem áll módunkba cserélni az átvett egészségügyi gyorsteszteket!</p>
                  <p>A 45/2014. (II. 26.) Korm. rendelet értelmében, az egyszer használatos gyorstesztek egészségvédelmi vagy higiéniai okokból az átadást követően nem küldhetők vissza; így ezen termékekre nem vonatkozik a 14 napos visszaküldési jog.</p>
                </div>
              ),
            },
            {
              id: "7",
              title: "7. Szavatosság és panaszkezelés",
              content: (
                <div className="space-y-3">
                  <p>Az eladó szavatossági és jótállási felelősségére a Ptk.-ban, a 151/2003. (IX. 22.) korm. rendeletben, a 49/2003. (VII.30.) GKM rendeletben, a 72/2005. (IV. 21.) korm. rendeletben és a 45/2014. korm. rendeletben foglaltak az irányadók.</p>
                  <p>A 45/2014. (II. 26.) Korm. rendelet értelmében, az egyszer használatos gyorstesztek egészségvédelmi vagy higiéniai okokból az átadást követően nem küldhetők vissza; így ezen termékekre nem vonatkozik a 14 napos visszaküldési jog.</p>
                  <p>A vevőnek jogában áll panasszal élni, reklamálni, ha hibás a termék. Ilyen esetben haladéktalanul jelezze felénk kifogását. A Sunmed Kft. szavatosságot érintő vagy egyéb panasz esetén jegyzőkönyvet vesz fel, melyet az ügyvezetés minden esetben kivizsgál! Jogos minőségi kifogás esetén biztosítjuk a termék cseréjét. A nem rendeltetésszerű használatból eredő hibák esetén a szavatossági igény nem érvényesíthető.</p>
                  <p>Webáruházainkban olyan termékeket értékesítünk, amelyek I. osztályúak és rendelkeznek a kereskedelmi forgalomba hozatalhoz szükséges engedélyekkel.</p>
                  <p>A www.hpvhelp.hu webáruház termékei a dobozokon feltüntetett szavatossági vagy laboratóriumi vizsgálatra történő mintabeküldési határidővel rendelkeznek. Annak lejárta után egyik forgalmazott termékünk esetében nem áll módunkban a termékeket visszavásárolni vagy a mintabeküldés után a laboratóriumi vizsgálatot elvégezni!</p>
                  <p>A tesztek alkalmazása előtt a páciensnek el kell olvasnia a használati útmutatót és annak tartalma szerint kell eljárnia.</p>
                  <p>Minőségi okok miatt felbontott vagy sérült doboz esetén az egészségügyi gyorstesztet nem áll módunkban visszavenni.</p>
                </div>
              ),
            },
          ].map((section) => (
            <div key={section.id} id={section.id} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">{section.title}</h2>
              {section.content}
            </div>
          ))}

          <p className="text-center text-xs text-red-950/40">Utoljára frissítve: 2026.01.18. 17:27</p>
        </div>
      </main>
    </div>
  );
}
