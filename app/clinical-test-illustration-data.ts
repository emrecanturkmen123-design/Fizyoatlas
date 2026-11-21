type Drawing =
  | { kind: 'shape' | 'detail' | 'ghost' | 'arrow' | 'resistance' | 'warning' | 'surface'; path: string }
  | { kind: 'label'; x: number; y: number; toX: number; toY: number; text: string }
  | { kind: 'limb'; path: string; width: number }
  | { kind: 'head' | 'front-head' | 'back-head' | 'hand' | 'target'; x: number; y: number; angle: number; scale: number };

type Illustration = {
  view: string;
  caption: string;
  drawing: Drawing[];
};

const shape = (path: string): Drawing => ({ kind: 'shape', path });
const detail = (path: string): Drawing => ({ kind: 'detail', path });
const ghost = (path: string): Drawing => ({ kind: 'ghost', path });
const arrow = (path: string): Drawing => ({ kind: 'arrow', path });
const resistance = (path: string): Drawing => ({ kind: 'resistance', path });
const surface = (path: string): Drawing => ({ kind: 'surface', path });
const label = (x: number, y: number, text: string, toX: number, toY: number): Drawing =>
  ({ kind: 'label', x, y, text, toX, toY });
const warning = (path: string): Drawing => ({ kind: 'warning', path });
const limb = (path: string, width: number): Drawing => ({ kind: 'limb', path, width });
const head = (x: number, y: number, angle = 0, scale = 1): Drawing => ({ kind: 'head', x, y, angle, scale });
const frontHead = (x: number, y: number): Drawing => ({ kind: 'front-head', x, y, angle: 0, scale: 1 });
const backHead = (x: number, y: number, angle = 0, scale = 1): Drawing => ({ kind: 'back-head', x, y, angle, scale });
const hand = (x: number, y: number, angle = 0, scale = 1): Drawing => ({ kind: 'hand', x, y, angle, scale });
const target = (x: number, y: number): Drawing => ({ kind: 'target', x, y, angle: 0, scale: 1 });
const image = (view: string, caption: string, ...drawing: Drawing[]): Illustration => ({ view, caption, drawing });

const chair = surface('M61 100Q61 97 64 97H68V153H150Q155 153 155 158V161H146V176H142V161H84V176H80V161H61Z');
const seatedSide = [
  chair, head(99, 50),
  shape('M87 66 Q90 58 92 58 L113 59 Q113 72 124 79 C141 91 132 117 128 130 L139 153 Q111 163 86 154 Q84 134 83 116 Q76 87 87 66Z'),
  detail('M89 77 Q96 88 115 84'),
];
const seatedFront = [
  frontHead(159, 48),
  shape('M145 64 H174 L176 76 Q187 79 207 89 Q211 101 195 109 L184 140 L191 162 H127 L133 139 L122 109 Q104 100 111 89 Q130 80 143 76Z'),
  detail('M128 92 Q145 87 159 96 Q173 87 192 92 M159 97 V133'),
];
const highPlinth = surface('M24 147Q24 144 28 144H287Q291 144 291 147V152H283V172H279V152H36V172H32V152H24Z');
const supine = [
  highPlinth, head(43, 129, -82, .78),
  shape('M55 137 Q63 124 72 120 Q96 120 108 126 L138 125 Q147 128 151 139 L148 144 H61Z'),
  detail('M77 129 Q100 129 118 135'),
];
const prone = [
  highPlinth, head(46, 130, 90, .77),
  shape('M58 138 Q68 125 84 124 Q110 128 127 123 Q142 121 152 134 L152 144 H53Z'),
  detail('M69 139 H102'),
];
const kneeBase = [
  surface('M34 153Q34 151 38 151H288V159H273V175H268V159H51V175H46V159H34Z'),
  shape('M39 126 Q55 116 79 124 L91 140 L75 151 H39Z'),
];
const drawerKnee = [
  ...kneeBase, limb('M76 137 L168 80', 29),
  limb('M168 80 L210 145', 22), limb('M208 144 L236 147', 12),
  detail('M160 72 Q172 66 178 76'),
];
const frontKnee = [
  limb('M219 46 L221 113 L223 156 L236 164', 23),
  shape('M119 38 Q181 23 230 38 L226 68 Q193 77 182 61 Q165 77 127 68Z'),
  limb('M146 59 L152 105', 31), limb('M152 105 L151 153', 23),
  limb('M151 153 L139 166', 13), detail('M145 99 Q155 93 160 105 Q156 115 148 113'),
];
const angledFoot = [
  surface('M31 138H154V145H42V166H37V145H31Z'),
  limb('M62 104 L174 109 L196 120', 36),
  shape('M192 101 Q202 100 207 113 L213 128 Q222 135 239 147 Q243 154 235 159 Q223 164 207 155 L188 144 Q180 135 188 121Z'),
  detail('M194 117 Q203 119 203 129 M204 147 Q213 149 223 153'),
];
const palm = shape('M128 166 L131 130 Q114 116 103 101 Q98 93 105 87 Q111 83 118 90 L130 101 L126 57 Q126 47 134 47 Q141 47 142 57 L147 79 L148 41 Q149 32 157 33 Q164 33 165 43 L167 78 L173 47 Q175 39 183 41 Q190 43 189 52 L185 84 L194 63 Q198 56 205 60 Q211 63 208 71 L197 114 Q194 124 181 135 L177 166Z');

