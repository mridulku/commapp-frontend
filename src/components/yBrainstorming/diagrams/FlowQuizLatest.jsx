import React, { useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "./VerboseNode";       // your custom tooltip node
import { getLayoutedElements } from "./layoutHelper"; // your Dagre-based layout helper

/**
 * FlowDetailedOverall
 *
 * This component gives a **big-picture** view of how StageManager, QuizComponent,
 * revision logic, and the relevant Express/Firebase endpoints fit together:
 * 1. StageManager states & lifecycle
 * 2. StageManager's fetchData logic
 * 3. StageManager's computeState
 * 4. Mode-based rendering in StageManager
 * 5. QuizComponent: GPT quiz fetch & JSON parsing
 * 6. QuizComponent: userAnswers & handleSubmit
 * 7. QuizComponent: submitQuiz => store attempts
 * 8. ReviseComponent (similar approach for revision)
 * 9. StageManager timeline (renderTimeline)
 * 10. /api/generate (server prompt + GPT flow)
 * 11. /api/submitQuiz
 * 12. /api/getQuiz
 * 13. /api/submitRevision
 * 14. /api/getRevisions
 *
 * Hover over each node to see detailed explanations!
 */

const nodeTypes = { verboseNode: VerboseNode };

export default function FlowQuizLatest() {
  /**
   * 1) NODES
   * Each node has an `id`, a short `label`, and a longer `details` for the tooltip.
   * We then connect them with edges that show the flow from top (StageManager) to bottom (APIs).
   */

  const initialNodes = useMemo(
    () => [
      {
        id: "1",
        type: "verboseNode",
        data: {
          label: "StageManager: Initialization",
          details: `
[StageManager.jsx]
- Receives props (examId, activity, quizStage, userId).
- Defines local states: loading, error, quizAttempts[], revisionAttempts[], mode, etc.
- Also has pass ratio config for each stage {remember: 0.6, understand: 0.7, ...}.
- If subChapterId/userId is missing, it cannot proceed.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "2",
        type: "verboseNode",
        data: {
          label: "StageManager: fetchData() useEffect",
          details: `
[StageManager.jsx -> useEffect -> fetchData()]
- On mount or when subChapterId/userId/quizStage changes:
   1) Calls /api/getQuiz?userId=&subchapterId=&quizType= to retrieve quiz attempts
   2) Calls /api/getRevisions?userId=&subchapterId=&revisionType= to retrieve revision attempts
- These arrays are stored in quizAttempts[] and revisionAttempts[]
- Then computeState(...) is called to decide "mode".
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "3",
        type: "verboseNode",
        data: {
          label: "StageManager: computeState",
          details: `
[StageManager.jsx -> computeState(quizArr, revArr)]
- Inspects the latest quiz attempt (score = X/Y).
- Compares ratio X/Y to pass ratio (0.6, 0.7, etc.).
- If no attempts => mode="NO_QUIZ_YET"
- If passed => mode="QUIZ_COMPLETED"
- If not passed => checks if user has done a revision for that attempt => 
   * If not => mode="NEED_REVISION"
   * If yes => mode="CAN_TAKE_NEXT_QUIZ"
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "4",
        type: "verboseNode",
        data: {
          label: "StageManager: Render Based on 'mode'",
          details: `
[StageManager.jsx -> return(...)]
Depending on "mode":
- "NO_QUIZ_YET" => Renders <QuizComponent ...> with attemptNumber=1
- "QUIZ_COMPLETED" => Shows success message
- "NEED_REVISION" => Renders <ReviseComponent ...> for the last attemptNumber
- "CAN_TAKE_NEXT_QUIZ" => Renders <QuizComponent ...> with attemptNumber=(last+1)

Also can toggle a timeline panel => calls renderTimeline(...) 
which lists each quiz attempt and revision in chronological order.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "5",
        type: "verboseNode",
        data: {
          label: "QuizComponent: GPT quiz fetch",
          details: `
[QuizComponent.jsx -> fetchGPTQuiz()]
- Called when the user first sees a new quiz or attempt:
  1) Posts to /api/generate with { userId, subchapterId, promptKey }
  2) On success: receives result that includes GPT-generated JSON
  3) That JSON is stored in responseData.result
- userAnswers[] state keeps track of user’s input for each question.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "6",
        type: "verboseNode",
        data: {
          label: "QuizComponent: parse JSON + display questions",
          details: `
[QuizComponent.jsx]
- Strips any triple-backtick fences => parse as JSON => e.g. { quizQuestions: [ ... ] }
- For each questionObj => <QuestionRenderer> decides how to render (multipleChoice, trueFalse, fillInBlank, etc.).
- userAnswers[qIndex] is updated on input change.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "7",
        type: "verboseNode",
        data: {
          label: "QuizComponent: handleSubmit => store quiz",
          details: `
[QuizComponent.jsx -> handleSubmit()]
- Compares userAnswers[] with questionObj.correctAnswer => 
  calculates correctCount => finalScore (e.g. "3/5").
- Sends final submission to /api/submitQuiz with:
   { userId, subchapterId, quizType, quizSubmission, score, attemptNumber }
- If score >= passRatio => calls onQuizComplete() => triggers StageManager re-fetch
- Else => calls onQuizFail() => triggers StageManager re-fetch => leads to NEED_REVISION.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "8",
        type: "verboseNode",
        data: {
          label: "ReviseComponent",
          details: `
[ReviseComponent.jsx (similar pattern)]
- The user sees revision tasks or content.
- On finishing revision => calls /api/submitRevision with:
   { userId, subchapterId, revisionType, revisionNumber }
- That triggers handleRevisionDone() in StageManager => refetch => leads to "CAN_TAKE_NEXT_QUIZ" mode.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "9",
        type: "verboseNode",
        data: {
          label: "StageManager: Timeline (renderTimeline)",
          details: `
[StageManager.jsx -> renderTimeline()]
- Aggregates quiz attempts + matching revisions in chronological or attemptNumber order.
- Each attempt => Q# (score), color-coded if passed or failed.
- If a revision for that attempt => R#, shown in blue. 
- Helps user see full attempt history.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "10",
        type: "verboseNode",
        data: {
          label: "/api/generate => GPT prompt logic",
          details: `
[server.js -> app.post("/api/generate")]
- Looks up 'promptKey' in Firestore "prompts"
- Also fetches "user_activities_demo" + "subchapters_demo" to gather summary & user context
- Builds finalPrompt => calls openai.chat.completions.create({model:"gpt-3.5-turbo", messages:[...]})
- Returns GPT's text => front-end parses into quiz questions or other data.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "11",
        type: "verboseNode",
        data: {
          label: "/api/submitQuiz => store attempts",
          details: `
[server.js -> /api/submitQuiz]
- Receives quiz data: userId, subchapterId, quizType, quizSubmission, score, attemptNumber
- Writes a doc to Firestore "quizzes_demo"
- Returns a success message with docId.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "12",
        type: "verboseNode",
        data: {
          label: "/api/getQuiz => read attempts",
          details: `
[server.js -> /api/getQuiz]
- Query "quizzes_demo" for matching userId, subchapterId, quizType
- Return an array of attempt objects (score, attemptNumber, timestamp, etc.)
- StageManager uses this to decide if user has taken a quiz for this stage.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "13",
        type: "verboseNode",
        data: {
          label: "/api/submitRevision => store revision record",
          details: `
[server.js -> /api/submitRevision]
- Writes { userId, subchapterId, revisionType, revisionNumber, timestamp } 
  to Firestore "revisions_demo".
- Called from ReviseComponent upon finishing revision.
          `,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "14",
        type: "verboseNode",
        data: {
          label: "/api/getRevisions => read revision attempts",
          details: `
[server.js -> /api/getRevisions]
- Query "revisions_demo" for matching userId, subchapterId, revisionType
- Returns array of { revisionNumber, timestamp, ... }
- StageManager uses it to check if user revised after a failing quiz attempt.
          `,
        },
        position: { x: 0, y: 0 },
      },
    ],
    []
  );

  /**
   * 2) EDGES
   * A linear top->bottom set of edges that demonstrate flow from StageManager
   * (1-4) => Quiz/Revise components (5-9) => server routes (10-14).
   * You can add branching edges if you want to illustrate pass/fail paths.
   */
  const initialEdges = useMemo(
    () => [
      { id: "1->2", source: "1", target: "2" },
      { id: "2->3", source: "2", target: "3" },
      { id: "3->4", source: "3", target: "4" },
      { id: "4->5", source: "4", target: "5" },
      { id: "5->6", source: "5", target: "6" },
      { id: "6->7", source: "6", target: "7" },
      { id: "7->8", source: "7", target: "8" },
      { id: "8->9", source: "8", target: "9" },
      { id: "9->10", source: "9", target: "10" },
      { id: "10->11", source: "10", target: "11" },
      { id: "11->12", source: "11", target: "12" },
      { id: "12->13", source: "12", target: "13" },
      { id: "13->14", source: "13", target: "14" },
    ],
    []
  );

  // 3) Use React Flow's state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4) Auto-layout on mount with Dagre (vertical: "TB")
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB" // top->bottom
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line
  }, []);

  // 5) If user draws new edges
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: "#1e1e1e" }}
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    backgroundColor: "#222",
  },
};