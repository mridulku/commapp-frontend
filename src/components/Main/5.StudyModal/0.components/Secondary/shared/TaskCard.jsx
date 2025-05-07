import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import Loader from "./Loader";                // ⬅ added

/* ---------- colours ---------- */
const CLR_COMPLETE = "#4CAF50";
const CLR_PARTIAL  = "#FFB300";
const CLR_NONE     = "#E53935";

/* ---------- tiny helper row ---------- */
function Row({ icon, label, bold = false, color = "#fff" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 0.3 }}>
      <Box sx={{ width: 18, textAlign: "center", mr: 0.6 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: bold ? 700 : 400,
          color,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/* ---------- optional lock overlay ---------- */
function Locked() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        color: "#fff",
        fontWeight: 700,
        borderRadius: 2,
      }}
    >
      LOCKED
    </Box>
  );
}

export default function TaskCard({ t, onOpen, selected = false }) {
  const { meta, status, deferred } = t;

  /* ---------- color presets ---------- */
  const border =
    status === "completed" ? CLR_COMPLETE :
    status === "partial"   ? CLR_PARTIAL  :
                             CLR_NONE;
  const bg =
    status === "completed" ? "rgba(76,175,80,.15)"  :
    status === "partial"   ? "rgba(255,152,0,.15)"  :
                             "rgba(229,57,53,.15)";

  const badge =
    status === "completed" ? "Completed" :
    status === "partial"   ? "Partially done" :
    status === "loading"   ? "Loading…" :
                             "Not started";

  const conceptTip = t.total
    ? (
        <Box sx={{ fontSize: 12 }}>
          {t.conceptList.map((c) => (
            <Box key={c.name}>
              {c.ok ? "✅" : "❌"} {c.name}
            </Box>
          ))}
        </Box>
      )
    : "No concepts";

  return (
    <Box
      onClick={onOpen}
      sx={{
        position: "relative",
        p: 1.2,
        cursor: "pointer",
        bgcolor: bg,
        border: `2px solid ${border}`,
        boxSizing: "border-box",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        transition: "transform .15s",
        "&:hover": { transform: "translateY(-3px)" },
      }}
    >
      {t.locked && <Locked />}

      {selected && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            right: 6,
            transform: "translateY(-50%)",
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: "#FFD700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 4px rgba(0,0,0,.4)",
            pointerEvents: "none",
          }}
        >
          <ArrowRightAltIcon sx={{ fontSize: 18, color: "#000" }} />
        </Box>
      )}

      {/* ---------- header ---------- */}
      <Tooltip title={t.subch}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: ".88rem",
            color: meta.color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: 0.6,
          }}
        >
          {t.subch}
        </Typography>
      </Tooltip>

      {/* ---------- status badge ---------- */}
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: border }}>
        {badge}
      </Typography>
      {deferred && (
        <Typography sx={{ fontSize: 11, color: "#ccc" }}>
          Deferred to next day
        </Typography>
      )}

      {/* ---------- common rows ---------- */}
      <Row icon={meta.icon} label={meta.label} bold color={meta.color} />
      <Row icon="📚" label={t.book} />
      <Row icon="📄" label={t.chapter} />
      <Row icon="⏱" label={`${t.spentMin}/${t.expMin} min`} />

      {/* ---------- CONTENT AREA ---------- */}
      {meta.label !== "Read" && (
        <>
          <Box sx={{ flex: 1 }} />

          {/* --- A. Loading placeholder --- */}
          {status === "loading" && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="indeterminate"
                sx={{
                  height: 6,
                  borderRadius: 2,
                  bgcolor: "#333",
                  "& .MuiLinearProgress-bar": { bgcolor: meta.color },
                }}
              />
              <Typography
                sx={{ mt: 0.4, fontSize: 11, color: "#ccc", textAlign: "center" }}
              >
                Fetching status…
              </Typography>
            </Box>
          )}

          {/* --- B. Real progress once fetched --- */}
          {status !== "loading" && (
            <>
              <LinearProgress
                variant="determinate"
                value={t.pct}
                sx={{
                  height: 6,
                  borderRadius: 2,
                  bgcolor: "#333",
                  "& .MuiLinearProgress-bar": { bgcolor: meta.color },
                }}
              />
              <Box
                sx={{
                  mt: 0.4,
                  fontSize: 11,
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#fff",
                }}
              >
                <span>{t.pct}%</span>
                <Tooltip title={conceptTip} arrow>
                  <span style={{ cursor: "help", textDecoration: "underline" }}>
                    {t.mastered}/{t.total} concepts
                  </span>
                </Tooltip>
              </Box>

              {/* attempt buckets */}
              <Box sx={{ mt: 0.8, fontSize: 11, lineHeight: 1.35 }}>
                <div>
                  <strong>Attempts so far:&nbsp;</strong>
                  {t.attemptsSoFar.length ? t.attemptsSoFar.join(", ") : "—"}
                </div>
                {t.nextActivity && (
                  <div>
                    <strong>Next activity:&nbsp;</strong>{t.nextActivity}
                  </div>
                )}
                {t.attBefore.length + t.attToday.length + t.attAfter.length > 0 && (
                  <Box sx={{ mt: 0.6 }}>
                    <div>
                      <strong>Before:&nbsp;</strong>
                      {t.attBefore.length ? t.attBefore.join(", ") : "—"}
                    </div>
                    <div>
                      <strong>This day:&nbsp;</strong>
                      {t.attToday.length ? t.attToday.join(", ") : "—"}
                    </div>
                    <div>
                      <strong>Later:&nbsp;</strong>
                      {t.attAfter.length ? t.attAfter.join(", ") : "—"}
                    </div>
                  </Box>
                )}
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}