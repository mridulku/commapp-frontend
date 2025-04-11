import React, { useState } from "react";
import axios from "axios";
import { Box, Typography, Button, TextField } from "@mui/material";

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
 * - Receives { userId, plan, planId, ... } props
 * - Renders the plan doc in a collapsible manner
 * - Has a text field to specify session indexes (comma separated)
 * - On click, calls `POST /api/markPlanAsAdapted` with { planId, userId, sessionIndexes }
 */
export default function Adapting({
  userId,
  plan,
  planId
}) {
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [sessionInput, setSessionInput] = useState("");

  if (!plan) {
    return (
      <Typography variant="body1" sx={{ color: "#fff", mt: 2 }}>
        No plan object provided.
      </Typography>
    );
  }

  const topKeys = Object.keys(plan);

  async function handleCopyPlan() {
    try {
      setCopyLoading(true);
      setCopyError("");
      setCopySuccess("");

      // If user typed something like "0,2,4", parse it into an array of numbers [0,2,4]
      let sessionIndexes = [];
      if (sessionInput.trim().length > 0) {
        sessionIndexes = sessionInput
          .split(",")
          .map(str => str.trim())
          .map(Number)
          .filter(n => !isNaN(n));
      }

      const bodyPayload = {
        planId,
        userId
      };
      // If the array is non-empty, attach it
      if (sessionIndexes.length > 0) {
        bodyPayload.sessionIndexes = sessionIndexes;
      }

      const res = await axios.post("http://localhost:3001/api/markPlanAsAdapted", bodyPayload);

      setCopySuccess("Plan doc successfully adapted!");
    } catch (err) {
      console.error("Error copying plan doc =>", err);
      setCopyError(err?.response?.data?.error || err.message || "Unknown error");
    } finally {
      setCopyLoading(false);
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

      {topKeys.map((key) => (
        <CollapsibleField key={key} fieldKey={key} value={plan[key]} />
      ))}

      {/* Input for session indexes */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Enter session indexes (comma-separated), or leave blank for all:
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
          placeholder="e.g. 0,1,2"
          sx={{ mb: 2, backgroundColor: "#fff", color: "#000", width: "250px" }}
        />

        {/* Button to mark plan as adapted */}
        <div>
          <Button
            variant="contained"
            onClick={handleCopyPlan}
            disabled={copyLoading}
          >
            {copyLoading ? "Marking..." : "Mark Plan as Adapted"}
          </Button>
        </div>

        {copyError && (
          <Typography variant="body2" sx={{ mt: 1, color: "red" }}>
            Error: {copyError}
          </Typography>
        )}
        {copySuccess && (
          <Typography variant="body2" sx={{ mt: 1, color: "lime" }}>
            {copySuccess}
          </Typography>
        )}
      </Box>
    </Box>
  );
}