import { useEffect, useState } from "react";
import { XIcon, DownloadIcon, VideoIcon, Loader2Icon } from "lucide-react";
import { sessionApi } from "../api/sessions";
import { formatDistanceToNow } from "date-fns";

function RecordingsModal({ sessionId, onClose }) {
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const data = await sessionApi.getRecordings(sessionId);
        setRecordings(data.recordings || []);
      } catch (err) {
        console.error("Failed to fetch recordings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecordings();
  }, [sessionId]);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <VideoIcon className="size-6 text-primary" />
            Session Recordings
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <XIcon className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2Icon className="size-10 animate-spin text-primary" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <VideoIcon className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No recordings yet</p>
            <p className="text-sm mt-1">
              Recordings appear here after you stop recording. It may take ~30 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec, idx) => (
              <div key={rec.filename || idx} className="card bg-base-200 border border-base-300">
                <div className="card-body p-4 flex flex-row items-center justify-between">
                  <div>
                    <p className="font-semibold">Recording {idx + 1}</p>
                    {rec.start_time && (
                      <p className="text-sm text-base-content/60">
                        {formatDistanceToNow(new Date(rec.start_time), { addSuffix: true })}
                      </p>
                    )}
                    {rec.duration && (
                      <p className="text-xs text-base-content/50">
                        Duration: {Math.round(rec.duration)}s
                      </p>
                    )}
                  </div>
                  
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <DownloadIcon className="size-4" />
                    Download
                  </a>

                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default RecordingsModal;