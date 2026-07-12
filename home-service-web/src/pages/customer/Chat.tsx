import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send, Mic, Square, ImagePlus, Phone, Loader2 } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import { cn } from "../../lib/utils";
import {
  bookingsApi,
  messagesApi,
  uploadsApi,
  resolveUploadUrl,
  connectSocket,
  ApiError,
  type ApiBooking,
  type ApiMessage,
} from "../../api";
import { useAppStore } from "../../store/appStore";

export default function Chat() {
  const { bookingId } = useParams();
  const currentUser = useAppStore((s) => s.user);
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!bookingId) return;
    bookingsApi.getBooking(bookingId).then(setBooking).catch(() => setError("Could not load this conversation."));
    messagesApi.listMessages(bookingId).then(setMessages).catch(() => undefined);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    const socket = connectSocket();
    if (!socket) return;

    socket.emit("join:booking", bookingId, (ack: { ok: boolean }) => {
      if (!ack.ok) setError("You don't have access to this conversation.");
    });

    const onMessage = (msg: ApiMessage) => setMessages((m) => [...m, msg]);
    const onTyping = (data: { isTyping: boolean }) => setPeerTyping(data.isTyping);
    const onConnect = () => setPeerOnline(true);
    const onDisconnect = () => setPeerOnline(false);

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setPeerOnline(socket.connected);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [bookingId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function stopTyping() {
    if (!bookingId) return;
    connectSocket()?.emit("chat:typing", { bookingId, isTyping: false });
  }

  function handleTyping(value: string) {
    setText(value);
    if (!bookingId) return;
    connectSocket()?.emit("chat:typing", { bookingId, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 1500);
  }

  function sendText() {
    if (!text.trim() || !bookingId) return;
    connectSocket()?.emit("chat:message", { bookingId, text: text.trim() });
    setText("");
    stopTyping();
  }

  async function handleImage(file: File) {
    if (!bookingId) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadsApi.uploadFile("chat", file);
      connectSocket()?.emit("chat:message", { bookingId, imageUrl: url });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send image.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!bookingId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try {
          const { url } = await uploadsApi.uploadFile("chat", file);
          connectSocket()?.emit("chat:message", { bookingId, voiceUrl: url });
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not send voice message.");
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  }

  if (!bookingId) {
    return (
      <div>
        <TopBar title="Chat" back />
        <p className="p-6 text-center text-sm text-ink-muted">Open chat from an active booking.</p>
      </div>
    );
  }

  const customerName = typeof booking?.customer === "object" ? booking.customer.name : "Customer";
  const workerName = typeof booking?.worker === "object" ? booking.worker.user?.name : "Worker";
  const isWorkerView = currentUser?.role === "worker";
  const peerName = (isWorkerView ? customerName : workerName) ?? "Chat";
  const peerPhone = isWorkerView
    ? typeof booking?.customer === "object"
      ? booking.customer.phone
      : undefined
    : typeof booking?.worker === "object" && booking.worker.user && "phone" in booking.worker.user
      ? (booking.worker.user as { phone?: string }).phone
      : undefined;

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        title={peerName}
        back
        right={
          peerPhone ? (
            <a href={`tel:${peerPhone}`} className="rounded-lg p-1.5 text-ink hover:bg-surface" aria-label="Call">
              <Phone size={18} />
            </a>
          ) : undefined
        }
      />
      <p className="px-4 pt-1 text-[11px] text-ink-muted">
        <span
          className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", peerOnline ? "bg-success" : "bg-ink-muted/40")}
        />
        {peerOnline ? "Online" : "Offline"}
      </p>

      {error && <p className="mx-4 mt-2 rounded-xl bg-danger-light px-3 py-2 text-xs text-danger">{error}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24 scrollbar-thin">
        {messages.map((m) => {
          const senderId = typeof m.sender === "object" ? m.sender.id : m.sender;
          const mine = senderId === currentUser?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                  mine ? "bg-primary text-white" : "bg-surface text-ink"
                )}
              >
                {m.imageUrl && (
                  <img src={resolveUploadUrl(m.imageUrl)} alt="" className="mb-1.5 max-h-48 rounded-lg object-cover" />
                )}
                {m.voiceUrl && (
                  <audio controls src={resolveUploadUrl(m.voiceUrl)} className="mb-1.5 max-w-full" />
                )}
                {m.text && <p>{m.text}</p>}
                <p className={cn("mt-1 text-[10px]", mine ? "text-white/60" : "text-ink-muted")}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {peerTyping && <p className="text-xs text-ink-muted">{peerName} is typing...</p>}
        <div ref={scrollRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center gap-2 border-t border-border bg-white p-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full p-2 text-ink-muted hover:bg-surface disabled:opacity-50"
          aria-label="Attach image"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImage(file);
            e.target.value = "";
          }}
        />
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        {text ? (
          <button onClick={sendText} className="rounded-full bg-primary p-2.5 text-white" aria-label="Send">
            <Send size={16} />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={cn(
              "rounded-full p-2.5",
              recording ? "bg-danger text-white" : "text-ink-muted hover:bg-surface"
            )}
            aria-label={recording ? "Stop recording" : "Record voice message"}
          >
            {recording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
