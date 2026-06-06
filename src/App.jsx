import { useState } from "react";

async function analyzeSentiment(text) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze sentiment of this feedback. Reply ONLY with valid JSON, no extra text:
{
  "sentiment": "positive" or "negative" or "neutral" or "mixed",
  "score": number from -1.0 to 1.0,
  "confidence": "high" or "medium" or "low",
  "keywords": ["word1", "word2", "word3"],
  "summary": "one sentence business insight"
}

Feedback: """${text}"""`
          }]
        }],
        generationConfig: { temperature: 0.3 }
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(JSON.stringify(errData));
  }

  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text;
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function App() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeSentiment(text);
      setResult(analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const colors = {
    positive: { bg: "#d1fae5", text: "#065f46" },
    negative: { bg: "#fee2e2", text: "#991b1b" },
    neutral:  { bg: "#f3f4f6", text: "#374151" },
    mixed:    { bg: "#fef3c7", text: "#92400e" },
  };

  return (
    <div style={{ maxWidth: "600px", margin: "60px auto",
      padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>

      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "6px" }}>
        Sentiment Analyzer
      </h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "28px" }}>
        Powered by Gemini AI
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste any customer feedback, review, or comment..."
        rows={5}
        style={{ width: "100%", padding: "12px", fontSize: "14px",
          border: "1px solid #d1d5db", borderRadius: "10px",
          resize: "vertical", boxSizing: "border-box",
          outline: "none", lineHeight: "1.6" }}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        style={{ marginTop: "12px", padding: "10px 24px",
          background: loading || !text.trim() ? "#9ca3af" : "#111827",
          color: "white", border: "none", borderRadius: "8px",
          fontSize: "14px", cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 500 }}>
        {loading ? "Analyzing..." : "Analyze Sentiment"}
      </button>

      {error && (
        <div style={{ marginTop: "16px", padding: "12px 16px",
          background: "#fee2e2", color: "#991b1b",
          borderRadius: "8px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "24px", border: "1px solid #e5e7eb",
          borderRadius: "12px", padding: "20px" }}>

          {/* Sentiment badge + confidence */}
          <div style={{ display: "flex", alignItems: "center",
            gap: "10px", marginBottom: "20px" }}>
            <span style={{
              background: colors[result.sentiment].bg,
              color: colors[result.sentiment].text,
              padding: "4px 14px", borderRadius: "99px",
              fontWeight: 600, fontSize: "14px",
              textTransform: "capitalize"
            }}>
              {result.sentiment}
            </span>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>
              {result.confidence} confidence
            </span>
          </div>

          {/* Score bar */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>
              <span>Sentiment score</span>
              <span style={{ fontWeight: 500, color: "#111827" }}>
                {result.score >= 0 ? "+" : ""}{result.score.toFixed(2)}
              </span>
            </div>
            <div style={{ height: "8px", background: "#f3f4f6",
              borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((result.score + 1) / 2 * 100).toFixed(0)}%`,
                background: result.score > 0.2 ? "#16a34a"
                  : result.score < -0.2 ? "#dc2626" : "#9ca3af",
                borderRadius: "4px",
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af",
              marginBottom: "8px", textTransform: "uppercase",
              letterSpacing: "0.05em" }}>
              Key phrases
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {result.keywords.map((kw) => (
                <span key={kw} style={{ padding: "4px 12px",
                  background: "#f9fafb", border: "1px solid #e5e7eb",
                  borderRadius: "99px", fontSize: "13px", color: "#374151" }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: "12px 16px", background: "#f9fafb",
            borderRadius: "8px", fontSize: "14px",
            color: "#374151", lineHeight: "1.6" }}>
            {result.summary}
          </div>
        </div>
      )}
    </div>
  );
}