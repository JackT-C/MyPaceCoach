import OpenAI from 'openai';
import { Op } from 'sequelize';
import Activity from '../models/Activity.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import RacePB from '../models/RacePB.js';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

const AI_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'minimax/minimax-m2.5:free',
];

// Try each model in order until one succeeds
async function aiComplete(params) {
  let lastError;
  for (const model of AI_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      return await openrouter.chat.completions.create({ ...params, model });
    } catch (error) {
      console.log(`Model ${model} failed: ${error.status || error.code} ${error.message}`);
      lastError = error;
      continue;
    }
  }
  throw lastError;
}

/**
 * Analyze training data and provide insights
 */
export async function analyzeTraining(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const activities = await Activity.findAll({
    where: {
      userId,
      date: { [Op.gte]: startDate }
    },
    order: [['date', 'DESC']]
  });
  
  // Calculate key metrics
  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
  const totalRuns = activities.length;
  const weeklyAverage = (totalDistance / days) * 7;
  
  const paces = activities
    .filter(a => a.pace)
    .map(a => a.pace);
  const averagePace = paces.length > 0 
    ? paces.reduce((sum, p) => sum + p, 0) / paces.length 
    : 0;
  
  // Detect patterns
  const recentActivities = activities.slice(0, 7);
  const hasConsistentTraining = recentActivities.length >= 3;
  const hasLongRun = activities.some(a => (a.distance || 0) > 15000); // 15km+
  
  // Calculate training load trends
  const weeklyDistances = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() - 7);
    
    const weekActivities = activities.filter(a => 
      a.date >= weekEnd && a.date < weekStart
    );
    const weekDistance = weekActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
    weeklyDistances.push(weekDistance);
  }
  
  // Check for overtraining (sudden spike in volume)
  const currentWeek = weeklyDistances[0];
  const previousWeek = weeklyDistances[1];
  const overtrainingRisk = currentWeek > previousWeek * 1.3; // >30% increase
  
  return {
    totalDistance,
    totalRuns,
    weeklyAverage,
    averagePace,
    hasConsistentTraining,
    hasLongRun,
    weeklyDistances,
    overtrainingRisk,
    activities: activities.slice(0, 10) // Last 10 activities
  };
}

/**
 * Generate AI coaching insights
 */
