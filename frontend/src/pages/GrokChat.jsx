import React from "react";
import { Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ChatView } from "@/components/ChatView";

export default function GrokChat() {
  const { t } = useApp();
  return <ChatView model="grok" title={t("nav_grokchat")} subtitle={t("chat_grok_sub")} icon={Zap} accent="#FF6B35" />;
}
