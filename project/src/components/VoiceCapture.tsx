import { useState } from 'react';
import { Mic, Loader2, AudioWaveform as Waveform } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceCaptureProps {
  onResult: (text: string) => void;
}

export default function VoiceCapture({ onResult }: VoiceCaptureProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setError('Votre navigateur ne supporte pas la reconnaissance vocale');
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);
    
    recognition.onerror = (event: any) => {
      setRecording(false);
      switch (event.error) {
        case 'not-allowed':
          setError('Accès au microphone refusé');
          break;
        case 'network':
          setError('Erreur réseau');
          break;
        default:
          setError('Une erreur est survenue');
      }
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onResult(text);
    };

    try {
      recognition.start();
    } catch (err) {
      setError('Erreur lors du démarrage de l\'enregistrement');
      setRecording(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={startRecording}
          disabled={recording}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "py-3 px-4 rounded-lg font-medium",
            "transition-all duration-200",
            recording
              ? "bg-primary-100 dark:bg-primary-900/20"
              : "bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700",
            recording
              ? "text-primary-700 dark:text-primary-400"
              : "text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {recording ? (
            <>
              <Waveform className="w-5 h-5 animate-pulse" />
              Écoute en cours...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Commencer l'enregistrement
            </>
          )}
        </button>

        {transcript && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dernier texte capté :
            </h3>
            <p className="text-gray-900 dark:text-white">
              {transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}