import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  TextField,
  IconButton,
  Collapse
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Safely parse a numeric prefix from a string.
 * e.g. "3. Something" => 3. If invalid, return a large number so it sorts at the end.
 */
function getNumericPrefix(title) {
  if (typeof title !== 'string') return 999999;
  const match = title.trim().match(/^(\d+)\./);
  if (!match) return 999999;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? 999999 : num;
}

export default function ProcessAnimation({ userId }) {
  const [bookId, setBookId] = useState('');

  // currentStep: -1 => not started, up to 8 => final
  const [currentStep, setCurrentStep] = useState(-1);

  // Fully cleaned & sorted chapters from the server
  const [chapters, setChapters] = useState([]);

  // For step 3 typing effect
  const [displayedChapters, setDisplayedChapters] = useState([]);

  // For step 5 subchapters (key = chapterName => array of subchapter names)
  const [displayedSubChapters, setDisplayedSubChapters] = useState({});

  const [numChaptersDetected, setNumChaptersDetected] = useState(0);

  // Expand/collapse for sub-chapters
  const [expandedChapters, setExpandedChapters] = useState({});

  // Toggle expansion
  const handleToggleExpand = (chapterName) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterName]: !prev[chapterName],
    }));
  };

  /**
   * Called when the user clicks "Start".
   * We GET /api/process-book-data?userId=...&bookId=...
   */
  const handleStartProcessing = async () => {
    if (!userId || !bookId) {
      alert('Please provide both userId and bookId');
      return;
    }
    try {
      // Fetch data
      const res = await axios.get('http://localhost:3001/api/process-book-data', {
        params: { userId, bookId },
      });
      const data = res.data || {};
      // data.chapters should be an array of { name, subchapters: [...] }

      // 1) Force chapters into an array
      const rawChapters = Array.isArray(data.chapters) ? data.chapters : [];

      // 2) Clean & sort chapters
      // We'll build a new array that we guarantee is safe
      const cleanedChapters = rawChapters
        .filter((c) => c && typeof c.name === 'string')
        .map((c) => {
          // Safely convert subchapters to array
          const rawSubs = Array.isArray(c.subchapters) ? c.subchapters : [];

          // Filter & sort subchapters
          const safeSubs = rawSubs
            .filter((s) => s && typeof s.name === 'string')
            .sort((s1, s2) => {
              const aVal = getNumericPrefix(s1?.name || '');
              const bVal = getNumericPrefix(s2?.name || '');
              return aVal - bVal;
            });

          return {
            ...c,
            subchapters: safeSubs,
          };
        })
        .sort((a, b) => {
          const aVal = getNumericPrefix(a?.name || '');
          const bVal = getNumericPrefix(b?.name || '');
          return aVal - bVal;
        });

      setChapters(cleanedChapters);
      setNumChaptersDetected(cleanedChapters.length);

      // Reset the typed-out items
      setDisplayedChapters([]);
      setDisplayedSubChapters({});
      setExpandedChapters({});

      // Start at step 0
      setCurrentStep(0);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      alert('Error fetching data. Check console/logs.');
    }
  };

  /**
   * Step-based animation effect:
   *  0: Upload Complete
   *  1: Analyzing Content
   *  2: X Chapters Detected
   *  3: Type out chapters
   *  4: Analyzing chapters
   *  5: Sub-chapters detected
   *  6: Analyzing sub-chapters
   *  7: All content absorbed
   *  8: Create Adaptive Plan
   */
  useEffect(() => {
    if (currentStep < 0) return; // not started yet

    switch (currentStep) {
      case 0:
        setTimeout(() => setCurrentStep(1), 1000);
        break;
      case 1:
        setTimeout(() => setCurrentStep(2), 1000);
        break;
      case 2:
        setTimeout(() => setCurrentStep(3), 1000);
        break;
      case 3: {
        // Type out the chapter names
        setDisplayedChapters([]);
        let i = 0;
        const typeInterval = setInterval(() => {
          const ch = chapters[i];
          if (!ch || typeof ch.name !== 'string') {
            // out of bounds or invalid
            clearInterval(typeInterval);
            setTimeout(() => setCurrentStep(4), 500);
            return;
          }
          setDisplayedChapters((prev) => [...prev, ch.name]);
          i++;
          if (i >= chapters.length) {
            clearInterval(typeInterval);
            setTimeout(() => setCurrentStep(4), 500);
          }
        }, 150);
        break;
      }
      case 4:
        setTimeout(() => setCurrentStep(5), 1000);
        break;
      case 5: {
        // We'll "detect" subchapters
        (async () => {
          let newSubObj = {};
          for (let i = 0; i < chapters.length; i++) {
            const c = chapters[i];
            if (!c || typeof c.name !== 'string') continue;

            // c.subchapters should be safe, but just to be sure:
            const subArr = Array.isArray(c.subchapters) ? c.subchapters : [];
            // We'll gather subchapters by name
            const subNames = subArr
              .filter((s) => s && typeof s.name === 'string')
              .map((s) => s.name);

            newSubObj[c.name] = subNames;
            setDisplayedSubChapters({ ...newSubObj });

            // small delay before next
            await new Promise((res) => setTimeout(res, 200));
          }
          setTimeout(() => setCurrentStep(6), 1000);
        })();
        break;
      }
      case 6:
        setTimeout(() => setCurrentStep(7), 1000);
        break;
      case 7:
        setTimeout(() => setCurrentStep(8), 1000);
        break;
      default:
        break;
    }
  }, [currentStep, chapters]);

  // Renders a spinner or check icon depending on step progress
  const renderStepStatus = (stepIndex) => {
    if (currentStep === stepIndex) {
      return <CircularProgress size={18} sx={{ ml: 1, color: '#4CAF50' }} />;
    }
    if (currentStep > stepIndex) {
      return (
        <CheckCircleIcon
          sx={{ ml: 1, fontSize: '1.25rem', color: '#4CAF50' }}
        />
      );
    }
    return null;
  };

  return (
    <Box
      sx={{
        backgroundColor: '#111',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '90%',
          maxWidth: '600px',
          backgroundColor: '#222',
          border: '1px solid #333',
          borderRadius: 2,
          p: 3,
          mt: 2,
        }}
      >
        {/* Book ID input */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            variant="filled"
            label="Enter Book ID"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            InputProps={{ style: { backgroundColor: '#333', color: '#fff' } }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleStartProcessing}
            sx={{ alignSelf: 'flex-end' }}
          >
            Start
          </Button>
        </Box>

        {/* Steps appear only after we start (>=0) */}
        {currentStep >= 0 && (
          <>
            {/* Step 0 */}
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              1. Upload Complete
              {renderStepStatus(0)}
            </Typography>

            {/* Step 1 */}
            {currentStep >= 1 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
              >
                2. Analyzing Content
                {renderStepStatus(1)}
              </Typography>
            )}

            {/* Step 2 */}
            {currentStep >= 2 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
              >
                3. {numChaptersDetected} Chapters Detected
                {renderStepStatus(2)}
              </Typography>
            )}

            {/* Step 3: typed-out chapters */}
            {currentStep >= 3 && (
              <Box sx={{ ml: 2, mt: 1 }}>
                {displayedChapters.map((chName, idx) => (
                  <Typography key={idx} variant="body1">
                    {chName}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Step 4 */}
            {currentStep >= 4 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
              >
                4. Analyzing Chapters
                {renderStepStatus(4)}
              </Typography>
            )}

            {/* Step 5 */}
            {currentStep >= 5 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
              >
                5. Sub-chapters Detected
                {renderStepStatus(5)}
              </Typography>
            )}

            {/* Display collapsible sub-chapters */}
            {currentStep >= 5 && (
              <Box sx={{ ml: 2, mt: 1 }}>
                {Object.keys(displayedSubChapters).map((chapterName) => {
                  const subs = displayedSubChapters[chapterName] || [];
                  const isExpanded = !!expandedChapters[chapterName];

                  return (
                    <Box key={chapterName} sx={{ mb: 2 }}>
                      {/* Clickable row for chapter */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleToggleExpand(chapterName)}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {chapterName}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 1, color: '#aaa' }}>
                          ({subs.length} sub-chapters detected)
                        </Typography>
                        <IconButton
                          size="small"
                          sx={{ color: '#ccc', ml: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand(chapterName);
                          }}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      {/* Collapsible list */}
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List sx={{ pl: 3, listStyleType: 'disc', color: '#ccc' }}>
                          {subs.map((subName, i) => (
                            <ListItem
                              key={i}
                              sx={{
                                display: 'list-item',
                                pl: 0,
                                py: 0.2,
                              }}
                            >
                              {subName}
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Step 6 */}
            {currentStep >= 6 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
              >
                6. Analyzing Sub-chapters
                {renderStepStatus(6)}
              </Typography>
            )}

            {/* Step 7 */}
            {currentStep >= 7 && (
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
              >
                7. All Content Absorbed
                {renderStepStatus(7)}
              </Typography>
            )}

            {/* Step 8 */}
            {currentStep === 8 && (
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => alert('Adaptive Plan Created!')}
                >
                  Create Adaptive Plan
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}