import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

// Phage SVG as inline string for the edge function
const PhageSvg = () => (
  <svg
    width="180"
    height="180"
    viewBox="0 0 200 200"
    fill="none"
    style={{ filter: "drop-shadow(0 0 30px rgba(34,197,94,0.4))" }}
  >
    <defs>
      <linearGradient id="capsidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="tailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
    {/* Capsid */}
    <polygon
      points="100,15 145,40 145,85 100,110 55,85 55,40"
      fill="url(#capsidGrad)"
      stroke="#15803d"
      strokeWidth="2"
    />
    {/* DNA inside */}
    <ellipse cx="80" cy="55" rx="8" ry="4" fill="#bbf7d0" opacity="0.6" />
    <ellipse cx="120" cy="55" rx="8" ry="4" fill="#bbf7d0" opacity="0.6" />
    <ellipse cx="90" cy="70" rx="6" ry="3" fill="#dcfce7" opacity="0.6" />
    <ellipse cx="110" cy="70" rx="6" ry="3" fill="#dcfce7" opacity="0.6" />
    {/* Collar */}
    <rect x="90" y="108" width="20" height="8" fill="#16a34a" rx="2" />
    {/* Tail */}
    <rect x="92" y="116" width="16" height="45" fill="url(#tailGrad)" rx="2" />
    {/* Baseplate */}
    <polygon points="85,161 100,168 115,161 115,165 100,172 85,165" fill="#22c55e" />
    {/* Tail fibers */}
    <path d="M88 168 Q75 175 60 185" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    <path d="M85 170 Q70 180 55 195" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    <path d="M90 172 Q80 185 70 200" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    <path d="M112 168 Q125 175 140 185" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    <path d="M115 170 Q130 180 145 195" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    <path d="M110 172 Q120 185 130 200" stroke="#22c55e" strokeWidth="2.5" fill="none" />
    {/* Fiber tips */}
    <circle cx="60" cy="185" r="3" fill="#34d399" />
    <circle cx="55" cy="195" r="3" fill="#34d399" />
    <circle cx="70" cy="200" r="3" fill="#34d399" />
    <circle cx="140" cy="185" r="3" fill="#34d399" />
    <circle cx="145" cy="195" r="3" fill="#34d399" />
    <circle cx="130" cy="200" r="3" fill="#34d399" />
  </svg>
);

// DNA sequence for decoration
const dnaSequence = "ATGCAGTCGATCGATGCA";
const nucleotideColors: Record<string, string> = {
  A: "#22c55e",
  T: "#ef4444",
  G: "#f59e0b",
  C: "#3b82f6",
};

interface OgParams {
  title?: string;
  description?: string;
  phage?: string;
  type?: "default" | "phage" | "analysis";
}

export default async function handler(req: Request): Promise<ImageResponse> {
  const url = new URL(req.url);
  const params: OgParams = {
    title: url.searchParams.get("title") || "Phage Explorer",
    description:
      url.searchParams.get("description") ||
      "Visualize and analyze bacteriophage genomes with color-coded sequences, 3D structures, and 40+ analysis tools.",
    phage: url.searchParams.get("phage") || undefined,
    type: (url.searchParams.get("type") as OgParams["type"]) || "default",
  };

  // Determine dimensions based on format query param
  const format = url.searchParams.get("format");
  const isTwitter = format === "twitter";
  const width = 1200;
  const height = isTwitter ? 600 : 630;

  // Customize for specific phage pages
  let displayTitle = params.title;
  let displayDescription = params.description;
  let badgeText = "BIOINFORMATICS TOOL";

  if (params.phage) {
    displayTitle = `${params.phage} — Phage Explorer`;
    displayDescription = `Explore the ${params.phage} bacteriophage genome with interactive visualization, 3D structure, and detailed analysis.`;
    badgeText = "PHAGE GENOME";
  }

  if (params.type === "analysis") {
    badgeText = "GENOME ANALYSIS";
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #0a0a12 0%, #0f1218 35%, #121620 65%, #0a0a12 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Background orbs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -50,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          <PhageSvg />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <span
                style={{
                  color: "#22c55e",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  display: "flex",
                }}
              >
                {badgeText}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: params.phage ? 56 : 72,
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1.1,
                margin: 0,
                display: "flex",
              }}
            >
              {displayTitle}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: 22,
                color: "#94a3b8",
                fontWeight: 400,
                maxWidth: 550,
                lineHeight: 1.4,
                margin: 0,
                display: "flex",
              }}
            >
              {displayDescription}
            </p>
          </div>
        </div>

        {/* DNA sequence decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 55,
            display: "flex",
            gap: 4,
            opacity: 0.6,
          }}
        >
          {dnaSequence.split("").map((nt, i) => (
            <span
              key={i}
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: "4px 6px",
                color: nucleotideColors[nt] || "#94a3b8",
                display: "flex",
              }}
            >
              {nt}
            </span>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            color: "#64748b",
            fontSize: 16,
            fontWeight: 500,
            display: "flex",
          }}
        >
          phage-explorer.org
        </div>

        {/* Bottom gradient bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent 0%, #22c55e 20%, #3b82f6 40%, #f59e0b 60%, #ef4444 80%, transparent 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width,
      height,
    }
  );
}