export const clinicalTestIllustrations: Record<string, Illustration> = {
  neer: image('Yandan', 'Skapula sabitken düz kol öne ve yukarı kaldırılır.',
    ...seatedSide, ghost('M119 88 L132 122 L135 154'),
    limb('M119 91 L132 63 L139 27', 19), limb('M139 26 L143 16', 11),
    hand(144, 25, -38, .82), hand(93, 83, 86, .8),
    arrow('M158 142 C201 124 199 68 163 38'), label(17, 115, 'Skapula', 89, 87)),
  hawkins: image('Yandan', 'Omuz ve dirsek 90° fleksiyonda. Dirsek desteklenirken önkol aşağı yönlendirilir.',
    ...seatedSide, ghost('M199 91 L203 41'),
    shape('M115 81Q149 78 182 81Q198 80 206 87Q211 95 205 108L184 137Q179 143 172 137Q168 134 173 126L189 103Q182 101 169 101L123 103Q110 101 110 92Z'),
    shape('M171 131Q166 138 163 144Q161 153 165 156Q168 158 171 154L183 139Z'),
    detail('M181 90 Q193 88 199 95 M184 103 Q192 108 196 106'),
    hand(199, 99, 144, .79), hand(172, 139, 8, .86),
    arrow('M220 48Q252 89 208 133'), label(228, 151, 'İç rotasyon', 209, 135)),
  jobe: image('Önden', 'Kollar skapula düzleminde, başparmaklar aşağıda. Eller aşağı yönlü direnç verir.',
    ...seatedFront,
    shape('M117 86Q103 82 83 79L51 69L44 76L48 85L76 91Q98 98 116 103Q125 102 127 95Q126 89 117 86Z'),
    shape('M202 86Q216 82 236 79L269 69L276 76L272 85L244 91Q222 98 204 103Q195 102 193 95Q194 89 202 86Z'),
    detail('M81 80L77 88 M239 80L243 88'),
    shape('M31 70 Q43 67 53 72 L55 80 L45 83 L43 93 Q40 97 37 93 L35 83 Q27 82 31 70Z'),
    shape('M289 70 Q277 67 267 72 L265 80 L275 83 L277 93 Q280 97 283 93 L285 83 Q293 82 289 70Z'),
    hand(67, 72, 113, .68), hand(253, 72, 65, .68),
    resistance('M55 34 V63'), resistance('M265 34 V63'), label(12, 121, 'Başparmak aşağı', 40, 91)),
  drop_arm: image('Önden', 'Yana kaldırılan kol, kişi tarafından yavaş ve kontrollü biçimde indirilir.',
    ...seatedFront, limb('M120 97 L108 129 L105 159', 17),
    ghost('M202 97 L251 97 L292 97'),
    limb('M200 97 L235 120 L264 145', 18), limb('M264 144 L273 154', 10),
    arrow('M289 105Q286 132 272 138'), label(218, 74, 'Başlangıç', 265, 97)),
  speed: image('Yandan', 'Dirsek düz ve avuç yukarı. Kişi kolunu öne kaldırırken klinisyen aşağı yönlü direnç verir.',
    ...seatedSide, limb('M116 92 L170 83 L233 73', 20),
    shape('M229 71 Q246 66 254 68 Q260 71 254 75 L239 81 L229 79Z'),
    detail('M238 71 Q247 71 251 69'), hand(232, 66, 70, .85),
    resistance('M227 22 L233 57'), arrow('M264 106 L264 77'), label(207, 124, 'Avuç yukarı', 245, 72)),
  yergason: image('Yandan', 'Dirsek gövdeye yakın ve 90° bükülü. Kişi avucu yukarı çevirmeye çalışır.',
    ...seatedSide, limb('M117 89 L118 131', 21),
    limb('M118 131 L185 131', 17), limb('M185 131 L201 130', 11),
    detail('M120 116 V124 H130'), hand(193, 130, -25, .86),
    arrow('M206 152 C245 149 245 111 208 110'), label(179, 88, 'Supinasyon', 225, 117)),
  apprehension: image('Önden', 'Omuz yanda, dirsek 90° bükülü. Önkol geriye giderken kişi çıkacakmış hissi açısından gözlenir.',
    ...seatedFront, limb('M119 98 L112 129 L110 158', 17),
    limb('M201 97 L254 95 L255 43', 19), limb('M255 43 L256 28', 10),
    detail('M238 93 V80 H250'), hand(248, 49, 110, .77), hand(215, 100, -10, .78),
    ghost('M254 95 L235 54'), arrow('M274 78 C289 61 282 34 267 23')),
  cozen: image('Yandan · dirsek ve el bileği', 'Kişi yumruğunu yukarı kaldırırken klinisyen el sırtına karşı direnç verir.',
    limb('M73 31 L89 113', 37), limb('M89 113 L193 108', 29),
    limb('M194 107 L222 88', 22), detail('M209 84 L229 90 M210 93 L227 96'),
    target(96, 96), hand(84, 105, 173, .82), hand(220, 77, 45, .92),
    arrow('M236 132 L240 103'), resistance('M206 30 L211 64'), label(33, 144, 'Dış dirsek', 98, 96)),
  mill: image('Yandan · dirsek ve el bileği', 'Önkol pronasyonda ve el bileği bükülüyken dirsek düzleştirilir.',
    limb('M33 62 L111 95 L208 128', 31),
    limb('M208 127 L219 159', 18), detail('M215 145 L225 147 M218 152 L228 154'),
    target(109, 81), hand(105, 93, 100, .83), hand(220, 143, -8, .84),
    ghost('M110 94 L211 87'), arrow('M244 90 Q244 118 230 134'), label(69, 156, 'Dirsek açılır', 113, 104)),
  phalen: image('Önden · el bilekleri bükülü', 'Kişi el sırtlarını birleştirir. Bilekler bükülü kalırken karıncalanma veya uyuşmanın dağılımı gözlenir.',
    shape('M31 61Q69 62 104 70L137 79Q150 83 155 94L160 107L160 143Q158 154 153 155Q148 155 147 147L144 130L144 144Q143 152 139 151Q134 151 133 142L130 118Q127 113 124 113L111 125Q106 130 102 125Q97 121 102 115L124 95L104 92Q70 91 31 84Z'),
    shape('M289 61Q251 62 216 70L183 79Q170 83 165 94L160 107L160 143Q162 154 167 155Q172 155 173 147L176 130L176 144Q177 152 181 151Q186 151 187 142L190 118Q193 113 196 113L209 125Q214 130 218 125Q223 121 218 115L196 95L216 92Q250 91 289 84Z'),
    detail('M125 85Q137 88 142 98M195 85Q183 88 178 98M149 119V136M171 119V136'),
    detail('M160 104 V148'), label(126, 173, 'El sırtları', 160, 128)),
  tinel: image('Avuç içi', 'Hafif vurunun yeri, avuç tarafında el bileği çizgisine yakın median sinir hattıdır.',
    palm, detail('M133 130 Q154 138 181 131 M145 126 Q166 116 178 92'),
    target(155, 138), hand(160, 130, -149, 1.08),
    resistance('M200 104 L169 130'), detail('M139 139 L145 140 M144 148 L149 145'), label(199, 159, 'Median sinir', 157, 140)),
  finkelstein: image('Avuç içi', 'Klinisyen başparmağı tutar. El bileği küçük parmak tarafına yönelir.',
    palm, detail('M131 130 Q157 138 179 131 M134 108 Q125 117 141 128'),
    target(130, 125), hand(110, 87, 167, 1.03),
    arrow('M210 106 Q237 126 215 146'), label(17, 127, 'Başparmak', 104, 100)),
  spurling: image('Arkadan · bir varyant', 'Klinisyen başı semptom tarafına yönlendirir. Ok, seçilen varyantta hafif aksiyel yük yönünü gösterir.',
    shape('M137 89 L178 88 L186 105 Q227 113 241 134 L232 168 H88 L79 134 Q96 112 129 106Z'),
    backHead(180, 65, 19, 1.45), detail('M135 110 Q144 121 158 125 Q174 119 184 109 M158 123 V160'),
    hand(185, 45, 68, 1), resistance('M200 13 L191 37'), target(174, 103)),
  slr: image('Yandan · sırtüstü', 'Diz düz kalır. Klinisyen topuğu destekleyerek bacağı kaldırır.',
    ...supine, limb('M126 133 L208 134 L271 135 L276 116', 16),
    limb('M126 132 L177 83', 26), limb('M177 83 L222 37 L223 21', 18),
    hand(217, 47, -116, .75), arrow('M272 110 Q271 77 248 54'), label(100, 68, 'Diz düz', 175, 85)),
  femoral_stretch: image('Yandan · yüzüstü', 'Uyluk yüzeyde kalırken diz bükülür. Topuk kalçaya yaklaşır.',
    ...prone, limb('M140 132 L214 131', 27), ghost('M214 131 L275 132'),
    limb('M213 130 L198 65 L186 52', 18), hand(198, 66, 35, .85),
    arrow('M262 116 Q258 77 224 61'), label(126, 101, 'Diz bükülür', 209, 126)),
  faber: image('Üstten · sırtüstü', 'Bir ayak karşı dizin üzerine yerleştirilir. Karşı pelvis sabitlenir, bükülü diz yüzeye yönelir.',
    detail('M57 17 H267 V173 H57Z'),
    shape('M112 27 Q162 18 208 29 L202 68 Q181 88 162 76 Q146 84 121 68Z'),
    limb('M135 68 L131 122 L128 163', 27),
    limb('M186 67 L236 104', 30), limb('M236 104 L153 120 L137 116', 19),
    hand(120, 52, 125, .88), hand(233, 104, -31, .92),
    resistance('M265 66 L246 94'), label(38, 55, 'Pelvis sabit', 121, 59)),
  gaenslen: image('Yandan · masa kenarı', 'Bir diz göğse alınır. Diğer kalça yatak kenarından ekstansiyona yönelir.',
    ...supine.slice(1), surface('M26 145H151V152H144V174H140V152H38V174H34V152H26Z'),
    limb('M132 130 L104 67', 24), limb('M104 67 L155 87 L166 81', 17),
    limb('M132 132 L195 159', 24), limb('M195 159 L253 158 L261 170', 18),
    hand(113, 68, 105, .86), hand(194, 152, 50, .86),
    arrow('M124 42 L110 60'), resistance('M197 104 L197 138')),
  adams: image('Arkadan', 'Kişi öne eğilir. Klinisyen sırtın sağ ve sol yüksekliğini arkadan karşılaştırır.',
    detail('M58 168 H267'), limb('M126 105 L118 146 L115 161 L128 165', 24),
    limb('M191 106 L204 145 L208 161 L194 164', 24),
    shape('M127 49 Q153 35 185 46 Q217 35 227 56 Q242 80 212 101 Q195 119 158 118 Q108 120 98 92 Q85 68 107 55Z'),
    limb('M121 65 L136 121 L141 151', 14), limb('M200 61 L185 121 L182 153', 14),
    detail('M159 48 Q159 71 162 109 M117 63 Q136 54 151 60 M168 55 Q187 42 206 51'),
    ghost('M94 73 H233'), target(186, 52), label(218, 26, 'Asimetri', 189, 48)),
  thomas: image('Yandan · modifiye Thomas', 'Karşı diz göğse çekilir. Pelvis sabitken serbest uyluk ve diz açısı ayrı gözlenir.',
    ...supine.slice(1), surface('M26 145H198V152H192V174H188V152H38V174H34V152H26Z'),
    limb('M134 132 L111 65', 25), limb('M111 65 L163 82 L175 77', 17),
    limb('M135 132 L219 135', 26), limb('M219 135 L225 168 L243 174', 17),
    hand(123, 68, 100, .88), ghost('M158 116 H250'),
    target(136, 133), detail('M202 136 Q204 153 222 153'), label(196, 105, 'Uyluk hizası', 209, 129)),
  ober: image('Yandan · yan yatış', 'Pelvis sabit. Üstteki bacağın aşağı, addüksiyona doğru inmesi gözlenir.',
    ...supine,
    shape('M127 129Q159 119 187 126Q194 132 185 139L147 144H133Z'),
    shape('M185 127Q200 126 222 134L227 143H180Z'),
    shape('M126 119Q159 107 192 85Q205 78 212 88L246 108L260 104Q268 103 267 112L259 121L241 122Q219 113 203 103Q169 126 138 137Z'),
    ghost('M149 127 Q197 121 245 134'), hand(137, 117, 70, .87),
    hand(203, 96, -137, .83), arrow('M279 91 Q287 116 267 132'),
    label(85, 88, 'Pelvis sabit', 137, 115)),
  trendelenburg: image('Arkadan', 'Tek ayak desteğinde boşta kalan tarafta pelvisin aşağı düşmesine bakılır.',
    detail('M65 170 H263'), backHead(157, 33, 0, .78),
    shape('M144 45 H172 L175 52 Q190 57 199 65 L186 80 L184 111 Q173 128 152 120 L131 110 L131 80 L117 65 Q125 54 142 52Z'),
    limb('M122 66 L111 107 L105 130', 13), limb('M195 65 L210 106 L215 130', 13),
    limb('M140 110 L154 136 L158 161 H176', 19), limb('M175 119 L200 137 L192 151 L203 156', 18),
    detail('M133 105 L182 118'), ghost('M126 104 H195'),
    arrow('M222 92 V119'), label(227, 74, 'Pelvis düşer', 190, 119)),
  lachman: image('Yandan · diz 20–30°', 'Bir el distal femuru sabitler. Diğer el proksimal tibianın arkasından ön yöne doğru çeker.',
    surface('M28 154H291V162H277V178H272V162H44V178H39V162H28Z'),
    shape('M35 128Q66 121 92 118Q123 112 148 102Q160 97 172 104Q186 106 198 111Q223 118 250 127L266 131Q276 127 282 129Q288 133 284 138L271 145Q262 149 252 146L199 135Q183 132 169 124Q163 123 157 129Q119 145 89 150L35 153Z'),
    detail('M87 123Q118 118 143 108M157 108Q166 104 176 111M179 123Q195 126 212 130M252 132Q260 135 265 140'),
    hand(145, 111, 72, .89), hand(187, 131, -110, .91),
    arrow('M207 120 L216 91'), label(46, 80, 'Femur sabit', 143, 107), label(215, 77, 'Tibia öne', 217, 92)),
  knee_anterior: image('Yandan · diz yaklaşık 90°', 'Ayak sabitken proksimal tibia öne çekilir.',
    ...drawerKnee, hand(189, 98, -142, .94), hand(176, 103, -74, .77),
    arrow('M205 90 L231 69'), label(220, 51, 'Tibia öne', 227, 74)),
  knee_posterior: image('Yandan · diz yaklaşık 90°', 'Klinisyenin elleri proksimal tibiayı arkaya doğru iter.',
    ...drawerKnee, hand(191, 98, 124, .94), hand(186, 110, 100, .76),
    resistance('M229 73 L202 94'), label(225, 54, 'Tibia arkaya', 221, 79)),
  posterior_sag: image('Yandan · kalça ve diz yaklaşık 90°', 'Topuk desteklenir. Yerçekimiyle tibianın arkaya çöküp çökmediği gözlenir.',
    ...kneeBase, limb('M91 135 L103 61', 27), limb('M105 75 L234 64', 19),
    limb('M233 66 L243 49 L256 49', 13),
    ghost('M100 60 L235 60'), hand(229, 69, -130, .85),
    arrow('M147 54 V71'), label(118, 26, 'Çökme', 141, 61)),
  valgus: image('Önden · sağ diz', 'Diz içe, ayak dışa yönlendirilir. Dizin iç eklem hattı gözlenir.',
    ...frontKnee, hand(137, 104, 5, .78), hand(154, 146, 177, .82),
    target(166, 104), resistance('M90 103 H124'), resistance('M131 151 H96'), label(173, 94, 'İç eklem hattı', 166, 103)),
  varus: image('Önden · sağ diz', 'Diz dışa, ayak içe yönlendirilir. Dizin dış eklem hattı gözlenir.',
    ...frontKnee, hand(169, 104, 177, .78), hand(141, 146, 8, .82),
    target(139, 104), resistance('M202 103 H173'), resistance('M167 151 H197'), label(45, 85, 'Dış eklem hattı', 139, 104)),
  mcmurray: image('Yandan · sırtüstü', 'Bir el eklem hattını izler. Diğer el tibial rotasyonu yönlendirirken diz açılır.',
    ...kneeBase, limb('M70 134 L135 72', 30), limb('M135 72 L203 135 L228 130', 21),
    hand(145, 75, 159, .91), hand(212, 134, -136, .88),
    ghost('M135 72 L216 95'), arrow('M240 118 Q252 108 235 97'),
    arrow('M201 161 C225 171 247 153 228 144'), label(41, 69, 'Eklem hattı', 137, 81)),
  apley: image('Yandan · yüzüstü', 'Diz bükülü. Topuktan dize doğru kompresyon verilirken tibia döndürülür.',
    ...prone, limb('M135 133 L212 133', 28), limb('M212 133 L211 58 L238 61', 19),
    hand(212, 55, 74, .94), resistance('M218 18 V45'), label(92, 40, 'Kompresyon', 208, 31),
    arrow('M190 93 C208 105 252 86 227 77')),
  clarke: image('Yandan · sırtüstü', 'Klinisyenin eli patellanın üst kenarındadır. Kişiden kuadrisepsini kasması istenir.',
    ...kneeBase, limb('M67 139 L164 124 L272 138', 27),
    shape('M151 118 Q159 107 167 112 Q174 116 169 124 Q160 128 151 123Z'),
    warning('M92 125 Q112 111 139 116 L146 123 Q116 125 93 132Z'),
    hand(147, 115, 108, .93), target(161, 116),
    arrow('M145 91 L108 94'), label(199, 96, 'Patella', 165, 118)),
  ankle_anterior: image('Yandan · ayak bileği', 'Distal bacak sabitlenir. Topuk kavranır ve talusun öne hareketi değerlendirilir.',
    ...angledFoot, hand(169, 105, 80, .95), hand(203, 138, -118, .96),
    arrow('M216 123 L242 102'), target(198, 124), label(222, 84, 'Talus öne', 235, 107)),
  talar_tilt: image('Önden · ayak bileği', 'Bacak sabitlenir. Ayak tabanı içe çevrilirken talusun eğimi gözlenir.',
    limb('M158 40 L160 109', 57),
    shape('M141 103 Q165 105 183 104 Q186 118 190 123 Q200 128 201 134 Q202 143 190 148 L145 164 Q135 168 132 160 Q128 153 134 142 Q143 127 141 103Z'),
    detail('M131 101 Q135 108 145 108 M185 101 Q178 107 171 108'),
    ghost('M118 140 H204'), hand(133, 84, 1, 1.07), hand(184, 149, 168, .99),
    arrow('M218 150 C227 133 220 116 205 106'), target(176, 113), label(225, 92, 'İnversiyon', 210, 111)),
  thompson: image('Yandan · yüzüstü', 'Ayak masa dışında serbesttir. Baldır sıkıldığında normal yanıt ayak bileğinin plantar fleksiyona gitmesidir.',
    surface('M27 143H198V151H191V177H186V151H40V177H35V151H27Z'),
    shape('M36 120Q69 114 97 116Q116 111 139 111Q162 112 188 119L219 123Q228 125 232 134L234 145Q245 151 265 153Q276 154 278 160Q277 167 263 166L234 161Q220 158 215 151Q209 146 191 144L151 143Q131 149 112 143L36 143Z'),
    detail('M124 117Q145 115 161 120M207 133Q218 132 222 141M228 147Q236 151 245 152'),
    ghost('M223 132 Q226 153 216 172 L228 176'),
    hand(146, 115, 70, .95), hand(147, 141, -65, .88),
    resistance('M143 82 V104'), arrow('M224 176 Q255 184 276 169'),
    label(57, 102, 'Baldır sıkılır', 132, 116), label(211, 104, 'Plantar fleksiyon', 259, 154)),
  homans: image('Alt bacak · güvenlik',
    'Şüpheli baldır bölgesi. Homans manevrası DVT değerlendirmesi için kullanılmaz.',
    shape('M101 25H143Q147 58 151 79Q152 103 141 128L133 145Q130 151 136 155L157 163Q168 167 166 172Q163 176 153 176L119 171Q107 168 108 157L113 128Q105 104 101 86Q97 58 101 25Z'),
    detail('M110 51Q121 68 116 91M144 81Q146 99 134 122M118 143Q126 145 128 157'),
    warning('M114 70Q127 60 140 74Q148 91 136 113Q124 121 112 111Q101 94 114 70Z'),
    warning('M221 54 Q225 46 230 54 L260 109 Q264 116 254 116 H196 Q187 116 191 109Z'),
    detail('M225 72 V92 M225 103 V104')),
};
