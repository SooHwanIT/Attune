import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  {
    id: "1",
    email: "demo@attune.com",
    password: "demo1234",
    name: "SuHwan",
    avatar: "🧑‍💻",
  },
];

function issueTokens(user) {
  return {
    accessToken: `mock_access_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    refreshToken: `mock_refresh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    expiresInSec: 3600,
    refreshExpiresInSec: 604800,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }
  return res.json(issueTokens(user));
});

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ code: "INVALID_REQUEST", message: "name, email, password가 필요합니다." });
  }

  const exists = users.some((item) => item.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    return res.status(409).json({ code: "EMAIL_EXISTS", message: "이미 가입된 이메일입니다." });
  }

  const user = {
    id: String(users.length + 1),
    name,
    email,
    password,
    avatar: "👤",
  };
  users.push(user);
  return res.status(201).json(issueTokens(user));
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ code: "INVALID_REQUEST", message: "refreshToken이 필요합니다." });
  }

  const fallbackUser = users[0];
  return res.json(issueTokens(fallbackUser));
});

app.post("/api/counsel/initiate", (req, res) => {
  const { topic, mood, style, content } = req.body || {};
  console.log("[Mock Server] initiateCounsel received:", { topic, mood, style, content });

  // Simulate some processing delay
  setTimeout(() => {
    res.json({
      success: true,
      sessionId: `mock-session-${Date.now()}`,
      message: "상담 세션이 생성되었습니다 (mock).",
    });
  }, 400);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
