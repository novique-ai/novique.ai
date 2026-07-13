"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Communication {
  id: string;
  type: "voicemail" | "sms" | "email" | "call";
  direction: "inbound" | "outbound";
  status: "unread" | "read" | "archived" | "replied";
  from_address: string;
  from_name?: string;
  to_address: string;
  subject?: string;
  body?: string;
  duration?: number;
  recording_url?: string;
  transcription_status?: "pending" | "in_progress" | "completed" | "failed";
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface Stats {
  total_unread: number;
  unread_voicemail: number;
  unread_sms: number;
  unread_email: number;
  today_count: number;
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_unread: 0,
    unread_voicemail: 0,
    unread_sms: 0,
    unread_email: 0,
    today_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadCommunications();
    loadStats();
  }, [typeFilter, statusFilter, searchQuery]);

  async function loadCommunications() {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/communications?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch communications");
      }

      const result = await response.json();
      setCommunications(result.data || []);
    } catch (error) {
      console.error("Error loading communications:", error);
      setCommunications([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/communications/stats");
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      loadCommunications();
      loadStats();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function archiveCommunication(id: string) {
    try {
      await fetch(`/api/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      loadCommunications();
      loadStats();
    } catch (error) {
      console.error("Error archiving:", error);
    }
  }

  async function deleteCommunication(id: string) {
    if (!confirm("Are you sure you want to delete this communication?")) {
      return;
    }

    try {
      await fetch(`/api/communications/${id}`, {
        method: "DELETE",
      });
      loadCommunications();
      loadStats();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  }

  function toggleExpand(id: string) {
    const comm = communications.find((c) => c.id === id);
    if (comm && comm.status === "unread") {
      markAsRead(id);
    }
    setExpandedId(expandedId === id ? null : id);
  }

  function playVoicemail(id: string) {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(`/api/communications/${id}/audio`);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(id);
    }
  }

  async function transcribeVoicemail(id: string) {
    setTranscribingId(id);
    try {
      const response = await fetch(`/api/communications/${id}/transcribe`, {
        method: "POST",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Transcription failed");
      }
      // Reload to show the transcription
      loadCommunications();
    } catch (error: any) {
      console.error("Error transcribing:", error);
      alert(`Transcription failed: ${error.message}`);
      loadCommunications(); // Reload to show failed status
    } finally {
      setTranscribingId(null);
    }
  }

  async function sendSmsReply(communicationId: string) {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch("/api/admin/sms/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communicationId,
          message: replyText.trim(),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to send reply");
      }

      // Clear reply state and reload
      setReplyText("");
      setReplyingToId(null);
      loadCommunications();
      loadStats();
    } catch (error: any) {
      console.error("Error sending SMS reply:", error);
      alert(`Failed to send reply: ${error.message}`);
    } finally {
      setSendingReply(false);
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case "voicemail":
        return "\uD83D\uDCDE";
      case "sms":
        return "\uD83D\uDCF1";
      case "email":
        return "\u2709\uFE0F";
      case "call":
        return "\uD83D\uDCDE";
      default:
        return "\uD83D\uDCE8";
    }
  }

  function getStatusBadge(status: string): string {
    const badges: Record<string, string> = {
      unread: "bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25",
      read: "bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1",
      archived: "bg-surface-3 text-ink-2 ring-1 ring-inset ring-stroke-1",
      replied: "bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25",
    };
    return badges[status] || "bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1";
  }

  const statsArray = [
    { name: "Unread", value: stats.total_unread, color: "text-aqua" },
    { name: "Voicemail", value: stats.unread_voicemail },
    { name: "SMS", value: stats.unread_sms },
    { name: "Today", value: stats.today_count },
  ];

  if (loading) {
    return <div className="text-center py-12 text-ink-2">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-0">Communications</h1>
        <p className="mt-2 text-sm text-ink-1">
          Manage voicemails, SMS messages, and other communications
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        {statsArray.map((stat) => (
          <div
            key={stat.name}
            className="bg-surface-2 border border-stroke-0 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <dt className="text-sm font-medium text-ink-2 truncate">
                {stat.name}
              </dt>
              <dd
                className={`mt-1 text-3xl font-semibold ${stat.color || "text-ink-0"}`}
              >
                {stat.value}
              </dd>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by phone, name, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-3 py-2 rounded-md bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60 sm:text-sm"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-full px-3 py-2 rounded-md bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="voicemail">Voicemail</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 rounded-md bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-surface-2 border border-stroke-0 shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-stroke-0">
          {communications.length > 0 ? (
            communications.map((comm) => (
              <div
                key={comm.id}
                className={`${
                  comm.status === "unread" ? "bg-aqua/[0.06]" : ""
                } hover:bg-surface-3/60 transition-colors`}
              >
                {/* Main row */}
                <div
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => toggleExpand(comm.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 min-w-0">
                      {/* Unread indicator */}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          comm.status === "unread"
                            ? "bg-aqua"
                            : "bg-transparent"
                        }`}
                      />

                      {/* Type icon */}
                      <span className="text-2xl">{getTypeIcon(comm.type)}</span>

                      {/* Contact info */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-0 truncate">
                          {comm.from_name || comm.from_address}
                        </p>
                        {comm.from_name && (
                          <p className="text-sm text-ink-2">
                            {comm.from_address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 ml-4">
                      {/* Duration for voicemails */}
                      {comm.type === "voicemail" && comm.duration && (
                        <span className="text-sm text-ink-2">
                          {formatDuration(comm.duration)}
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          comm.status
                        )}`}
                      >
                        {comm.status}
                      </span>

                      {/* Time */}
                      <span className="text-sm text-ink-2 whitespace-nowrap">
                        {formatTimeAgo(comm.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Preview text */}
                  {comm.body && (
                    <p className="mt-2 text-sm text-ink-1 truncate pl-12">
                      &ldquo;{comm.body}&rdquo;
                    </p>
                  )}
                  {comm.type === "voicemail" &&
                    comm.transcription_status === "pending" && (
                      <p className="mt-2 text-sm text-ink-3 italic pl-12">
                        Transcription pending...
                      </p>
                    )}
                </div>

                {/* Expanded details */}
                {expandedId === comm.id && (
                  <div className="px-6 pb-4 border-t border-stroke-0 bg-surface-1">
                    <div className="pt-4 space-y-4">
                      {/* Voicemail player */}
                      {comm.type === "voicemail" && comm.recording_url && (
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicemail(comm.id);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-[#04110d] bg-aqua hover:bg-aqua-bright focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-1 focus:ring-aqua/60"
                          >
                            {playingId === comm.id ? "\u23F8 Pause" : "\u25B6 Play Voicemail"}
                          </button>
                          {(comm.transcription_status === "pending" ||
                            comm.transcription_status === "failed") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                transcribeVoicemail(comm.id);
                              }}
                              disabled={transcribingId === comm.id}
                              className="inline-flex items-center px-4 py-2 border border-stroke-1 text-sm font-medium rounded-md shadow-sm text-ink-1 bg-surface-2 hover:bg-surface-3/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-1 focus:ring-aqua/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {transcribingId === comm.id
                                ? "Transcribing..."
                                : comm.transcription_status === "failed"
                                  ? "Retry Transcription"
                                  : "Transcribe"}
                            </button>
                          )}
                          {comm.transcription_status === "in_progress" && (
                            <span className="text-sm text-aqua italic">
                              Transcription in progress...
                            </span>
                          )}
                          <span className="text-sm text-ink-2">
                            Duration: {formatDuration(comm.duration || 0)}
                          </span>
                        </div>
                      )}

                      {/* Full message body */}
                      {comm.body && (
                        <div className="bg-surface-2 p-4 rounded-md border border-stroke-0">
                          <p className="text-sm text-ink-1 whitespace-pre-wrap">
                            {comm.body}
                          </p>
                        </div>
                      )}

                      {/* Customer link */}
                      {comm.customer && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-ink-2">
                            Linked to:
                          </span>
                          <Link
                            href={`/admin/customers/${comm.customer.id}`}
                            className="text-sm font-medium text-aqua hover:text-aqua-bright"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {comm.customer.name}
                          </Link>
                        </div>
                      )}

                      {/* SMS Reply Section */}
                      {comm.type === "sms" && comm.direction === "inbound" && (
                        <div className="space-y-3">
                          {replyingToId === comm.id ? (
                            <div className="flex flex-col space-y-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Type your reply..."
                                rows={3}
                                className="block w-full px-3 py-2 rounded-md bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60 sm:text-sm"
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendSmsReply(comm.id);
                                  }}
                                  disabled={sendingReply || !replyText.trim()}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-[#04110d] bg-aqua hover:bg-aqua-bright focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-1 focus:ring-aqua/60 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingReply ? "Sending..." : "Send Reply"}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingToId(null);
                                    setReplyText("");
                                  }}
                                  className="text-sm text-ink-1 hover:text-ink-0"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingToId(comm.id);
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-1 focus:ring-green-500"
                            >
                              Reply via SMS
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-4 pt-2">
                        {comm.status === "unread" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(comm.id);
                            }}
                            className="text-sm text-ink-1 hover:text-ink-0"
                          >
                            Mark as Read
                          </button>
                        )}
                        {comm.status !== "archived" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveCommunication(comm.id);
                            }}
                            className="text-sm text-ink-1 hover:text-ink-0"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCommunication(comm.id);
                          }}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-ink-2">
              No communications found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
