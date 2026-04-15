import { useState } from "react";
import { User, Send, ArrowLeft, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
}

interface Thread {
  id: string;
  title: string;
  participant: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

const threadsData: Thread[] = [
  {
    id: "1",
    title: "Scheidungsverfahren Müller vs. Müller",
    participant: "RA Max Bergmann",
    lastMessage: "Guten Tag, bezüglich Ihres Falles haben wir neue Informationen erhalten...",
    time: "Gestern, 14:30",
    unread: true,
    messages: [
      { id: "1a", sender: "RA Max Bergmann", content: "Guten Tag Herr Müller, ich möchte Sie über den aktuellen Stand Ihres Falles informieren.", time: "Gestern, 14:25", isOwn: false },
      { id: "1b", sender: "RA Max Bergmann", content: "Wir haben neue Informationen vom Gericht erhalten. Die Verhandlung wurde auf den 20. April angesetzt. Bitte bringen Sie alle relevanten Unterlagen mit.", time: "Gestern, 14:30", isOwn: false },
      { id: "1c", sender: "Sie", content: "Vielen Dank für die Information. Welche Unterlagen genau benötige ich?", time: "Gestern, 15:10", isOwn: true },
      { id: "1d", sender: "RA Max Bergmann", content: "Sie benötigen die Vermögensaufstellung, die Heiratsurkunde und den Entwurf der Unterhaltsvereinbarung. Ich werde Ihnen eine vollständige Liste per Upload bereitstellen.", time: "Gestern, 16:00", isOwn: false },
    ],
  },
  {
    id: "2",
    title: "Unterhaltsvereinbarung",
    participant: "RA Sarah Fischer",
    lastMessage: "Die Dokumente für die Verhandlung am 20. April sind vorbereitet...",
    time: "12. Apr, 09:15",
    unread: false,
    messages: [
      { id: "2a", sender: "RA Sarah Fischer", content: "Hallo, die Unterhaltsberechnung ist fertig. Ich habe die Dokumente in Ihre Akte hochgeladen.", time: "12. Apr, 09:15", isOwn: false },
      { id: "2b", sender: "Sie", content: "Danke! Kann ich die Berechnung nochmal prüfen bevor wir sie einreichen?", time: "12. Apr, 10:30", isOwn: true },
      { id: "2c", sender: "RA Sarah Fischer", content: "Natürlich. Schauen Sie sich das Dokument in Ruhe an und melden Sie sich bei Fragen.", time: "12. Apr, 11:00", isOwn: false },
    ],
  },
  {
    id: "3",
    title: "Sorgerechtsvereinbarung",
    participant: "RA Max Bergmann",
    lastMessage: "Der Entwurf der Sorgerechtsvereinbarung liegt vor...",
    time: "08. Apr, 16:45",
    unread: false,
    messages: [
      { id: "3a", sender: "RA Max Bergmann", content: "Der Entwurf der Sorgerechtsvereinbarung liegt vor. Bitte prüfen Sie insbesondere die Umgangsregelung.", time: "08. Apr, 16:45", isOwn: false },
    ],
  },
];

const MessagesView = () => {
  const [threads] = useState<Thread[]>(threadsData);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});
  const { toast } = useToast();

  const getMessages = (thread: Thread) => {
    return [...thread.messages, ...(localMessages[thread.id] || [])];
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread) return;
    const msg: Message = {
      id: Date.now().toString(),
      sender: "Sie",
      content: newMessage,
      time: "Gerade eben",
      isOwn: true,
    };
    setLocalMessages((prev) => ({
      ...prev,
      [selectedThread.id]: [...(prev[selectedThread.id] || []), msg],
    }));
    setNewMessage("");
    toast({ title: "Nachricht gesendet", description: "Ihre Nachricht wurde sicher übermittelt." });
  };

  if (selectedThread) {
    const allMessages = getMessages(selectedThread);
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Thread Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <button onClick={() => setSelectedThread(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="font-display font-bold text-foreground">{selectedThread.title}</h2>
            <p className="text-xs text-muted-foreground">{selectedThread.participant}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {allMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.isOwn ? "order-1" : ""}`}>
                <div className={`rounded-2xl p-4 ${
                  msg.isOwn
                    ? "bg-navy text-primary-foreground rounded-br-md"
                    : "glass-card border-border/50 rounded-bl-md"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1.5 ${msg.isOwn ? "justify-end" : ""}`}>
                  <span className="text-[10px] text-muted-foreground">{msg.sender} · {msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 pt-4">
          <div className="glass-card border-border/50 p-2 flex items-center gap-2">
            <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nachricht eingeben..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="navy"
              size="sm"
              className="rounded-xl"
              onClick={handleSend}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            Alle Nachrichten sind Ende-zu-Ende verschlüsselt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground mb-1">Sichere Nachrichten</h2>
        <p className="text-sm text-muted-foreground">Kommunizieren Sie sicher mit Ihrem Anwalt</p>
      </div>

      <div className="space-y-2">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="glass-card p-5 border-border/50 hover:border-accent/20 transition-all duration-300 cursor-pointer group"
            onClick={() => setSelectedThread(thread)}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy/10 to-navy/5 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{thread.title}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{thread.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{thread.participant}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{thread.lastMessage}</p>
              </div>
              {thread.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessagesView;
