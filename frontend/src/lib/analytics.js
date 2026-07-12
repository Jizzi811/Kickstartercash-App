import axios from "axios";
import { API } from "@/context/AppContext";

// Fire-and-forget product event (self-hosted: POST /api/track -> Mongo).
// Auth + workspace ride on the axios defaults set by AppContext. Tracking
// must never break the app: failures are swallowed silently.
export const track = (event, props = {}) => {
  try {
    axios.post(`${API}/track`, { event, props }).catch(() => {});
  } catch {
    /* ignore */
  }
};
