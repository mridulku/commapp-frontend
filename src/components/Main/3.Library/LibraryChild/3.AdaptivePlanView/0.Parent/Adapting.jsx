import React, { useState } from "react";
import axios from "axios";
import { Box, Typography, Button, TextField } from "@mui/material";

/**
 * If value looks like a Firestore timestamp object, return a formatted string; else null.
 */
function tryFormatTimestamp(val) {
  if (!val) return null;
  if (typeof val === "object") {
    const maybeSec = val.seconds ?? val._seconds;
    if (typeof maybeSec === "number") {
      return new Date(maybeSec * 1000).toLocaleString();
    }
  }
  return null;
}

/**
 * Recursively displays plan fields in collapsible <details> blocks
 */
function CollapsibleField({ fieldKey, value, depth = 0 }) {
  const asTimestamp = tryFormatTimestamp(value);
  if (asTimestamp) {
    return (
      <Box sx={{ ml: depth * 2 }}>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          <strong>{fieldKey}:</strong> {asTimestamp}
        </Typography>
      </Box>
    );
  }

  // If array => <details> with each item recursively
  if (Array.isArray(value)) {
    return (
      <Box sx={{ ml: depth * 2 }}>
        <details>
          <summary>
            <Typography variant="body2" component="span">
              <strong>{fieldKey}:</strong> [Array, length {value.length}]
            </Typography>
          </summary>
          <Box sx={{ mt: 1, ml: 2 }}>
            {value.map((item, idx) => (
              <CollapsibleField
                key={idx}
                fieldKey={`[${idx}]`}
                value={item}
                depth={depth + 1}
              />
            ))}
          </Box>
        </details>
      </Box>
    );
  }

  // If object => <details> with sub-fields
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <Box sx={{ ml: depth * 2 }}>
          <Typography variant="body2">
            <strong>{fieldKey}:</strong> {{}} (empty object)
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ ml: depth * 2 }}>
        <details>
          <summary>
            <Typography variant="body2" component="span">
              <strong>{fieldKey}:</strong> {"{object}"}
            </Typography>
          </summary>
          <Box sx={{ mt: 1, ml: 2 }}>
            {keys.map((k) => (
              <CollapsibleField
                key={k}
                fieldKey={k}
                value={value[k]}
                depth={depth + 1}
              />
            ))}
          </Box>
        </details>
      </Box>
    );
  }

  // Otherwise, primitive => simple line
  return (
    <Box sx={{ ml: depth * 2 }}>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        <strong>{fieldKey}:</strong> {String(value)}
      </Typography>
    </Box>
  );
}

/**
 * Adapting component:
 *  - Expects { userId, planId, plan }
 *  - Renders the plan doc in collapsible form
 *  - Requires a single session index in the text field
 *  - Calls POST /api/markPlanAsAdapted with { planId, userId, sessionIndex }
 */
export default function Adapting({ userId, plan, planId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionInput, setSessionInput] = useState("");

  if (!plan) {
    return (
      <Typography variant="body1" sx={{ color: "#fff", mt: 2 }}>
        No plan object provided.
      </Typography>
    );
  }

  const topKeys = Object.keys(plan);

  /**
   * On click => parse one session index => POST to server
   */
  async function handleAdaptSingleSession() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Must parse exactly one numeric index
      const indexNum = parseInt(sessionInput.trim(), 10);
      if (isNaN(indexNum)) {
        setError("Please enter a valid numeric session index (e.g. 0, 1, 2...)");
        return;
      }

      // Build request body
      const bodyPayload = {
        planId,
        userId,
        sessionIndex: indexNum,
      };

      // Call your updated route that expects a single sessionIndex
      const res = await axios.post("http://localhost:3001/api/markPlanAsAdapted", bodyPayload);

      setSuccess("Plan doc adapted for sessionIndex=" + indexNum);
    } catch (err) {
      console.error("Error adapting plan doc =>", err);
      setError(err?.response?.data?.error || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ color: "#fff", mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Adapting View (Raw Plan)
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>planId:</strong> {String(planId)} <br />
        <strong>userId:</strong> {String(userId)}
      </Typography>

      {/* Render plan doc in collapsible blocks */}
      {topKeys.map((key) => (
        <CollapsibleField key={key} fieldKey={key} value={plan[key]} />
      ))}

      {/* Single session index input */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Enter single session index (e.g. 0,1,2...) :
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
          placeholder="0"
          sx={{ mb: 2, backgroundColor: "#fff", color: "#000", width: "200px" }}
        />

        <div>
          <Button
            variant="contained"
            onClick={handleAdaptSingleSession}
            disabled={loading}
          >
            {loading ? "Adapting..." : "Adapt Single Session"}
          </Button>
        </div>

        {error && (
          <Typography variant="body2" sx={{ mt: 1, color: "red" }}>
            Error: {error}
          </Typography>
        )}
        {success && (
          <Typography variant="body2" sx={{ mt: 1, color: "lime" }}>
            {success}
          </Typography>
        )}
      </Box>
    </Box>
  );
}