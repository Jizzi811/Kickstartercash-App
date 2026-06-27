import React from "react";
import { Bot } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ChatView } from "@/components/ChatView";

export default function GPTChat() {
  const { t } = useApp();
  return <ChatView model="gpt" title={t("nav_gptchat")} subtitle={t("chat_gpt_sub")} icon={Bot} accent="#10A37F" />;
}
