"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
    ChevronLeft,
    ChevronRight,
    Settings,
    Home,
    List,
    MessageSquare,
    Share2,
    Crown,
    Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ReaderSettingsPanel, {
    useReaderSettings,
    type ReaderTheme,
} from "@/components/reader/ReaderSettings"

// Demo data - akan diganti dengan fetch dari database
const chapter = {
    id: "ch4",
    novelId: "1",
    novelTitle: "The Beginning After The End",
    novelSlug: "the-beginning-after-the-end",
    number: 447,
    title: "The Calm Before Storm",
    content: `Matahari pagi menyinari lembah yang tenang, memancarkan kehangatan lembut yang menembus dedaunan pepohonan kuno. Arthur berdiri di tepi tebing, menatap pemandangan yang membentang di hadapannya dengan tatapan yang sulit dibaca.

"Kau sudah bangun sejak fajar," suara familiar terdengar dari belakangnya. Sylvie mendarat dengan anggun di bahunya, sisik-sisik emasnya berkilauan tertimpa sinar matahari.

Arthur mengangguk pelan. "Tidak bisa tidur. Sesuatu terasa... berbeda. Seperti keheningan sebelum badai."

Naga kecil itu meringkuk di lehernya, mencoba memberikan kenyamanan. "Entah apa yang akan terjadi, kita akan menghadapinya bersama."

Senyum tipis tersungging di bibir Arthur. Meski telah melewati dua kehidupan, ada saat-saat seperti ini yang membuatnya bersyukur. Bukan kekuatan atau kehormatan - tapi ikatan dengan mereka yang dicintainya.

"Kau tahu, Sylv," ujarnya pelan, "dulu aku mengira kekuatan adalah segalanya. Bahwa menjadi yang terkuat adalah tujuan akhir. Tapi sekarang..."

Ia menoleh ke belakang, dimana tenda-tenda perkemahan mulai menunjukkan tanda-tanda kehidupan. Suara tawa dan obrolan pagi mulai terdengar. Curtis sedang meregangkan tubuhnya, sementara Kathyln tampak sibuk dengan buku tebalnya seperti biasa.

"Sekarang aku mengerti bahwa kekuatan sejati terletak pada apa yang ingin kita lindungi," lanjutnya.

Sylvie mendengkur pelan, seolah menyetujui.

Tiba-tiba, udara di sekitar mereka bergetar. Arthur langsung waspada, instingnya yang diasah selama puluhan tahun pertempuran meneriakkan peringatan.

"Kau merasakannya juga?" tanyanya.

"Ya," jawab Sylvie, mata emasnya menyipit. "Mana di udara... tidak stabil. Sesuatu besar akan terjadi."

Arthur menghela napas. Ketenangan tidak pernah bertahan lama dalam hidupnya. Tapi kali ini, ia siap. Lebih siap dari sebelumnya.

"Kalau begitu," katanya sambil mengaktifkan aura pertempurannya, energi biru keemasan mulai menyelimuti tubuhnya, "sebaiknya kita bersiap untuk menyambutnya."

Dengan langkah mantap, ia berjalan menuju perkemahan. Ada banyak yang harus dipersiapkan, dan waktu semakin menipis.

Di kejauhan, awan gelap mulai berkumpul di cakrawala - pertanda badai yang akan datang. Badai yang mungkin akan mengubah segalanya.

Tapi Arthur Leywin tidak gentar. Karena dalam kegelapan, dialah yang akan menjadi cahaya.

---

Sore harinya, semua orang berkumpul di tenda komando. Wajah-wajah serius menghiasi ruangan ketika Arthur membuka gulungan peta.

"Laporan terakhir menunjukkan pergerakan pasukan Alacryans di tiga titik utama," jelasnya sambil menunjuk lokasi-lokasi di peta. "Mereka tidak bergerak secara acak. Ada koordinasi."

Virion, kakeknya yang masih gagah meski usianya sudah lanjut, mengangguk. "Pola penyerangan terorganisir. Mereka merencanakan sesuatu yang besar."

"Pertanyaannya adalah apa," timpal Varay, suaranya dingin seperti esnya.

Arthur menutup matanya sejenak, mencoba merasakan aliran mana di sekitarnya. Ada sesuatu yang familiar... sesuatu yang membuatnya merinding.

"Bukan apa," ujarnya akhirnya, membuka mata dengan ekspresi serius. "Tapi siapa."

"Apa maksudmu?" tanya Tessia, kekhawatiran jelas tergambar di wajah cantiknya.

Arthur menatapnya lembut sebelum menjawab, "Asura. Mereka akhirnya turun tangan langsung."

Keheningan mencekam menguasai ruangan. Semua orang tahu apa artinya itu.

"Kalau begitu," Virion berkata, memecah kesunyian, "ini bukan lagi pertempuran biasa. Ini perang."

Arthur mengangguk. "Dan kita harus siap untuk menang."

Ia menatap satu per satu wajah orang-orang di ruangan itu - keluarga, teman, sekutu. Mereka semua bergantung padanya. Dan ia tidak akan mengecewakan mereka.

"Besok pagi, kita bergerak. Istirahatlah malam ini. Karena mulai fajar..." ia menarik napas dalam, "tidak ada jalan kembali."

Satu per satu mereka bubar, masing-masing membawa beban di pundaknya. Tapi juga tekad yang sama kuatnya.

Arthur adalah yang terakhir meninggalkan tenda. Langit malam berbintang menyapanya, indah namun dingin.

"Apa pun yang terjadi besok," bisiknya pada bintang-bintang, "aku akan melindungi mereka semua."

Dan di kedalaman jiwanya, kekuatan kuno yang tertidur mulai menggeliat. Bersiap untuk kebangkitan.`,
    isPremium: false,
    views: 5400,
    prevChapter: { id: "ch5", number: 446, title: "Training Arc Ends" },
    nextChapter: { id: "ch3", number: 448, title: "Secrets Revealed", isPremium: true, coinCost: 10 },
}

