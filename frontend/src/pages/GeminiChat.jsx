import React from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ChatView } from "@/components/ChatView";

export default function GeminiChat() {
  const { t } = useApp();
  return <ChatView model="gemini" title={t("nav_geminichat")} subtitle={t("chat_gemini_sub")} icon={Sparkles} accent="#8AB4F8" />;
}
