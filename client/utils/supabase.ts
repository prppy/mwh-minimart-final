import { createClient } from "@supabase/supabase-js";

// Public anon key — safe to bundle in client code
const SUPABASE_URL = "https://iwwjulkymtsxipbxvaha.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d2p1bGt5bXRzeGlwYnh2YWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg4MzEsImV4cCI6MjA2NjYwNDgzMX0.p5Q6ZJQ4ZDVfiBygKKvtORXylObdqTXdrOMXG0BMwA0";

// During Expo SSR (Node.js < 22), there is no global WebSocket.
// Provide the "ws" polyfill as a fallback when WebSocket is missing.
const hasNativeWebSocket = typeof globalThis.WebSocket !== "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: hasNativeWebSocket ? {} : { transport: require("ws") },
});
