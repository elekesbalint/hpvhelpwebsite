-- Női IntimSelfCare önmintavételes vizsgálatok (7 termék)
-- Futtatás: Supabase Dashboard → SQL Editor → Run
-- Ár/kép nélkül: price=0, stock=0, is_active=false (adminban aktiválod, ha kész az ár és kép)

insert into public.categories (name, slug, vat_rate, is_active)
values (
  'SAM1  SEXUAL ACTIVITY MONITORING (IntimSelfCare)',
  'sam1-sexual-activity-monitoring-intimselfcare',
  0,
  true
)
on conflict (slug) do update set is_active = true;

-- Közös logisztikai blokk a leírásokban (mintavétel, visszaküldés, lelet, csomag)

insert into public.products (
  category_id,
  name,
  slug,
  description,
  price,
  stock,
  is_active,
  image_url
)
select
  c.id,
  v.name,
  v.slug,
  v.description,
  0,
  0,
  false,
  null
from public.categories c
cross join (
  values
  (
    'hpv-humann-papillomavirus-sam1-onmintavetelezes',
    'HPV (Humán Papillomavírus) - SAM1 Önmintavételezéses szűrővizsgálat',
    $d$
<p><strong>IntimSelfCare SAM1 (Sexual Activity Monitoring)</strong> – Önteszt a HPV (Humán Papillomavírus) vizsgálathoz.</p>
<p>Biztonságos, egyszerű és gyors önmintavételes szűrővizsgálat a méhnyakrákot és szemölcsöket okozó HPV-típusok kimutatására. A mintavétel otthon történik, az eredményt nemzetközi laboratórium elemzi.</p>
<h3>Kinek ajánljuk?</h3>
<p>Minden olyan nőnek, aki valaha szexuálisan aktív volt.</p>
<h3>Mi is az a HPV?</h3>
<p>A humán papillomavírus okozta fertőzés a világon a leggyakoribb szexuális úton terjedő kórokozó. Több mint 200 típus létezik, közülük kb. 40 a nemi szerveket fertőzi.</p>
<h3>Rizikók</h3>
<p>Több partner növeli a kockázatot, de egyetlen partnertől is elkapható. Sok hordozó nem tud a fertőzésről.</p>
<h3>Immunválasz, kezelés</h3>
<p>Sok alacsony kockázatú HPV-fertőzés magától elmúlik. A pontos diagnózis alapján szükség esetén célzott kezelés indítható. További információ: <a href="https://hpvhelp.hu/kezelesek">hpvhelp.hu/kezelesek</a></p>
<h3>Érdemes-e monitorozni a HPV-fertőzést?</h3>
<p><strong>IGEN!</strong> Fontos tudni, meddig észlelhető egy adott HPV-típus, különösen a magas kockázatú típusoknál.</p>
<h3>Milyen HPV típusokat vizsgál a teszt?</h3>
<p><strong>Magas kockázatú:</strong> 16, 18, 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 69, 73, 82.</p>
<p><strong>Alacsony kockázatú:</strong> 6, 11, 40, 42, 43, 44, 54, 61, 70.</p>
<h3>Mintavétel</h3>
<p>Webshop megrendelés után postai úton kapja meg a mintavételi csomagot. A csomagban található használati útmutató lépésről lépésre segít.</p>
<h3>Hogyan jut el az otthoni minta a laboratóriumba?</h3>
<p>A mintavételi pálcát a műanyag tokba, majd a termék dobozába helyezze, a kitöltött és aláírt Laborvizsgálati Kérőlap másolatával együtt. A mintavétel napján adja fel bármely magyar postán az előre megfizetett borítékban.</p>
<h3>Hogyan kapja meg az eredményt?</h3>
<p>7–10 munkanapon belül jelszóval védett PDF formátumban e-mailben. TAJ-szám megadása esetén az eredmény az EESZT-ben is megjelenhet.</p>
<h3>A mintavételi csomag tartalma</h3>
<ul>
<li>1 db steril mintavételi pálca műanyag tokban</li>
<li>1 db újra zárható biológiai védőtasak sárga címkével</li>
<li>2 db Laborvizsgálati Kérőlap (egy a labor részére, egy a páciens részére)</li>
<li>1 db használati útmutató</li>
<li>1 db előre megfizetett, bélelt visszaküldő boríték</li>
</ul>
$d$
  ),
  (
    'sti-szexualisan-terjedo-infekciok-sam2-onmintavetelezes',
    'STI (Szexuálisan Terjedő Infekciók) - SAM2 Önmintavételezéses szűrővizsgálat',
    $d$
<p><strong>IntimSelfCare SAM2 (Sexual Activity Monitoring)</strong> – Önteszt STI (Szexuálisan Terjedő Infekciók) vizsgálathoz.</p>
<p>Biztonságos, egyszerű és gyors önmintavételes szűrővizsgálat szexuális úton terjedő kórokozók kimutatására. A mintát otthon veszi, a labor modern molekuláris (PCR) módszerrel elemzi.</p>
<h3>Kinek ajánljuk?</h3>
<p>Minden olyan nőnek, aki valaha szexuálisan aktív volt – a fertőzések 50–80%-a tünetmentes.</p>
<h3>Mik az STI kórokozók?</h3>
<p>A teszt 6 baktérium és 1 protozoon (<em>Trichomonas vaginalis</em>) kimutatására alkalmas PCR technológiával.</p>
<h3>Rizikók</h3>
<p>Kezeletlen fertőzés visszatérő panaszokat okozhat, és hozzájárulhat a HPV-fertőzés fennmaradásához.</p>
<h3>Kezelés</h3>
<p>A pontos diagnózis az antibiotikus kezelés alapja. Öngyógymód tüneteket elnyomhat, miközben a fertőzés krónikussá válhat.</p>
<h3>Milyen típusokat vizsgál a teszt?</h3>
<ul>
<li><em>Neisseria gonorrhoeae</em> (NG)</li>
<li><em>Chlamydia trachomatis</em> (CT)</li>
<li><em>Ureaplasma urealyticum</em> (UU)</li>
<li><em>Ureaplasma parvum</em> (UP)</li>
<li><em>Mycoplasma hominis</em> (MH)</li>
<li><em>Mycoplasma genitalium</em> (MG)</li>
<li><em>Trichomonas vaginalis</em> (TV)</li>
</ul>
<h3>Mintavétel</h3>
<p>Webshop megrendelés után postai úton kapja meg a mintavételi csomagot.</p>
<h3>Hogyan jut el az otthoni minta a laboratóriumba?</h3>
<p>A mintavétel napján adja fel a postán az előre megfizetett borítékban, a kitöltött Laborvizsgálati Kérőlap másolatával.</p>
<h3>Hogyan kapja meg az eredményt?</h3>
<p>7–10 munkanapon belül jelszóval védett PDF e-mailben. TAJ-szám esetén EESZT-ben is elérhető.</p>
<h3>A mintavételi csomag tartalma</h3>
<ul>
<li>1 db steril mintavételi pálca műanyag tokban</li>
<li>1 db biológiai védőtasak</li>
<li>2 db Laborvizsgálati Kérőlap</li>
<li>1 db használati útmutató</li>
<li>1 db előre megfizetett visszaküldő boríték</li>
</ul>
$d$
  ),
  (
    'microbiom-sam3-onmintavetelezes',
    'Microbiom - SAM3 Önmintavételezéses szűrővizsgálat',
    $d$
<p><strong>IntimSelfCare SAM3 (Sexual Activity Monitoring)</strong> – Önteszt női hüvelyi mikrobiom vizsgálathoz.</p>
<p>Biztonságos, egyszerű önmintavételes szűrővizsgálat a hüvelyi mikrobiom elemzésére nemzetközi laboratóriumban.</p>
<h3>Kinek ajánljuk?</h3>
<p>Nőknek hüvelyi panaszokkal, illetve pozitív HPV/STI lelet után a flora rendezésének monitorozására.</p>
<h3>Rizikók</h3>
<p>A flora egyensúlyának zavara fokozhatja a panaszokat és a HPV jelenlétével együtt a daganatkockázatot.</p>
<h3>Milyen típusokat vizsgál a teszt?</h3>
<p>Pl. <em>Fannyhessea (Atopobium) vaginae</em>, <em>Gardnerella vaginalis</em>, <em>Lactobacillus</em> fajok, BVAB2, <em>Bacteroides fragilis</em>, <em>Megasphaera</em>, <em>Mobiluncus</em> stb.</p>
<h3>Mintavétel és eredmény</h3>
<p>Webshop rendelés → otthoni mintavétel → postai visszaküldés → 7–10 munkanapon belül jelszóval védett PDF e-mailben.</p>
$d$
  ),
  (
    'hpv-sti-kombinacios-onmintavetelezes',
    'HPV és STI kombinációs önmintavételezéses szűrővizsgálat - IntimSelfCare',
    $d$
<p><strong>IntimSelfCare SAM1,2 (Sexual Activity Monitoring)</strong> – Kombinált önteszt HPV és STI vizsgálathoz egy mintából.</p>
<p>Egyetlen otthoni mintavétellel HPV-típusok és szexuális úton terjedő kórokozók kimutatása nemzetközi laboratóriumban.</p>
<h3>Kinek ajánljuk?</h3>
<p>Minden szexuálisan aktív nőnek, akinek átfogó szűrésre van szüksége.</p>
<h3>HPV típusok</h3>
<p>Magas kockázatú: 16, 18, 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 69, 73, 82. Alacsony kockázatú: 6, 11, 40, 42, 43, 44, 54, 61, 70.</p>
<h3>STI típusok</h3>
<p>NG, CT, UU, UP, MH, MG, TV – PCR alapon.</p>
<h3>Immunválasz, kezelés</h3>
<p>További információ: <a href="https://hpvhelp.hu/kezelesek">hpvhelp.hu/kezelesek</a></p>
<h3>Mintavétel, visszaküldés, lelet</h3>
<p>Webshop rendelés → otthoni mintavétel → postai visszaküldés → 7–10 munkanapon belül jelszóval védett PDF e-mailben (TAJ esetén EESZT).</p>
$d$
  ),
  (
    'sti-microbiom-kombinacios-onmintavetelezes',
    'STI és Microbiom kombinációs önmintavételezéses szűrővizsgálat - IntimSelfCare',
    $d$
<p><strong>IntimSelfCare SAM2,3 (Sexual Activity Monitoring)</strong> – Kombinált önteszt STI és női hüvelyi mikrobiom vizsgálathoz.</p>
<p>Egy mintából STI-kórokozók és a hüvelyi mikrobiom elemzése nemzetközi laboratóriumban.</p>
<h3>Kinek ajánljuk?</h3>
<p>Szexuálisan aktív nőknek, különösen panaszok (égés, viszketés) vagy korábbi pozitív HPV-lelet esetén.</p>
<h3>STI típusok</h3>
<p>NG, CT, UU, UP, MH, MG, TV.</p>
<h3>Microbiom típusok</h3>
<p>AV, BVAB2, BF, GV, <em>Lactobacillus</em> fajok, Mega, Mob stb.</p>
<h3>Kezelés</h3>
<p>A pontos diagnózis alapján célzott antibiotikus kezelés és flora-rendezés lehetséges.</p>
<h3>Mintavétel, visszaküldés, lelet</h3>
<p>Webshop rendelés → otthoni mintavétel → postai visszaküldés → 7–10 munkanapon belül jelszóval védett PDF e-mailben.</p>
$d$
  ),
  (
    'hpv-microbiom-kombinacios-onmintavetelezes',
    'HPV és Microbiom kombinációs önmintavételezéses szűrővizsgálat - IntimSelfCare',
    $d$
<p><strong>IntimSelfCare SAM1,3 (Sexual Activity Monitoring)</strong> – Kombinált önteszt HPV és női hüvelyi mikrobiom vizsgálathoz.</p>
<p>Egy otthoni mintából HPV-típusok és a hüvelyi mikrobiom együttes vizsgálata.</p>
<h3>Kinek ajánljuk?</h3>
<p>Minden szexuálisan aktív nőnek, különösen korábbi eltérő HPV-lelet esetén.</p>
<h3>HPV típusok</h3>
<p>28 legfontosabb típus (magas és alacsony kockázatú csoportok).</p>
<h3>Microbiom típusok</h3>
<p>AV, BVAB2, BF, GV, <em>Lactobacillus</em> fajok stb.</p>
<h3>Kezelés</h3>
<p>További információ: <a href="https://hpvhelp.hu/kezelesek">hpvhelp.hu/kezelesek</a></p>
<h3>Mintavétel, visszaküldés, lelet</h3>
<p>Webshop rendelés → otthoni mintavétel → postai visszaküldés → 7–10 munkanapon belül jelszóval védett PDF e-mailben.</p>
$d$
  ),
  (
    'hpv-sti-microbiom-kombinacios-onmintavetelezes',
    'HPV, STI és Microbiom kombinációs önmintavételezéses szűrővizsgálat - IntimSelfCare',
    $d$
<p><strong>IntimSelfCare SAM1,2,3 (Sexual Activity Monitoring)</strong> – Teljes kombinált önteszt HPV, STI és női hüvelyi mikrobiom vizsgálathoz.</p>
<p>Átfogó otthoni szűrés egy mintavételből: HPV-típusok, szexuális úton terjedő kórokozók és a hüvelyi mikrobiom elemzése.</p>
<h3>Kinek ajánljuk?</h3>
<p>Minden szexuálisan aktív nőnek, aki a legteljesebb otthoni szűrést szeretné.</p>
<h3>HPV típusok</h3>
<p>Magas kockázatú: 16, 18, 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 69, 73, 82. Alacsony kockázatú: 6, 11, 40, 42, 43, 44, 54, 61, 70.</p>
<h3>STI típusok</h3>
<p>NG, CT, UU, UP, MH, MG, TV.</p>
<h3>Microbiom típusok</h3>
<p>AV, BVAB2, BF, GV, <em>Lactobacillus</em> fajok, Mega, Mob stb.</p>
<h3>Kezelés</h3>
<p>További információ: <a href="https://hpvhelp.hu/kezelesek">hpvhelp.hu/kezelesek</a></p>
<h3>Mintavétel, visszaküldés, lelet</h3>
<p>Webshop rendelés → otthoni mintavétel → postai visszaküldés → 7–10 munkanapon belül jelszóval védett PDF e-mailben (TAJ esetén EESZT).</p>
$d$
  )
) as v(slug, name, description)
where c.slug = 'sam1-sexual-activity-monitoring-intimselfcare'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  updated_at = now();
