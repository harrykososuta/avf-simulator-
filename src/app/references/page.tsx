'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ReferencesPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
                <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 max-w-4xl mx-auto px-6">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-zinc-100">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Simulator
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <nav className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-zinc-400 hidden sm:inline-block">
                                AVF Hemodynamics Guide
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="container max-w-4xl mx-auto py-10 px-6 space-y-12">
                {/* Intro Section */}
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                            AVF血行動態メカニズムと科学的根拠
                        </h1>
                        <p className="text-zinc-400 max-w-[700px]">
                            The Physics of AVF Maturation and Failure
                        </p>
                    </div>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="pt-6 text-zinc-300 leading-relaxed">
                            <p className="mb-4">
                                本セッションでは、AVFの開存と不全を分ける要因が、単なる血管径や血圧だけでなく、「血流が血管壁に及ぼす物理的な力」にあることを深く掘り下げました。
                            </p>
                            <p>
                                特に、<strong className="text-blue-400">壁せん断応力（WSS）</strong>と<strong className="text-green-400">振動性せん断指数（OSI）</strong>という2つの指標が、血管のリモデリング（成熟）と病的な内膜肥厚（IH）の発生を予測する鍵であることが明らかになりました。
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 1 */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <span className="text-blue-500">1.</span> 血行動態パラメーターの定義と基準値
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg text-blue-300">壁せん断応力 (WSS)</CardTitle>
                                <p className="text-xs text-zinc-500">Wall Shear Stress</p>
                            </CardHeader>
                            <CardContent className="text-sm text-zinc-300 space-y-3">
                                <p>血流が血管内皮細胞を「こする力」であり、血管リモデリングの主要なドライバーです。</p>
                                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                                    <li><strong className="text-zinc-200">正常静脈:</strong> 0.1 ～ 0.6 Pa</li>
                                    <li><strong className="text-zinc-200">AVF作成直後:</strong> 20 Pa以上 (吻合部付近)</li>
                                    <li><strong className="text-zinc-200">成熟後安定値:</strong> 2 ～ 3 Pa (外向きリモデリング後)</li>
                                </ul>
                                <div className="mt-2 bg-zinc-950/50 p-2 rounded text-xs border border-zinc-800">
                                    <span className="text-yellow-500 font-bold">臨床的意義:</span>
                                    <ul className="mt-1 space-y-1">
                                        <li>・高WSS (急性期): 正常。血管拡張のシグナル。</li>
                                        <li>・低WSS (&lt; 1 Pa): 病的。内膜肥厚(IH)のリスク因子。</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg text-green-300">振動性せん断指数 (OSI)</CardTitle>
                                <p className="text-xs text-zinc-500">Oscillatory Shear Index</p>
                            </CardHeader>
                            <CardContent className="text-sm text-zinc-300 space-y-3">
                                <p>血流方向の時間的な「揺れ」や「乱れ」を示す指標（0 ～ 0.5）。</p>
                                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                                    <li><strong className="text-zinc-200">0:</strong> 完全な一方向流（層流）</li>
                                    <li><strong className="text-zinc-200">0.5:</strong> 完全な振動流（逆流を含む）</li>
                                </ul>
                                <div className="mt-2 bg-zinc-950/50 p-2 rounded text-xs border border-zinc-800">
                                    <span className="text-red-500 font-bold">危険域:</span>
                                    <p className="mt-1">OSI &gt; 0.1 ～ 0.2 の領域は「乱れた流れ（Disturbed Flow）」と定義され、狭窄の好発部位となります。</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <span className="text-blue-500">2.</span> AVFの成熟と不全のメカニズム
                    </h2>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-zinc-200">成熟のプロセス（成功のシナリオ）</h3>
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>
                                <strong className="text-zinc-100">トリガー:</strong> 手術直後の「超高WSS」が内皮細胞を刺激し、外向きリモデリング（血管径の拡大）を開始させます。
                            </li>
                            <li>
                                <strong className="text-zinc-100">タイムライン:</strong> 劇的な変化は最初の2週間に集中します。血流量は数週で10倍〜数十倍に増加し、血管径もこの時期に最大の変化を見せます。
                            </li>
                            <li>
                                <strong className="text-zinc-100">成功例の特徴:</strong> 術後1日目の時点で、すでに高い流速とWSS（平均 ~33 Pa）が確保されていることが、その後の良好な成熟を予測します。
                            </li>
                        </ul>
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-zinc-200">狭窄・不全の病態（失敗のシナリオ）</h3>
                        <p className="text-zinc-400">狭窄（内膜肥厚：IH）は、血管内のどこにでも起こるわけではなく、特定の血行力学的環境下で発生します。</p>

                        <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-lg space-y-3">
                            <h4 className="font-bold text-red-400 flex items-center gap-2">
                                <span className="block w-2 h-2 bg-red-500 rounded-full" />
                                IHのホットスポット: 「低WSS かつ 高OSI」の領域
                            </h4>
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300 text-sm">
                                <li>
                                    <strong className="text-zinc-100">発生機序:</strong> 吻合部や屈曲部で血流が血管壁から剥離し、<strong>再循環（渦）</strong>が発生します。この渦の中では、血流が遅く（低WSS）、方向が定まらない（高OSI）ため、内皮細胞が炎症性の表現型に変化し、平滑筋細胞の増殖を招きます。
                                </li>
                                <li>
                                    <strong className="text-zinc-100">初期血栓の関与:</strong> 乱れた流れの下で早期に微小な血栓が形成されることが、その後の偏心性（不均一な）内膜肥厚の発生に必須であると報告されています。
                                </li>
                                <li>
                                    <strong className="text-zinc-100">形状の影響:</strong> 吻合角度は流体力学的には鋭角（30〜45度）が有利とされますが、臨床的には角度そのものよりも、非平面性（ねじれ）急激な屈曲が乱流（高OSI）を引き起こし、狭窄リスクを高めます。
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3 */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
                        <span className="text-blue-500">3.</span> 臨床的評価と応用
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-zinc-200">術前・術後の評価指標</h3>
                            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                                <li><strong className="text-zinc-300">血管径:</strong> 術前の動脈径 &gt; 2.0 mm、静脈径 &gt; 2.5 mm が推奨。</li>
                                <li><strong className="text-zinc-300">早期診断:</strong> 術後早期（1日目〜1週間）のドップラーエコーで血流速度が低い、またはスリル音に高周波成分（乱流）が混じる場合は警告サイン。</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-zinc-200">新しい解析技術</h3>
                            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                                <li><strong className="text-zinc-300">非侵襲的モニタリング:</strong> 非接触の映像解析（スリル波形解析）や聴診音響解析（HLPR）により乱流や狭窄度を推定。</li>
                                <li><strong className="text-zinc-300">CFDの応用:</strong> 患者固有の血管形状を元に流体解析を行い、将来的な狭窄ホットスポットを予測。</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Conclusion */}
                <section className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border border-blue-900/30 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-blue-300 mb-4">結論</h2>
                    <p className="text-zinc-200 leading-relaxed">
                        このチャットを通じて、<strong>「シャント狭窄は単なる詰まりではなく、血流の乱れ（高OSI）と勢いの不足（低WSS）に対する、血管の誤った治癒反応（内膜肥厚）である」</strong>という結論に至りました。
                        臨床現場においては、単に「流れているか」だけでなく、「スムーズに流れているか（層流か、乱流か）」を意識し、早期の血流不全や異常な血流音を捉えることが、アクセスの長期予後改善に繋がります。
                    </p>
                </section>

                {/* References */}
                <section className="space-y-6 pt-8 border-t border-zinc-900">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-300">
                        <BookOpen className="w-5 h-5" />
                        参考文献一覧
                    </h2>
                    <div className="grid gap-4 text-xs text-zinc-500 font-mono bg-zinc-950 p-6 rounded-lg border border-zinc-900 h-96 overflow-y-auto">
                        {REFERENCES.map((ref, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-zinc-600 shrink-0">[{i + 1}]</span>
                                <span>
                                    <strong className="text-zinc-400">{ref.authors}</strong> ({ref.year}) <br />
                                    <span className="text-zinc-300 italic">{ref.title}</span> <br />
                                    {ref.journal}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

const REFERENCES = [
    { authors: "Colley E, et al.", year: "2022", title: "A longitudinal study of the arterio-venous fistula maturation of a single patient over 15 weeks.", journal: "Biomechanics and Modeling in Mechanobiology" },
    { authors: "Wang P, et al.", year: "2024", title: "ECAVG Delamination: A Cause of Early Cannulation Arteriovenous Graft Dysfunction in Hemodialysis Patients.", journal: "Blood Purification" },
    { authors: "Bozzetto M, et al.", year: "2022", title: "Arteriovenous fistula creation with VasQ™ device: A feasibility study to reveal hemodynamic implications.", journal: "The Journal of Vascular Access (2024)" },
    { authors: "Chemla E, et al.", year: "2016", title: "Arteriovenous fistula construction with the VasQ™ external support device: a pilot study.", journal: "The Journal of Vascular Access" },
    { authors: "Dolmatch B, et al.", year: "AVeNEW", title: "Prospective, Randomized, Multicenter Clinical Trial Comparing a Self-Expanding Covered Stent to Percutaneous Transluminal Angioplasty for the Treatment of Upper Extremity Hemodialysis Arteriovenous Fistula Stenosis.", journal: "(AVeNEW Trial)" },
    { authors: "Michas V, et al.", year: "2023", title: "Multiparametric ultrasound for upper extremity dialysis access evaluation.", journal: "Ultrasonography" },
    { authors: "Olewnik Ł, et al.", year: "-", title: "Morphological variations of the brachial artery and its clinical significance: a systematic review.", journal: "(Derived from snippets)" },
    { authors: "Drouven JW, et al.", year: "2023", title: "Differences in shuntflow (Qa), cardiac function and mortality between hemodialysis patients with a lower-arm fistula, an upper-arm fistula, and an arteriovenous graft.", journal: "The Journal of Vascular Access" },
    { authors: "Malik J, et al.", year: "2022", title: "Arteriovenous Hemodialysis Access Stenosis Diagnosed by Duplex Doppler Ultrasonography: A Review.", journal: "Diagnostics" },
    { authors: "Northrup H, et al.", year: "2022", title: "Differential hemodynamics between arteriovenous fistulas with or without intervention before successful use.", journal: "Frontiers in Cardiovascular Medicine" },
    { authors: "Zhang W, et al.", year: "2022", title: "Endothelial TGF-β Signaling Regulates Endothelial-Mesenchymal Transition During Arteriovenous Fistula Remodeling in Mice With Chronic Kidney Disease.", journal: "Arteriosclerosis, Thrombosis, and Vascular Biology" },
    { authors: "Gonzalez TV, et al.", year: "2023", title: "Multimodality imaging evaluation of arteriovenous fistulas and grafts: a clinical practice review.", journal: "Cardiovascular Diagnosis and Therapy" },
    { authors: "Shahverdyan R, et al.", year: "2022", title: "Multicenter European real-world utilization of VasQ anastomotic external support device for arteriovenous fistulae.", journal: "Journal of Vascular Surgery" },
    { authors: "Ma S, et al.", year: "2022", title: "Intimal hyperplasia of arteriovenous fistula.", journal: "Annals of Vascular Surgery" },
    { authors: "Browne LD, et al.", year: "2015", title: "The Role of Shear Stress in Arteriovenous Fistula Maturation and Failure: A Systematic Review.", journal: "PLOS ONE" },
    { authors: "Jodko D, Barber T.", year: "2024", title: "Fluid-structure interaction in the longitudinal study of arteriovenous fistula maturation.", journal: "Scientific Reports" },
    { authors: "Bellos I, et al.", year: "-", title: "Preoperative ultrasound mapping before arteriovenous fistula creation: an updated systematic review and meta-analysis.", journal: "(Derived from snippets)" },
    { authors: "Meng L, et al.", year: "2025", title: "Risk score for the prediction of arteriovenous fistula maturation.", journal: "Journal of Vascular Surgery" },
    { authors: "Yan R, et al.", year: "2024", title: "The Pathological Mechanisms and Therapeutic Molecular Targets in Arteriovenous Fistula Dysfunction.", journal: "International Journal of Molecular Sciences" },
    { authors: "Fu CM, et al.", year: "2024", title: "Health-care Professionals’ Perspectives on Ultrasound Evaluation of Arteriovenous Hemodialysis Fistula: A Narrative Review.", journal: "Journal of Medical Ultrasound" },
    { authors: "Nantakool S, et al.", year: "2021", title: "A randomized controlled trial of the effect of postoperative hand exercise training on arteriovenous fistula maturation in patients with chronic kidney disease.", journal: "Journal of Vascular Surgery" },
    { authors: "Pirozzi N, et al.", year: "2021", title: "Monitoring the Patient Following Radio-Cephalic Arteriovenous Fistula Creation: Current Perspectives.", journal: "Vascular Health and Risk Management" },
    { authors: "Bai H, et al.", year: "2024", title: "Early thrombus formation is required for eccentric and heterogeneous neointimal hyperplasia under disturbed flow.", journal: "Journal of Thrombosis and Haemostasis" },
    { authors: "Pratama D, et al.", year: "2023", title: "Brachiocephalic arteriovenous fistula maturation in end stage renal disease: The role of intraoperative brachial artery blood flow rate and peak systolic velocity.", journal: "SAGE Open Medicine" },
    { authors: "Haładaj R, et al.", year: "2018", title: "The High Origin of the Radial Artery (Brachioradial Artery): Its Anatomical Variations, Clinical Significance, and Contribution to the Blood Supply of the Hand.", journal: "BioMed Research International" },
    { authors: "Wongchadakul P, et al.", year: "2024", title: "Comparative analysis of RADAR vs. conventional techniques for AVF maturation in patients with blood viscosity and vessel elasticity-related diseases through fluid-structure interaction modeling: Anemia, hypertension, and diabetes.", journal: "PLOS ONE" },
    { authors: "Hammes M.", year: "2015", title: "Hemodynamic and Biologic Determinates of Arteriovenous Fistula Outcomes in Renal Failure Patients.", journal: "BioMed Research International" },
    { authors: "Suraj HS, et al.", year: "2024", title: "Role of Doppler Evaluation in Assessing the Maturation of the Arteriovenous Fistula for Hemodialysis: An Observational Study.", journal: "Cureus" },
    { authors: "Wakabayashi M, et al.", year: "2022", title: "Evaluation of venocutaneous fistula as vascular access for hemodialysis: Examination of 46 limbs of 40 patients.", journal: "The Journal of Vascular Access" },
    { authors: "Sharbidre KG, et al.", year: "2023", title: "Hemodialysis Access: US for Preprocedural Mapping and Evaluation of Maturity and Access Dysfunction.", journal: "RadioGraphics" },
    { authors: "Fitts MK, et al.", year: "2014", title: "Hemodynamic Shear Stress and Endothelial Dysfunction in Hemodialysis Access.", journal: "The Open Urology & Nephrology Journal" },
    { authors: "Iakovidis et al.", year: "2023", title: "Comparison of Contrast Venography and Intravenous Ultrasound in Hemodialysis Arteriovenous Access Dysfunction.", journal: "Kidney International Reports" },
    { authors: "He Y, et al.", year: "2021", title: "Analyses of hemodialysis arteriovenous fistula geometric configuration and its associations with maturation and reintervention.", journal: "Journal of Vascular Surgery" },
    { authors: "Taghavi M, et al.", year: "2025", title: "Antiphospholipid antibodies positivity as a potential risk factor for restenosis following arteriovenous fistula stenting in hemodialysis patients: a pilot study.", journal: "Frontiers in Medicine" },
    { authors: "Kane J, et al.", year: "2024", title: "The Role of Cardio-Renal Inflammation in Deciding the Fate of the Arteriovenous Fistula in Haemodialysis Therapy.", journal: "Cells" },
    { authors: "Brahmbhatt A, et al.", year: "2016", title: "The molecular mechanisms of hemodialysis vascular access failure.", journal: "Kidney International" },
    { authors: "Du Y, et al.", year: "2020", title: "Wall Shear Stress Measurements Based on Ultrasound Vector Flow Imaging.", journal: "Journal of Ultrasound in Medicine" },
    { authors: "Iwai R, et al.", year: "2024", title: "Reliable Stenosis Detection Based on Thrill waveform Analysis Using Non-Contact Arteriovenous Fistula Imaging.", journal: "Sensors" },
];
