import { useEffect, useRef } from "react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-slate-950 text-white" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {isUser ? "U" : "🤖"}
      </div>
      <div
        className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${
          isUser
            ? "rounded-tr-sm bg-slate-950 text-white"
            : "rounded-tl-sm bg-slate-100 text-slate-950"
        }`}
      >
        <p className="leading-relaxed">{message.text}</p>
        {!isUser && message.insight ? (
          <p className="mt-2 whitespace-pre-line border-t border-slate-200 pt-2 text-xs text-slate-500">
            💡 {message.insight}
          </p>
        ) : null}
        <p
          className={`mt-2 text-xs text-slate-400 ${
            isUser ? "text-right" : ""
          }`}
        >
          {new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        🤖
      </div>
      <div className="flex items-center gap-1 rounded-3xl rounded-tl-sm bg-slate-100 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <div className="text-5xl">💬</div>
      <p className="mt-3 font-bold">Kono conversation nei</p>
      <p className="mt-1 text-sm text-slate-400">
        Upore input box e likhle chat shuru hobe.
      </p>
    </div>
  );
}

function ChatHistory({ chatLog = [], isTyping = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isTyping]);

  if (chatLog.length === 0) return <EmptyState />;

  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
      {chatLog.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatHistory;