const fonts = {
    sans: "Inter, system-ui, sans-serif",
    serif: "Merriweather, Georgia, serif",
    mono: "JetBrains Mono, monospace",
}

export default function ReaderPage({ params }: { params: { chapterId: string } }) {
    const { settings, setSettings } = useReaderSettings()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isHeaderVisible, setIsHeaderVisible] = useState(true)
    const [progress, setProgress] = useState(0)
    const lastScrollY = useRef(0)
    const contentRef = useRef<HTMLDivElement>(null)

    // Auto-hide header on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Calculate reading progress
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollProgress = (currentScrollY / (documentHeight - windowHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollProgress)))

            // Hide/show header based on scroll direction
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsHeaderVisible(false)
            } else {
                setIsHeaderVisible(true)
            }
            lastScrollY.current = currentScrollY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Get theme classes
    const themeClasses = {
        light: "bg-white text-[#1e293b]",
        sepia: "bg-[#f5f0e6] text-[#5c4b37]",
        dark: "bg-[#1a1a2e] text-[#e2e8f0]",
    }

    const headerBgClasses = {
        light: "bg-white/95",
        sepia: "bg-[#f5f0e6]/95",
        dark: "bg-[#1a1a2e]/95",
    }

    return (
        <div className={cn("min-h-screen", themeClasses[settings.theme])}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/10">
                <div
                    className="h-full bg-[var(--color-primary)] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <header
                className={cn(
                    "fixed top-1 left-0 right-0 z-40 backdrop-blur-md transition-transform duration-300",
                    headerBgClasses[settings.theme],
                    isHeaderVisible ? "translate-y-0" : "-translate-y-full"
                )}
            >
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/novel/${chapter.novelSlug}`}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium truncate max-w-[200px]">
                                {chapter.novelTitle}
                            </p>
                            <p className="text-xs opacity-70">
                                Chapter {chapter.number}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            href="/"
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Beranda"
                        >
                            <Home className="w-5 h-5" />
                        </Link>
                        <Link
                            href={`/novel/${chapter.novelSlug}`}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Daftar Chapter"
                        >
                            <List className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="Pengaturan"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 pt-20 pb-32">
                {/* Chapter Title */}
                <div className="mb-8 text-center">
                    <p className="text-sm opacity-70 mb-2">Chapter {chapter.number}</p>
                    <h1 className="text-2xl font-bold">{chapter.title}</h1>
                </div>

                {/* Chapter Content */}
                <article
                    ref={contentRef}
                    className="reader-content"
                    style={{
                        fontSize: `${settings.fontSize}px`,
                        fontFamily: fonts[settings.fontFamily],
                        lineHeight: settings.lineHeight,
                    }}
                >
                    {chapter.content.split("\n\n").map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </article>

                {/* End of Chapter */}
                <div className="text-center my-12 py-8 border-t border-b border-current/10">
                    <p className="text-lg font-medium mb-2">— Akhir Chapter {chapter.number} —</p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <button className="btn btn-ghost text-sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Komentar
                        </button>
                        <button className="btn btn-ghost text-sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Bagikan
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <footer
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md transition-transform duration-300",
                    headerBgClasses[settings.theme],
                    isHeaderVisible ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Prev Chapter */}
                    {chapter.prevChapter ? (
                        <Link
                            href={`/read/${chapter.prevChapter.id}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm">
                                Ch. {chapter.prevChapter.number}
                            </span>
                        </Link>
                    ) : (
                        <div className="w-20" />
                    )}

                    {/* Chapter Number */}
                    <div className="text-center">
                        <span className="font-medium">Chapter {chapter.number}</span>
                    </div>

                    {/* Next Chapter */}
                    {chapter.nextChapter ? (
                        chapter.nextChapter.isPremium ? (
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-colors"
                            >
                                <span className="hidden sm:inline text-sm">
                                    Ch. {chapter.nextChapter.number}
                                </span>
                                <Crown className="w-4 h-4" />
                                <span className="text-sm font-medium">{chapter.nextChapter.coinCost}</span>
                                <Coins className="w-4 h-4" />
                            </button>
                        ) : (
                            <Link
                                href={`/read/${chapter.nextChapter.id}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/10 transition-colors"
                            >
                                <span className="hidden sm:inline text-sm">
                                    Ch. {chapter.nextChapter.number}
                                </span>
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        )
                    ) : (
                        <div className="w-20" />
                    )}
                </div>
            </footer>

            {/* Settings Panel */}
            <ReaderSettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </div>
    )
}
