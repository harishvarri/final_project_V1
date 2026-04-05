import { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

export default function VoiceRecorder({ onRecordingComplete, label = "Record Voice Note (Optional)" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Make the blob look like a file to FormData
        const audioFile = new File([audioBlob], "voice_note.webm", { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic", err);
      alert("Microphone access is required for voice recording. Please ensure you are on a secure connection (localhost or HTTPS) and have granted permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Release mic tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const clearRecording = () => {
    setAudioURL(null);
    onRecordingComplete(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {!audioURL ? (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border-2 w-full ${
            isRecording 
              ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' 
              : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 border-dashed'
          }`}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
          {isRecording ? 'Tap to Stop Recording...' : label}
        </button>
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-2 rounded-xl">
          <audio src={audioURL} controls className="h-10 flex-1 outline-none" />
          <button 
            type="button"
            onClick={clearRecording}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Delete Recording"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
