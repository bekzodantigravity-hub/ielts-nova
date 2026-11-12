const fs = require('fs');

const r09Authoring = `
/* ================================================================
   ║ TEST 9 (VOLUME 5)
   ║ IELTS READING TEST AUTHORING AREA
   ║ Content: The Blockbuster Phenomenon, Saving the Bittern, The Placebo Effect
   ================================================================ */

const HEADINGS = [
  { n: 'i', t: 'Commercial sponsorship and financial stakes' },
  { n: 'ii', t: 'The origins of the blockbuster exhibition model' },
  { n: 'iii', t: 'Intellectual and conservation compromises' },
  { n: 'iv', t: 'Public engagement versus scholarly research' },
  { n: 'v', t: 'The role of merchandising and retail spin-offs' },
  { n: 'vi', t: 'Long-term impacts on permanent museum collections' },
  { n: 'vii', t: 'Global touring logistics and insurance challenges' },
  { n: 'viii', t: 'Shifting visitor demographics and cultural tourism' }
];

const ENDINGS = [
  { n: 'A', t: 'demonstrated that neurochemical pathways directly modulate physical pain perception.' },
  { n: 'B', t: 'revealed that therapeutic rituals produce measurable improvements even without deception.' },
  { n: 'C', t: 'highlighted the ethical pitfalls of prescribing sham treatments in regular clinical care.' },
  { n: 'D', t: 'showed that morphine shortages compelled physicians to study psychological pain relief.' },
  { n: 'E', t: 'proved that cultural expectations alter physiological responses to medications.' }
];

const PASSAGES = {
  1: {
    title: "The Blockbuster Phenomenon: a new museum trend",
    qr: "Questions 1–13",
    html: \`<h2>The Blockbuster Phenomenon: a new museum trend</h2>
<p style="font-style:italic;text-align:center;margin-bottom:14px">How temporary mega-exhibitions transformed traditional galleries into high-stakes cultural enterprises</p>

<p><b>A</b> Over the past three decades, the international museum world has undergone a profound structural transformation. Where grand national galleries once served primarily as custodians of scholarly contemplation and conservation, today they increasingly compete in the dynamic entertainment marketplace. At the forefront of this evolution is the "blockbuster" exhibition: a temporary, heavily marketed, high-profile presentation of rare masterpieces designed to attract unprecedented throngs of visitors within a restricted chronological window.</p>

<p><b>B</b> Although museum historians trace the origins of massive public exhibitions back to the 19th-century World Fairs, the modern blockbuster paradigm crystallized in the 1970s. The seminal catalyst was the touring exhibition "Treasures of Tutankhamun," which traversed major cultural institutions across North America and Europe between 1972 and 1979. Attracting more than eight million visitors in the United States alone, the Tutankhamun tour demonstrated that antiquity, when curated with dramatic lighting, compelling narrative myth, and tightly controlled crowd sequencing, could generate revenues and global prestige that permanently eclipsed the modest budgets of conventional permanent displays.</p>

<p><b>C</b> Staging a contemporary blockbuster, however, requires colossal financial investment and complex organizational orchestration. Securing irreplaceable loans from peer institutions often involves protracted diplomatic negotiations, reciprocal loan pledges, and staggering indemnity policies. When paintings by Leonardo da Vinci, Rembrandt, or Vermeer travel abroad, transport insurance and specialized climate-controlled couriers can easily push production budgets into millions of dollars. To offset these exorbitant upfront expenditures, museum directors have turned increasingly to private corporate sponsors. Banks, global luxury conglomerates, and multinational technology corporations eagerly underwrite these cultural extravaganzas in exchange for brand prestige, VIP hospitality rights, and prominent logo exposure.</p>

<p><b>D</b> Beyond ticket sales and corporate philanthropy, the financial viability of mega-exhibitions relies heavily upon ancillary commerce. The phenomenon of the dedicated exhibition gift shop—where visitors are deliberately channeled immediately after viewing the final gallery—has become a retail masterclass. Customised catalogues, silk scarves emblazoned with Impressionist brushstrokes, stationery, and replica jewelry turn ephemeral aesthetic experiences into lucrative tangible souvenirs. For many metropolitan institutions, auxiliary revenue from catering, specialty merchandise, and exclusive memberships now rivals or surpasses government subsidy allocations.</p>

<p><b>E</b> Despite their undeniable popular triumph, blockbuster exhibitions face formidable criticism from art historians and curators. Skeptics argue that the relentless appetite for headline-grabbing spectacles distorts museum priorities. Immense human and financial resources are diverted away from permanent collections, long-term scholarly scholarship, and local educational outreach. Permanent galleries, often housing works of sublime aesthetic significance, stand eerily deserted while thousands shuffle shoulder-to-shoulder through dimly illuminated temporary exhibition wings. Furthermore, the relentless transit of delicate panel paintings and fragile tapestries accelerates structural degradation, raising serious ethical dilemmas regarding conservation obligations to future generations.</p>

<p><b>F</b> The demographic composition of museum attendance has undoubtedly broadened under the blockbuster regime. Casual visitors, school groups, and international cultural tourists who might never otherwise enter an art gallery are drawn by intense social media campaigns and prestige branding. Yet critics caution that this visitor influx can be superficial. Timed-entry slots and packed gallery circuits encourage hurried, crowd-pressured viewing rather than sustained, critical engagement with artistic craft. The pressure to maintain sensational momentum traps institutions in a high-risk cycle: each consecutive year demands a bigger, costlier, and more sensational exhibition to keep box-office numbers buoyant.</p>

<p><b>G</b> Today, museums find themselves standing at a critical juncture. The post-pandemic economic landscape, escalating air freight charges, and environmental sustainability imperatives are prompting thoughtful reappraisals of the hyper-mobile blockbuster formula. Forward-thinking directors are experimenting with hybrid programming: smaller, research-driven focus exhibitions drawn from existing institutional holdings, accompanied by immersive digital archives. While the blockbuster will almost certainly endure as an occasional flagship vehicle, the era of unsustainable mega-tours may gradually give way to more balanced, community-anchored, and ecologically mindful curatorial stewardship.</p>
\`
  },
  2: {
    title: "Saving the Bittern",
    qr: "Questions 14–26",
    html: \`<h2>Saving the Bittern</h2>
<p style="font-style:italic;text-align:center;margin-bottom:14px">How dedicated conservationists pulled one of Britain's most enigmatic wetland birds back from the brink of extinction</p>

<p><b>A</b> Standing completely motionless amidst golden stems of dense common reed (Phragmites australis), the Eurasian Bittern (Botaurus stellaris) is virtually invisible. With its warm buff-brown plumage intricately patterned with black speckles and streaks, this elusive member of the heron family represents nature's masterpiece of optical concealment. When alarmed, the bittern points its slender dagger-like bill vertically toward the sky and gently sways in unison with windblown reed beds—a camouflage posture so convincing that humans can walk within two yards of a nesting bird without noticing its presence.</p>

<p><b>B</b> For centuries, the resonant voice of the bittern was an iconic soundscape of the British wetlands. In early spring, male bitterns produce an astonishing mating call: a deep, booming vocalisation that can carry across open fenland for more than three miles. To produce this resonant foghorn-like sound, the male pumps air into an expandable, muscular gullet before releasing it in rhythmic pulses. In British folklore, this eerie twilight rumble gave rise to vivid local epithets such as "bog-bumper," "bitter-bump," and "bull of the bog." Yet by the closing decades of the 20th century, this primeval music had fallen catastrophically silent.</p>

<p><b>C</b> The precipitous collapse of Britain's bittern population was caused almost entirely by habitat destruction. During the agricultural revolutions of the 18th and 19th centuries, colossal drainage schemes systematically reclaimed millions of acres of marshes and lowland bogs across East Anglia, Somerset, and Yorkshire for arable farming. Compounding this direct loss of wetland acreage, surviving reedbeds suffered severe neglect. Without continuous water control and careful reed-cutting, natural ecological succession gradually transforms wet reed beds into scrub woodland and alder carr—dry environments entirely unsuitable for a species that requires wet, waterlogged silt to forage for its primary diet of small fish, amphibians, and aquatic insects.</p>

<p><b>D</b> By 1997, conservation surveys conducted by the Royal Society for the Protection of Birds (RSPB) documented an existential nadir: across the entire United Kingdom, only 11 booming males remained, confined to precarious fragments in Norfolk and Suffolk. Facing imminent national extinction, a coalitions of conservation bodies launched the Bittern Recovery Project, backed by ambitious funding from the European Union's LIFE-Nature fund. The initiative moved beyond mere preservation of existing reserves; it pioneered landscape-scale habitat restoration and radical hydraulic engineering.</p>

<p><b>E</b> Transforming desiccated marshes back into thriving bittern sanctuaries demanded meticulous hydrological intervention. Sluices, deep water dykes, and waterproof clay bunds were constructed to maintain stable water levels of 20 to 30 centimeters throughout the crucial springtime breeding window. This stable flooding prevented predatory mammals such as foxes and American mink from reaching ground nests built upon reed platforms. Crucially, conservationists cut wide, winding "fish ditches" through the reed mass, creating meandering water edges where bitterns could stealthily ambush rudd, roach, and three-spined sticklebacks. At Lakenheath Fen in Suffolk, former carrot and beet fields were sculpted into an expansive 400-hectare mosaic of reed and open lagoons, establishing one of the most successful ecological regeneration projects in modern Europe.</p>

<p><b>F</b> The ecological turnaround achieved over the ensuing two decades has exceeded the wildest hopes of ornithologists. Annual acoustic monitoring revealed that booming male counts steadily climbed from 11 in 1997 to over 100 by 2011, and surpassed 220 by 2023. Bitterns have successfully re-colonized ancient ancestral strongholds in the Cambridgeshire Fens, the Humber Estuary, and south Wales. The triumphant resurrection of the bittern provides a stirring demonstration that when targeted scientific research, visionary engineering, and long-term funding converge, even the most fragile wildlife treasures can be reclaimed from the precipice of oblivion.</p>
\`
  },
  3: {
    title: "The Placebo Effect",
    qr: "Questions 27–40",
    html: \`<h2>The Placebo Effect</h2>
<p style="font-style:italic;text-align:center;margin-bottom:14px">Exploring the complex neuroscience and clinical implications of the body's internal pharmacy</p>

<p><b>A</b> In everyday parlance, the term "placebo"—derived from the Latin phrase meaning "I shall please"—was historically dismissed as synonymous with medical deception. For generations, doctors viewed sugar pills, saline injections, and sham therapies as harmless psychological pacifiers prescribed to placate neurotic patients or soothe hypochondriacs. When patients reported feeling better after receiving an inert treatment, mainstream medicine routinely concluded that their underlying ailments were either purely imaginary or had simply resolved through spontaneous remission. Within the past quarter-century, however, rigorous advances in molecular biology, neuroimaging, and clinical pharmacology have overturned this simplistic dismissal, establishing that the placebo response is an authentic, measurable neurobiological phenomenon.</p>

<p><b>B</b> The modern scientific investigation of placebos originated amid the battlefield carnage of World War II. Henry Beecher, an American anesthesiologist serving near the front lines in southern Italy, ran out of morphine supplies while treating severely wounded soldiers. In desperation, a field nurse injected a soldier in agonizing pain with normal saline solution while assuring him that it was a potent painkiller. To Beecher's astonishment, the soldier's agony promptly subsided, and he underwent major emergency surgery without exhibiting symptoms of traumatic shock. Upon returning to Harvard Medical School after the war, Beecher published his groundbreaking 1955 paper "The Powerful Placebo," arguing that up to 35 percent of therapeutic efficacy in standard medical treatments could be attributed to the patient's psychological belief in the intervention.</p>

<p><b>C</b> The neurochemical mechanism underpinning placebo analgesia remained an enigma until the late 1970s, when Italian neuroscientist Fabrizio Benedetti and American researchers performed landmark pharmacological experiments. They administered naloxone—a chemical compound known to block opioid receptors in the human brain—to patients who had previously responded positively to inert placebo pain medication. The moment naloxone was injected, the pain-relieving effects of the placebo vanished instantly. This definitive finding proved that placebo analgesia was not a psychological delusion or wishful thinking; rather, the mental anticipation of relief triggered the pituitary gland and hypothalamus to flood the central nervous system with genuine endogenous opioids (endorphins), physically attenuating pain signals traveling up the spinal cord.</p>

<p><b>D</b> Subsequent neuroimaging investigations using functional Magnetic Resonance Imaging (fMRI) have mapped these chemical cascades in vivid real time. Brain scans conducted during placebo administration show sharp reductions in neural activity across the so-called "pain matrix," including the thalamus, somatosensory cortex, and anterior insula, alongside heightened activation in the dorsolateral prefrontal cortex. Furthermore, the placebo effect is not confined to pain relief. In patients suffering from Parkinson's disease—a degenerative neurological condition characterized by the loss of dopamine-producing neurons—the anticipation of receiving anti-Parkinsonian medication causes the striatum to release massive surges of endogenous dopamine, producing tangible, measurable improvements in muscle tremors and motor coordination.</p>

<p><b>E</b> Intriguingly, the magnitude of a placebo response is powerfully conditioned by contextual cues, symbolism, and cultural conditioning. Clinical trials have repeatedly demonstrated that two inert sugar pills generate significantly greater clinical improvement than a single pill. Sham injections deliver superior symptom relief compared to sham tablets, and elaborate sham surgeries—such as arthroscopic knee incisions where the surgeon merely inspects the joint without removing any cartilage—yield recovery outcomes indistinguishable from authentic surgical procedures. Even colour plays a psychological role: yellow placebo capsules prove exceptionally effective in treating depression, whereas green or blue capsules excel at alleviating chronic anxiety and promoting sleep.</p>

<p><b>F</b> Until recently, medical convention held that placebo therapies relied fundamentally upon deception: patients had to believe they were receiving a pharmacologically active substance. This doctrine was shattered by Ted Kaptchuk, professor of medicine at Harvard University. In seminal randomized clinical trials involving patients with irritable bowel syndrome (IBS) and chronic lower back pain, Kaptchuk gave participants openly labeled placebo bottles clearly marked "Sugar pills: inert substance with no active medication." Doctors explicitly explained to patients that these pills were completely inert but that clinical evidence showed positive mind-body responses could still occur through classical conditioning and ritual. Remarkably, patients receiving these "open-label placebos" reported statistically significant, long-lasting symptom relief compared to untreated control groups.</p>

<p><b>G</b> The clinical validation of open-label placebos opens provocative new avenues for contemporary medical ethics. In an era dominated by skyrocketing pharmaceutical expenses and growing concerns over opioid addiction, harnessing the mind's endogenous healing faculties without practicing fraudulent deception offers a tantalizing therapeutic adjunct. Rather than treating the placebo effect as an annoying statistical nuisance to be factored out of clinical drug trials, holistic 21st-century medicine may soon embrace it as a vital therapeutic ally, recognizing that the ritual of caring, the clinician's empathy, and the patient's hopeful expectations are potent biochemical catalysts for healing.</p>
\`
  }
};

const ANSWERS = {
  1: 'ii',
  2: 'i',
  3: 'v',
  4: 'iii',
  5: 'viii',
  6: 'TRUE',
  7: 'FALSE',
  8: 'NOT GIVEN',
  9: 'TRUE',
  10: 'loans',
  11: 'sponsors',
  12: 'catalogues',
  13: 'conservation',
  14: 'B',
  15: 'E',
  16: 'A',
  17: 'C',
  18: 'F',
  19: 'D',
  20: 'common reed',
  21: 'drainage',
  22: 'scrub woodland',
  23: 'stable water',
  24: 'B',
  25: 'C',
  26: 'A',
  27: 'NO',
  28: 'YES',
  29: 'NOT GIVEN',
  30: 'YES',
  31: 'NO',
  32: 'D',
  33: 'A',
  34: 'B',
  35: 'E',
  36: 'endogenous opioids',
  37: 'dopamine',
  38: 'injections',
  39: 'colour',
  40: 'open-label'
};
`;

fs.writeFileSync('scripts/r09-authoring-data.js', r09Authoring);
console.log('Successfully wrote scripts/r09-authoring-data.js');
