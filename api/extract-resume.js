// /api/extract-resume.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'No resume text provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const prompt = `Extract comprehensive career information from this resume. Return ONLY valid JSON (no markdown):
{
  "currentJobTitle": "string",
  "currentCompany": "string",
  "yearsOfExperience": number,
  "companies": [{"name": "string", "years": number}],
  "skills": ["skill1", "skill2"],
  "careerSummary": "2-3 sentence summary of career progression"
}
Resume:
${resumeText}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    const cleanJson = textContent.replace(/```json\n?|\n?```/g, '').trim();
    const extracted = JSON.parse(cleanJson);
    return res.status(200).json(extracted);
  } catch (error) {
    console.error('Resume extraction error:', error);
    return res.status(500).json({ error: 'Failed to extract resume', details: error.message });
  }
}
