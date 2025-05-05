// File: DailyPlan.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";
import { Box } from "@mui/material";

// Updated import paths to match your new structure:
import {
  parseCreatedAt,
  dateOnly,
  addDays,
  formatDate,
} from "./components/dailyPlanUtils";

import StatusBar from "./components/StatusBar";     // <--- Using StatusBar now
import ActivityList from "./components/ActivityList";

/**
 * The main DailyPlan component
 */
export default function DailyPlan({
  userId,
  plan,
  planId,
  colorScheme,
  dayDropIdx,
  onDaySelect,
  expandedChapters,
  onToggleChapter,
  onOpenPlanFetcher,
}) {
  const dispatch = useDispatch();
  const currentIndex = useSelector((state) => state.plan.currentIndex);

  if (!plan?.sessions?.length) {
    return <div>No sessions found in this plan.</div>;
  }
  const sessions = plan.sessions;

  // Parse creation date
  const createdAtDate = parseCreatedAt(plan);
  const today = dateOnly(new Date());

  // Build day labels
  const dayLabels = sessions.map((sess) => {
    const sNum = Number(sess.sessionLabel); // e.g. 1,2,...
    const dayDate = addDays(createdAtDate, sNum - 1);
    const dayDateStr = formatDate(dayDate);

    if (dayDate.getTime() === today.getTime()) {
      return `Today (${dayDateStr})`;
    }
    return `Day ${sNum} (${dayDateStr})`;
  });

  // Make sure dayDropIdx is within bounds
  useEffect(() => {
    const firstDayDate = addDays(createdAtDate, 0);
    const lastDayDate = addDays(createdAtDate, sessions.length - 1);

    if (today < firstDayDate) {
      onDaySelect(0);
      return;
    }
    if (today > lastDayDate) {
      onDaySelect(sessions.length - 1);
      return;
    }
    const daysDiff = (today.getTime() - firstDayDate.getTime()) / (1000 * 60 * 60 * 24);
    const exactIdx = Math.floor(daysDiff);
    if (exactIdx < 0) {
      onDaySelect(0);
    } else if (exactIdx >= sessions.length) {
      onDaySelect(sessions.length - 1);
    } else {
      onDaySelect(exactIdx);
    }
  }, [planId, sessions]);

  let safeIdx = dayDropIdx;
  if (safeIdx < 0) safeIdx = 0;
  if (safeIdx >= sessions.length) safeIdx = sessions.length - 1;

  // Current day's session
  const currentSession = sessions[safeIdx] || {};
  const { activities = [] } = currentSession;

  // We'll store timeMap & subchapterStatusMap in local state
  const [timeMap, setTimeMap] = useState({});
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  // Debug log
  useEffect(() => {
    console.log("DailyPlan => dayActivities =>", activities);
  }, [activities]);

  // ============= 1) Fetch times + subchapter-status for this day's activities =============
  useEffect(() => {
    let cancel = false;
    if (!activities.length) {
      setTimeMap({});
      setSubchapterStatusMap({});
      return;
    }

    async function doFetch() {
      try {
        setLoading(true);

        // 1) fetch times
        const fetchTimePromise = (async () => {
          const newMap = {};
          for (const act of activities) {
            if (!act.activityId) continue;
            const rawType = (act.type || "").toLowerCase();
            const type = rawType.includes("read") ? "read" : "quiz";

            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
                params: { activityId: act.activityId, type },
              });
              const totalTime = res.data?.totalTime || 0;
              newMap[act.activityId] = totalTime;
            } catch (err) {
              console.error("Error fetching time for", act.activityId, err);
            }
          }
          return newMap;
        })();

        // 2) fetch aggregator subchapter-status
        const fetchStatusPromise = (async () => {
          const uniqueSubIds = new Set();
          for (const act of activities) {
            if (act.subChapterId) uniqueSubIds.add(act.subChapterId);
          }
          const newStatusMap = {};
          for (const subId of uniqueSubIds) {
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, {
                params: { userId, planId, subchapterId: subId },
              });
              newStatusMap[subId] = res.data;
            } catch (err) {
              console.error("Error fetching subchapter-status for", subId, err);
            }
          }
          return newStatusMap;
        })();

        const [finalTimeMap, finalStatusMap] = await Promise.all([
          fetchTimePromise,
          fetchStatusPromise,
        ]);

        if (!cancel) {
          setTimeMap(finalTimeMap);
          setSubchapterStatusMap(finalStatusMap);
        }
      } catch (err) {
        console.error("Error in doFetch dailyplan =>", err);
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    doFetch();
    return () => {
      cancel = true;
    };
  }, [activities, planId, userId]);

  // ============= 2) onClickActivity => dispatch & open PlanFetcher =============
  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  // ============= (Optional) Calculate Time Spent / Expected for StatusBar =============
  // Example: totalTimeSpent is sum of all lumps (in seconds) => convert to minutes
  const totalTimeSpentSec = Object.values(timeMap).reduce((acc, val) => acc + val, 0);
  const totalTimeSpentMin = Math.round(totalTimeSpentSec / 60);  // e.g. 12

  // Hard-coded example for totalTimeExpected (30m?), or read from persona
  const totalTimeExpected = 30;

  // ============= 3) Render =============
  if (loading) {
    return (
      <div style={{ color: "#fff", marginTop: "1rem" }}>
        <h2>Loading daily plan...</h2>
      </div>
    );
  }

  return (
    <Box sx={{ marginTop: "1rem" }}>
      {/*
        Now we use our new StatusBar component in place of DayDropdownBar
        and pass all the relevant props, including timeSpent/timeExpected.
      */}
      <StatusBar
        safeIdx={safeIdx}
        dayLabels={dayLabels}
        sessions={sessions}
        activities={activities}
        onDaySelect={onDaySelect}
        colorScheme={colorScheme}
        totalTimeSpent={totalTimeSpentMin}
        totalTimeExpected={totalTimeExpected}
        timeMap={timeMap}

      />

      <ActivityList
        dayActivities={activities}
        currentIndex={currentIndex}
        onClickActivity={handleClickActivity}
        timeMap={timeMap}
        subchapterStatusMap={subchapterStatusMap}
        userId={userId}
        planId={planId}
      />
    </Box>
  );
}