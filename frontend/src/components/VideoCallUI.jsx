import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon, CircleIcon, VideoIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import toast from "react-hot-toast";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

function VideoCallUI({ chatClient, channel, sessionId, isHost, onViewRecordings }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);

  const handleToggleRecording = async () => {
    setIsRecordingLoading(true);
    try {
      if (isRecording) {
        await fetch(`/api/sessions/${sessionId}/recording/stop`, { method: "POST", credentials: "include" });
        setIsRecording(false);
        toast.success("Recording stopped. It will be available shortly.");
      } else {
        await fetch(`/api/sessions/${sessionId}/recording/start`, { method: "POST", credentials: "include" });
        setIsRecording(true);
        toast.success("Recording started!");
      }
    } catch (err) {
      toast.error("Failed to toggle recording");
    } finally {
      setIsRecordingLoading(false);
    }
  };

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-3 relative str-video">
      <div className="flex-1 flex flex-col gap-3">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </span>
            {isRecording && (
              <span className="flex items-center gap-1 text-error text-sm font-semibold animate-pulse">
                <CircleIcon className="w-3 h-3 fill-error" /> REC
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Recording controls - host only */}
            {isHost && (
              <button
                onClick={handleToggleRecording}
                disabled={isRecordingLoading}
                className={`btn btn-sm gap-2 ${isRecording ? "btn-error" : "btn-outline"}`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecordingLoading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <CircleIcon className={`size-4 ${isRecording ? "fill-white" : "text-error"}`} />
                )}
                {isRecording ? "Stop Rec" : "Record"}
              </button>
            )}

            {/* View recordings button - host only */}
            {isHost && (
              <button
                onClick={onViewRecordings}
                className="btn btn-sm btn-ghost gap-2"
                title="View recordings"
              >
                <VideoIcon className="size-4" />
                Recordings
              </button>
            )}

            {chatClient && channel && (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`btn btn-sm gap-2 ${isChatOpen ? "btn-primary" : "btn-ghost"}`}
              >
                <MessageSquareIcon className="size-4" />
                Chat
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-base-300 rounded-lg overflow-hidden relative">
          <SpeakerLayout />
        </div>

        <div className="bg-base-100 p-3 rounded-lg shadow flex justify-center">
          <CallControls onLeave={() => navigate("/dashboard")} />
        </div>
      </div>

      {/* Chat panel */}
      {chatClient && channel && (
        <div
          className={`flex flex-col rounded-lg shadow overflow-hidden bg-[#272a30] transition-all duration-300 ease-in-out ${
            isChatOpen ? "w-80 opacity-100" : "w-0 opacity-0"
          }`}
        >
          {isChatOpen && (
            <>
              <div className="bg-[#1c1e22] p-3 border-b border-[#3a3d44] flex items-center justify-between">
                <h3 className="font-semibold text-white">Session Chat</h3>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                  <XIcon className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden stream-chat-dark">
                <Chat client={chatClient} theme="str-chat__theme-dark">
                  <Channel channel={channel}>
                    <Window>
                      <MessageList />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                </Chat>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default VideoCallUI;