import React, { useState, useRef } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

interface VoiceInputProps {
  onTranscription: (text: string) => void
  disabled?: boolean
}

export default function VoiceInput({ onTranscription, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          
          // Convert to base64 for transcription
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              const base64Data = dataUrl.split(',')[1]
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(audioBlob)
          })

          // Transcribe using Blink AI
          const { text } = await blink.ai.transcribeAudio({
            audio: base64Audio,
            language: 'en'
          })

          if (text.trim()) {
            onTranscription(text.trim())
            toast({
              title: 'Voice Input Ready',
              description: 'Voice converted to text. Click Send to submit your message.'
            })
          } else {
            toast({
              title: 'No Speech Detected',
              description: 'Please try speaking more clearly',
              variant: 'destructive'
            })
          }
        } catch (error) {
          console.error('Error transcribing audio:', error)
          toast({
            title: 'Transcription Error',
            description: 'Failed to process voice input. Please try again.',
            variant: 'destructive'
          })
        } finally {
          setIsProcessing(false)
          // Clean up stream
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      toast({
        title: 'Recording Started',
        description: 'Speak now... Click stop when finished'
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: 'Microphone Error',
        description: 'Unable to access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className="h-[50px] w-[50px] relative transition-all duration-200"
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isProcessing ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : isRecording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      
      {isRecording && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </Button>
  )
}