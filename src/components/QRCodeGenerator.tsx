import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X, QrCode, Palette, Image } from "lucide-react";
import toast from "react-hot-toast";

interface QRCodeGeneratorProps {
    profileUrl: string;
    avatarUrl?: string;
    onClose: () => void;
}

const COLOR_PRESETS = [
    { name: "Classic", fg: "#1f2937", bg: "#ffffff" },
    { name: "Ocean", fg: "#0369a1", bg: "#e0f2fe" },
    { name: "Sunset", fg: "#9a3412", bg: "#fff7ed" },
    { name: "Forest", fg: "#166534", bg: "#f0fdf4" },
    { name: "Purple", fg: "#7e22ce", bg: "#faf5ff" },
    { name: "Rose", fg: "#be123c", bg: "#fff1f2" },
    { name: "Midnight", fg: "#e2e8f0", bg: "#0f172a" },
    { name: "Amber", fg: "#92400e", bg: "#fffbeb" },
];

export function QRCodeGenerator({
    profileUrl,
    avatarUrl,
    onClose,
}: QRCodeGeneratorProps) {
    const [fgColor, setFgColor] = useState("#1f2937");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [includeAvatar, setIncludeAvatar] = useState(false);
    const [qrSize, setQrSize] = useState(200);
    const qrRef = useRef<HTMLDivElement>(null);

    // Responsive QR size
    useEffect(() => {
        const updateSize = () => {
            setQrSize(window.innerWidth < 480 ? 150 : 200);
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const handleDownload = () => {
        const canvas = qrRef.current?.querySelector("canvas");
        if (!canvas) {
            toast.error("Could not generate QR image");
            return;
        }

        const link = document.createElement("a");
        link.download = "linkhub-qr-code.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("QR Code downloaded! 🎉");
    };

    const applyPreset = (preset: (typeof COLOR_PRESETS)[number]) => {
        setFgColor(preset.fg);
        setBgColor(preset.bg);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass-modal rounded-2xl sm:rounded-3xl w-full max-w-lg z-10 animate-modalSlideUp overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header gradient bar */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500 flex-shrink-0" />

                {/* Scrollable content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                    {/* Title row */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg glow-indigo">
                                <QrCode className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white">
                                    QR Code Generator
                                </h2>
                                <p className="text-[10px] sm:text-xs text-white/50">
                                    Share your profile with a scan
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>

                    {/* QR Code Preview */}
                    <div
                        className="flex justify-center mb-4 sm:mb-6"
                        ref={qrRef}
                    >
                        <div
                            className="p-4 sm:p-6 rounded-2xl glass"
                            style={{ backgroundColor: bgColor }}
                        >
                            <QRCodeCanvas
                                value={profileUrl}
                                size={qrSize}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                level="H"
                                includeMargin={true}
                                imageSettings={
                                    includeAvatar && avatarUrl
                                        ? {
                                            src: avatarUrl,
                                            height: qrSize < 200 ? 34 : 44,
                                            width: qrSize < 200 ? 34 : 44,
                                            excavate: true,
                                        }
                                        : undefined
                                }
                            />
                        </div>
                    </div>

                    {/* URL display */}
                    <div className="mb-4 sm:mb-5 px-3 py-2.5 glass rounded-xl">
                        <p className="text-[10px] sm:text-xs text-white/50 text-center truncate font-mono">
                            {profileUrl}
                        </p>
                    </div>

                    {/* Color Presets */}
                    <div className="mb-4 sm:mb-5">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span className="text-xs sm:text-sm font-semibold text-white/80">
                                Color Themes
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className={`group relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-2.5 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${fgColor === preset.fg && bgColor === preset.bg
                                        ? "border-indigo-500 bg-indigo-500/20 shadow-lg"
                                        : "border-white/10 hover:border-white/30 bg-white/5"
                                        }`}
                                >
                                    <div className="flex gap-1">
                                        <div
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm"
                                            style={{ backgroundColor: preset.fg }}
                                        />
                                        <div
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm"
                                            style={{ backgroundColor: preset.bg }}
                                        />
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-medium text-white/50 group-hover:text-white/80">
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="flex-1">
                            <label className="block text-[10px] sm:text-xs font-semibold text-white/60 mb-1.5">
                                Foreground
                            </label>
                            <div className="flex items-center gap-2 p-2 glass rounded-xl">
                                <input
                                    type="color"
                                    value={fgColor}
                                    onChange={(e) => setFgColor(e.target.value)}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-0 cursor-pointer"
                                />
                                <span className="text-[10px] sm:text-xs font-mono text-white/50 uppercase">
                                    {fgColor}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] sm:text-xs font-semibold text-white/60 mb-1.5">
                                Background
                            </label>
                            <div className="flex items-center gap-2 p-2 glass rounded-xl">
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-0 cursor-pointer"
                                />
                                <span className="text-[10px] sm:text-xs font-mono text-white/50 uppercase">
                                    {bgColor}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Profile Picture Toggle */}
                    {avatarUrl && (
                        <div className="mb-4 sm:mb-6 flex items-center justify-between p-3 glass rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Image className="w-4 h-4 text-purple-400" />
                                <span className="text-xs sm:text-sm font-semibold text-white/80">
                                    Include Profile Photo
                                </span>
                            </div>
                            <button
                                onClick={() => setIncludeAvatar(!includeAvatar)}
                                className={`relative w-11 h-6 sm:w-12 sm:h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${includeAvatar
                                    ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                                    : "bg-white/20"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${includeAvatar ? "translate-x-[1.25rem] sm:translate-x-5" : "translate-x-0.5"
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        className="w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base glass-button text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download QR Code
                    </button>
                </div>
            </div>
        </div>
    );
}