export async function generateCoachingInsights(userId, userMessage = null) {
  const analysis = await analyzeTraining(userId);
  const goals = await Goal.findAll({ 
    where: { userId, status: 'active' } 
  });
  
  // Build context for the AI
  const context = `
You are an experienced running coach analyzing a runner's training data.

Training Summary (last 30 days):
- Total distance: ${analysis.totalDistance.toFixed(1)} km
- Total runs: ${analysis.totalRuns}
- Weekly average: ${analysis.weeklyAverage.toFixed(1)} km
- Average pace: ${formatPace(analysis.averagePace)}
- Recent weekly distances: ${analysis.weeklyDistances.map(d => d.toFixed(1)).join('km, ')} km
- Consistent training: ${analysis.hasConsistentTraining ? 'Yes' : 'No'}
- Has long runs: ${analysis.hasLongRun ? 'Yes' : 'No'}
- Overtraining risk: ${analysis.overtrainingRisk ? 'Yes - sudden volume increase detected' : 'No'}

Recent Activities (oldest to newest):
${analysis.activities.slice(0, 5).reverse().map(a => 
  `- ${a.date.toISOString().split('T')[0]}: ${a.name} - ${(a.distance / 1000).toFixed(2)}km at ${formatPace(a.pace)}`
).join('\n')}

Active Goals:
${goals.length > 0 ? goals.map(g => `- ${g.title} (${g.type})`).join('\n') : 'No active goals'}

${userMessage ? `Runner's question: ${userMessage}` : ''}

Respond with EXACTLY 4-6 bullet points. Each bullet must start with "- " and be one sentence max. No introductions, no conclusions, no headers, no paragraphs. Just the bullets.
`;

  try {
    const completion = await aiComplete({
      messages: [
        { role: 'system', content: 'You are a running coach. You MUST respond with only 4-6 bullet points starting with "- ". One short sentence per bullet. No greetings, no sign-offs, no headers, no paragraphs, no emojis, no markdown. Just bullet points.' },
        { role: 'user', content: context }
      ],
      max_tokens: 250
    });

    return {
      insights: stripFormatting(completion.choices[0]?.message?.content || 'No insights available.'),
      analysis
    };
  } catch (error) {
    console.error('Error generating coaching insights:', error);
    throw error;
  }
}

/**
 * Chat with AI coach
 */
export async function chatWithCoach(userId, message, conversationHistory = []) {
  const analysis = await analyzeTraining(userId, 14); // Last 2 weeks
  const goals = await Goal.findAll({ 
    where: { userId, status: 'active' } 
  });
  
  const systemContext = `
You are an AI running coach named Coach. You have access to the runner's training data:
- Total runs (last 14 days): ${analysis.totalRuns}
- Total distance: ${analysis.totalDistance.toFixed(1)} km
- Weekly average: ${analysis.weeklyAverage.toFixed(1)} km
- Average pace: ${formatPace(analysis.averagePace)}
- Active goals: ${goals.map(g => g.title).join(', ') || 'None'}

Provide personalized running advice. Be conversational, supportive, and practical. Use the runner's data to give specific recommendations. Never use emojis or special characters.
`;

  try {
    const messages = [
      { role: 'system', content: systemContext },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const completion = await aiComplete({
      messages,
      max_tokens: 800
    });

    return stripFormatting(completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that. Can you try rephrasing?');
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
  }
}

/**
 * Predict race times based on training
 */
export async function predictRaceTimes(userId) {
  const analysis = await analyzeTraining(userId, 90); // Last 3 months
  
  // Get user's race PBs
  const pbs = await RacePB.findAll({
    where: { userId },
    order: [['date', 'DESC']]
  });
  
  if (analysis.totalRuns < 10 && pbs.length === 0) {
    return { error: 'Need more training data or race PBs for accurate predictions' };
  }
  
  const racePBsText = pbs.length > 0
    ? `\nCurrent Personal Bests:\n${pbs.map(pb => 
        `- ${pb.distance}: ${formatTime(pb.time)} (${new Date(pb.date).toLocaleDateString()})`
      ).join('\n')}`
    : '';
  
  const context = `
Based on this runner's training data from the last 90 days, predict realistic race times:

Training Summary:
- Total distance: ${analysis.totalDistance.toFixed(1)} km
- Total runs: ${analysis.totalRuns}
- Average pace: ${formatPace(analysis.averagePace)}
- Weekly average: ${analysis.weeklyAverage.toFixed(1)} km${racePBsText}

Provide realistic time predictions for:
- 800m
- 5K
- 10K
- Half Marathon (21.1km)
- Marathon (42.2km)

${pbs.length > 0 ? 'Use the runner\'s PBs as the primary reference and adjust for current fitness.' : 'Base predictions on current training pace and volume.'}

Format your response as JSON with this structure:
{
  "800m": "MM:SS",
  "5K": "MM:SS",
  "10K": "MM:SS",
  "halfMarathon": "HH:MM:SS",
  "marathon": "HH:MM:SS",
  "confidence": "Description of prediction confidence"
}
`;

  try {
    const completion = await aiComplete({
      messages: [
        { role: 'system', content: 'You are a running coach expert at predicting race times based on training data. Provide realistic, achievable predictions.' },
        { role: 'user', content: context }
      ],
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return { error: 'Could not generate predictions. Please try again.' };
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { predictions: response };
  } catch (error) {
    console.error('Error predicting race times:', error);
    throw error;
  }
}

/**
 * Generate training plan for a goal
 */
export async function generateTrainingPlan(userId, goalId) {
  const goal = await Goal.findByPk(goalId);
  const analysis = await analyzeTraining(userId);
  
  if (!goal) throw new Error('Goal not found');
  
  const weeksUntilGoal = goal.raceDate 
    ? Math.ceil((goal.raceDate - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : 12; // Default to 12 weeks
  
  const context = `
Create a ${weeksUntilGoal}-week training plan for this goal:
- Goal: ${goal.title}
- Type: ${goal.type}
- Race type: ${goal.raceType || 'N/A'}
- Target time: ${goal.targetTime || 'N/A'}

Current training level:
- Weekly average: ${analysis.weeklyAverage.toFixed(1)} km
- Average pace: ${formatPace(analysis.averagePace)}

Create a structured, progressive training plan with:
1. Weekly mileage targets
2. Key workout types (easy runs, tempo, intervals, long runs)
3. Recovery days
4. Progressive overload

IMPORTANT: Respond with ONLY valid JSON, no additional text or markdown. Use the exact structure below:
{
  "weeks": [
    {
      "weekNumber": 1,
      "totalDistance": 30,
      "runs": [
        {"day": "Monday", "type": "Easy", "distance": 5, "description": "Easy pace recovery run"}
      ]
    }
  ]
}

Make sure:
- No trailing commas after the last item in arrays or objects
- All strings are properly quoted
- All property names are in double quotes
- Numbers are not quoted
`;

  try {
    const completion = await aiComplete({
      messages: [
        { role: 'system', content: 'You are an expert running coach. You MUST respond with valid JSON only, no markdown, no explanations, just pure JSON.' },
        { role: 'user', content: context }
      ],
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('AI returned empty response');
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0];
        
        // Clean up common JSON issues
        // Remove trailing commas before ] or }
        jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
        // Fix unescaped quotes in strings (basic fix)
        jsonStr = jsonStr.replace(/:\s*"([^"]*)"([^,\}\]]*)"([^"]*)"(\s*[,\}\]])/g, (match, p1, p2, p3, p4) => {
          return `: "${p1}\\"${p2}\\"${p3}"${p4}`;
        });
        
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response:', response);
        throw parseError;
      }
    }
    
    return { plan: response };
  } catch (error) {
    console.error('Error generating training plan:', error);
    throw error;
  }
}

// Strip emojis, markdown formatting, and special characters from AI responses
function stripFormatting(text) {
  if (!text) return text;
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}\u{20E3}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/gu, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\|/g, '')
    .replace(/---+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Helper function to format pace
function formatPace(pace) {
  if (!pace || pace === 0) return 'N/A';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

// Helper function to format time in seconds to HH:MM:SS or MM:SS
function formatTime(seconds) {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Voice coaching - emotionally intelligent AI response
 * Analyzes runner's voice transcript to detect emotional state and provide empathetic coaching
 */
export async function voiceCoaching(userId, transcript, activityData, activityId) {
  try {
    // Get user data for context
    const user = await User.findByPk(userId);
    
    // Analyze emotional tone from transcript
    const emotion = detectEmotion(transcript);
    
    // Get recent training context
    const recentActivities = await Activity.findAll({
      where: { userId },
      order: [['date', 'DESC']],
      limit: 5
    });
    
    // Build context for AI
    const activityContext = activityData ? `
Activity Details:
- Distance: ${activityData.distance?.toFixed(2)} km
- Duration: ${activityData.duration?.toFixed(0)} minutes
- Pace: ${activityData.pace ? formatPace(activityData.pace) : 'N/A'}
- Heart Rate: ${activityData.heartRate ? Math.round(activityData.heartRate) + ' bpm' : 'N/A'}
- Elevation Gain: ${activityData.elevationGain ? Math.round(activityData.elevationGain) + 'm' : 'N/A'}
` : '';

    const recentContext = recentActivities.length > 0 ? `
Recent Training History:
${recentActivities.map((a, i) => 
  `${i + 1}. ${format(new Date(a.date), 'MMM d')}: ${(a.distance / 1000).toFixed(1)}km in ${Math.round(a.movingTime / 60)}min`
).join('\n')}
` : '';

    const emotionContext = `
Detected Emotional Tone: ${emotion.label}
Confidence Indicators: ${emotion.indicators.join(', ')}
`;

    const prompt = `You are an empathetic AI running coach having a voice conversation with a runner immediately after their workout. They just finished speaking to you about their run.

${activityContext}
${recentContext}
${emotionContext}

Runner's Feedback (what they just said):
"${transcript}"

IMPORTANT INSTRUCTIONS:
1. Respond as if you're a real coach who just listened to them speak
2. Match their emotional energy - if they sound excited, be enthusiastic; if tired, be understanding
3. Acknowledge specific things they mentioned
4. Provide brief, conversational coaching advice (2-3 sentences max)
5. Use natural speech patterns - short sentences, contractions, conversational tone
6. Show empathy based on the detected emotion
7. Don't just state metrics - respond to how they FEEL about the run

Respond naturally and warmly, like a coach who genuinely cares:`;

    const completion = await aiComplete({
      messages: [
        { role: 'system', content: 'You are an emotionally intelligent running coach who excels at voice-based coaching conversations. You understand both the physical and emotional aspects of running. Keep responses conversational, brief (2-3 sentences), and empathetic. Never use emojis or special characters.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300
    });

    const message = stripFormatting(completion.choices[0]?.message?.content || "Great job out there! Keep up the good work.");

    return {
      message: message.trim(),
      emotion: emotion.label,
      emotionConfidence: emotion.confidence
    };
  } catch (error) {
    console.error('Error in voice coaching:', error);
    throw error;
  }
}

/**
 * Detect emotional tone from transcript text
 * Returns emotion label and confidence indicators
 */
function detectEmotion(transcript) {
  const text = transcript.toLowerCase();
  
  // Positive emotion indicators
  const excitedWords = ['amazing', 'awesome', 'great', 'fantastic', 'love', 'loved', 'best', 'excellent', 'strong', 'crushed', 'nailed', 'felt good', 'wonderful'];
  const proudWords = ['proud', 'accomplished', 'achievement', 'personal best', 'PR', 'pb', 'beat my time'];
  
  // Negative emotion indicators
  const frustratedWords = ['frustrated', 'disappointed', 'annoyed', 'angry', 'terrible', 'awful', 'horrible', 'worst'];
  const tiredWords = ['exhausted', 'tired', 'drained', 'dead', 'spent', 'wiped', 'burned out'];
  const strugglingWords = ['struggled', 'difficult', 'hard', 'tough', 'challenging', 'suffering', 'pain'];
  
  // Neutral/Reflective indicators
  const reflectiveWords = ['okay', 'alright', 'fine', 'decent', 'not bad', 'average', 'normal'];
  
  // Count matches
  const excitedCount = excitedWords.filter(w => text.includes(w)).length;
  const proudCount = proudWords.filter(w => text.includes(w)).length;
  const frustratedCount = frustratedWords.filter(w => text.includes(w)).length;
  const tiredCount = tiredWords.filter(w => text.includes(w)).length;
  const strugglingCount = strugglingWords.filter(w => text.includes(w)).length;
  const reflectiveCount = reflectiveWords.filter(w => text.includes(w)).length;
  
  // Check for exclamation marks (excitement indicator)
  const exclamationCount = (transcript.match(/!/g) || []).length;
  
  const indicators = [];
  let emotion = 'neutral';
  let confidence = 'medium';
  
  if (excitedCount > 0 || proudCount > 0 || exclamationCount >= 2) {
    emotion = 'excited/proud';
    indicators.push('positive language', 'enthusiasm');
    confidence = 'high';
  } else if (frustratedCount > 0) {
    emotion = 'frustrated';
    indicators.push('frustration indicators');
    confidence = 'high';
  } else if (tiredCount > 0 || strugglingCount > 0) {
    emotion = 'tired/struggling';
    indicators.push('fatigue language', 'challenge mentions');
    confidence = 'high';
  } else if (reflectiveCount > 0) {
    emotion = 'reflective';
    indicators.push('neutral language', 'matter-of-fact tone');
    confidence = 'medium';
  } else {
    indicators.push('no strong emotion indicators');
    confidence = 'low';
  }
  
  return {
    label: emotion,
    confidence,
    indicators
  };
}

function format(date, formatStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  if (formatStr === 'MMM d') {
    return `${month} ${day}`;
  }
  return date.toLocaleDateString();
}

