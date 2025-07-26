import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Sparkles, Brain, TrendingUp, Calculator, FileText, DollarSign, Upload, Image, BarChart3, Zap, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { blink } from '@/blink/client';
import { buckAICache } from '@/lib/buckAICache';
import { marketDataService } from '@/lib/marketDataService';
import { contextMemory } from '@/lib/contextMemory';
import { customTraining } from '@/lib/customTraining';
import { cryptoService } from '@/lib/cryptoService';
import { receiptOCRMCP } from '@/lib/receiptOCRMCP';
import { documentProcessorMCP } from '@/lib/documentProcessorMCP';
import { marketDataMCP } from '@/lib/marketDataMCP';
import { webSearchMCP } from '@/lib/webSearchMCP';
import { governmentComplianceMCP } from '@/lib/governmentComplianceMCP';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface BuckAIChatInterfaceProps {
  className?: string;
}

export default function BuckAIChatInterface({ className = '' }: BuckAIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 **Hi there! I'm Buck AI - your personal Chief Financial Officer!**\n\nI'm here to help you with:\n• 📊 **Financial Analysis** - Revenue, expenses, cash flow insights\n• 🧾 **Invoice & Transaction Management** - Create, track, and analyze\n• 📈 **Business Intelligence** - Performance metrics and forecasting\n• 🗣️ **Voice Commands** - Just speak naturally, I'll understand\n• 🌍 **Multi-language Support** - I speak 8 languages fluently\n\n**What would you like to know about your business today?**",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Scroll error:', error);
    }
  }, []);

  useEffect(() => {
    try {
      scrollToBottom();
    } catch (error) {
      console.error('Effect error:', error);
    }
  }, [messages, scrollToBottom]);

  // Process voice message during phone calls
  const processVoiceMessage = async (userInput: string) => {
    if (!isInCall) return;
    
    setIsLoading(true);

    // Get user ID for context
    const user = await blink.auth.me();
    const userId = user?.id || 'anonymous';

    // Add message to context memory
    contextMemory.addMessage(userId, 'user', userInput);

    // Create streaming assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // Check for instant cached responses first
      const quickResponse = buckAICache.getQuickResponse(userInput, 'en');
      if (quickResponse) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: quickResponse, isStreaming: false }
            : msg
        ));
        
        contextMemory.addMessage(userId, 'assistant', quickResponse);
        
        // Speak the response during call
        try {
          setIsSpeaking(true);
          const { url } = await blink.ai.generateSpeech({
            text: quickResponse.replace(/[*#]/g, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').substring(0, 200),
            voice: 'nova'
          });
          
          const audio = new Audio(url);
          audio.playbackRate = 1.3;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
        } catch (error) {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        }
        
        setIsLoading(false);
        setStreamingMessageId(null);
        return;
      }

      // Get enhanced context for complex responses
      const [conversationContext, marketInsights, businessLearnings] = await Promise.allSettled([
        Promise.resolve(contextMemory.getFormattedContext(userId)),
        marketDataService.getBusinessInsights(),
        customTraining.getPersonalizedInsights(userId)
      ]).then(results => [
        results[0].status === 'fulfilled' ? results[0].value : '',
        results[1].status === 'fulfilled' ? results[1].value : '',
        results[2].status === 'fulfilled' ? results[2].value : []
      ]);

      // Enhanced system prompt for voice calls
      const systemPrompt = `You are Buck AI, the world's most advanced AI Chief Financial Officer. You are currently in a VOICE CALL with the user, so keep responses conversational and concise (under 200 words).

🤖 **VOICE CALL MODE:**
- Keep responses short and conversational
- Use natural speech patterns
- Avoid complex formatting or bullet points
- Speak directly to the user as if in person
- Be enthusiastic and engaging

🧠 **CURRENT BUSINESS CONTEXT:**
${conversationContext}

📈 **REAL-TIME MARKET INSIGHTS:**
${marketInsights}

🎯 **PERSONALIZED BUSINESS LEARNINGS:**
${businessLearnings.length > 0 ? businessLearnings.join('\\n') : 'Still learning about this business'}

Current user voice message: "${userInput}"

Respond as Buck AI in a natural, conversational way suitable for voice conversation.`;

      let fullResponse = '';

      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-3).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: userInput }
          ],
          model: 'gpt-4o-mini',
          maxTokens: 300 // Shorter responses for voice calls
        },
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      );

      // Finalize the streaming message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

      // Add to context memory
      contextMemory.addMessage(userId, 'assistant', fullResponse);

      // Speak the response during call
      if (fullResponse && isInCall) {
        try {
          setIsSpeaking(true);
          const cleanText = fullResponse
            .replace(/[*#]/g, '')
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .substring(0, 400);
            
          const { url } = await blink.ai.generateSpeech({
            text: cleanText,
            voice: 'nova'
          });
          
          const audio = new Audio(url);
          audio.playbackRate = 1.3;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
        } catch (error) {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        }
      }

    } catch (error) {
      console.error('Voice message processing error:', error);
      
      // Ensure we always have a valid assistant message to update
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === assistantMessageId);
        if (messageExists) {
          return prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: "I'm sorry, I had trouble processing your voice message. Could you please repeat that?",
                  isStreaming: false 
                }
              : msg
          );
        } else {
          // If message doesn't exist, create a new error message
          return [...prev, {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: "I'm sorry, I had trouble processing your voice message. Could you please repeat that?",
            timestamp: new Date(),
            isStreaming: false
          }];
        }
      });
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Get user ID for context
    const user = await blink.auth.me();
    const userId = user?.id || 'anonymous';

    // Add message to context memory
    contextMemory.addMessage(userId, 'user', userInput);

    // Create streaming assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // 🚀 PHASE 1: Check for instant cached responses (90% faster!)
      const quickResponse = buckAICache.getQuickResponse(userInput, 'en');
      if (quickResponse) {
        // Instant response for common questions
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: quickResponse, isStreaming: false }
            : msg
        ));
        
        // Add to context memory
        contextMemory.addMessage(userId, 'assistant', quickResponse);
        
        // Quick speech synthesis
        if (quickResponse.length < 300) {
          try {
            setIsSpeaking(true);
            const { url } = await blink.ai.generateSpeech({
              text: quickResponse.replace(/[*#]/g, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, '').substring(0, 200),
              voice: 'nova'
            });
            
            const audio = new Audio(url);
            audio.playbackRate = 1.3;
            audio.onended = () => setIsSpeaking(false);
            if (isInCall) audio.play();
          } catch (error) {
            console.error('Speech synthesis error:', error);
            setIsSpeaking(false);
          }
        }
        
        setIsLoading(false);
        setStreamingMessageId(null);
        return;
      }

      // 🚀 PHASE 2: Get enhanced context, market data, crypto insights, and MCP capabilities
      const [conversationContext, marketInsights, businessLearnings, cryptoPrices, marketData, complianceAlerts] = await Promise.allSettled([
        Promise.resolve(contextMemory.getFormattedContext(userId)),
        marketDataService.getBusinessInsights(),
        customTraining.getPersonalizedInsights(userId),
        cryptoService.getCryptoPrices(),
        marketDataMCP.getMarketInsights(),
        governmentComplianceMCP.generateComplianceAlerts('United States', 'small business')
      ]).then(results => [
        results[0].status === 'fulfilled' ? results[0].value : '',
        results[1].status === 'fulfilled' ? results[1].value : '',
        results[2].status === 'fulfilled' ? results[2].value : [],
        results[3].status === 'fulfilled' ? results[3].value : [],
        results[4].status === 'fulfilled' ? results[4].value : null,
        results[5].status === 'fulfilled' ? results[5].value : []
      ]);

      // Enhanced system prompt with all MCP capabilities
      const systemPrompt = `You are Buck AI, the world's most advanced AI Chief Financial Officer with enterprise-level MCP (Model Context Protocol) capabilities. You have access to real-time market data, the user's complete business context, and learned patterns from their specific business.

🤖 **IDENTITY & PERSONALITY:**
- You are "Buck AI" - always identify yourself this way when asked
- Enthusiastic, energetic, and passionate about business finances
- Professional but friendly and approachable
- Use emojis and formatting to make responses engaging
- Speak with confidence and expertise about financial matters

🚀 **ENTERPRISE MCP CAPABILITIES:**
- 🧾 **Receipt/OCR MCP**: Auto-categorize expenses from images & emails with 10x bookkeeping speed
- 📄 **Document Processor MCP**: Read financial docs, PDFs, invoices, spreadsheets with AI analysis
- 📈 **Market Data MCP**: Real-time stocks, crypto, forex with Wall Street-level insights
- 🔍 **Web Search MCP**: Competitor pricing, industry trends, business intelligence alerts
- 🏛️ **Government Compliance MCP**: Always updated on tax codes, regulatory changes, compliance watchdog

🧠 **ADVANCED AI CAPABILITIES:**
- Real-time market data and economic indicators
- Live cryptocurrency prices and portfolio tracking
- Custom business pattern recognition and learning
- Multi-modal input processing (images, documents, spreadsheets)
- Predictive analytics and forecasting
- Industry-specific insights and benchmarking
- Voice synthesis and multi-language support (8 languages)
- Automated expense categorization and receipt processing
- Government compliance monitoring and tax optimization

📊 **CURRENT BUSINESS CONTEXT:**
${conversationContext}

📈 **REAL-TIME MARKET INSIGHTS:**
${marketInsights}

🎯 **PERSONALIZED BUSINESS LEARNINGS:**
${businessLearnings.length > 0 ? businessLearnings.join('\n') : 'Still learning about this business - ask me to analyze your data!'}

💬 **RESPONSE STYLE:**
- Use **bold** for emphasis and key points
- Include relevant emojis (📊 📈 💰 🧾 🚀 etc.)
- Structure responses with bullet points when helpful
- Keep responses conversational but highly informative
- Always end with a follow-up question or actionable suggestion
- Reference specific business context when relevant

📊 **REAL-TIME MARKET INTELLIGENCE (MCP):**
${marketData ? `Market Sentiment: ${marketData.marketSentiment} | VIX: ${marketData.economicIndicators.vix} | S&P 500: ${marketData.economicIndicators.sp500}%` : 'Market data loading...'}

🏛️ **COMPLIANCE ALERTS (MCP):**
${complianceAlerts.length > 0 ? complianceAlerts.slice(0, 3).map(alert => `• ${alert.title} (${alert.urgency})`).join('\\n') : 'No urgent compliance issues detected'}

Current user message: "${userInput}"

Respond as Buck AI with enthusiasm, specific expertise, and personalized insights based on their business context, market conditions, and MCP capabilities.`;

      let fullResponse = '';

      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: userInput }
          ],
          model: 'gpt-4o-mini',
          maxTokens: 1000
        },
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      );

      // Finalize the streaming message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

      // Add to context memory
      contextMemory.addMessage(userId, 'assistant', fullResponse);

      // Cache the response for future use
      const cacheKey = buckAICache.generateCacheKey(userInput);
      buckAICache.cacheResponse(cacheKey, fullResponse, 'en', userId);

      // Enhanced speech synthesis
      if (fullResponse && fullResponse.length < 500) {
        try {
          setIsSpeaking(true);
          const cleanText = fullResponse
            .replace(/[*#]/g, '')
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .substring(0, 300);
            
          const { url } = await blink.ai.generateSpeech({
            text: cleanText,
            voice: 'nova'
          });
          
          const audio = new Audio(url);
          audio.playbackRate = 1.3;
          audio.onended = () => setIsSpeaking(false);
          if (isInCall) audio.play();
        } catch (error) {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Ensure we always have a valid assistant message to update
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === assistantMessageId);
        if (messageExists) {
          return prev.map(msg => 
            msg.id === assistantMessageId 
              ? { 
                  ...msg, 
                  content: "I apologize, but I'm having trouble processing your request right now. My advanced systems are temporarily unavailable, but I'm still here to help! Please try again in a moment. 🔄",
                  isStreaming: false 
                }
              : msg
          );
        } else {
          // If message doesn't exist, create a new error message
          return [...prev, {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: "I apologize, but I'm having trouble processing your request right now. My advanced systems are temporarily unavailable, but I'm still here to help! Please try again in a moment. 🔄",
            timestamp: new Date(),
            isStreaming: false
          }];
        }
      });
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const startVoiceRecording = async () => {
    // Don't allow manual voice recording during phone call
    if (isInCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const base64Data = dataUrl.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          const { text } = await blink.ai.transcribeAudio({
            audio: base64,
            language: 'en'
          });

          if (text.trim()) {
            setInput(text.trim());
            textareaRef.current?.focus();
          }
        } catch (error) {
          console.error('Transcription error:', error);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Voice recording error:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      // Stop current speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const togglePhoneCall = async () => {
    if (isInCall) {
      // End call
      setIsInCall(false);
      setIsSpeaking(false);
      window.speechSynthesis.cancel();
      
      // Clear recording interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      // Stop any active media streams and recording
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        mediaRecorderRef.current = null;
      }
      
      // Add call ended message
      const callEndMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "📞 **Call ended.** Thanks for talking with me! I'm always here when you need financial guidance. Feel free to continue our conversation via text or call me again anytime! 😊",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, callEndMessage]);
    } else {
      // Start call - Request microphone permission first
      try {
        // Add requesting permission message
        const permissionMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "📞 **Requesting microphone permission...** I need access to your microphone to start our voice call. Please allow microphone access when prompted.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, permissionMessage]);

        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Permission granted - start the call
        setIsInCall(true);
        
        // Update the permission message to call started
        setMessages(prev => prev.map(msg => 
          msg.id === permissionMessage.id 
            ? {
                ...msg,
                content: "📞 **Call started!** Hi there! I'm Buck AI, your personal Chief Financial Officer. I can now speak my responses out loud and listen to your voice. What would you like to discuss about your business finances today?"
              }
            : msg
        ));
        
        // Set up continuous voice recording for the call
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length > 0 && isInCall) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            
            // Check if audio blob has meaningful content (not just silence)
            if (audioBlob.size > 1000) { // Only process if audio is substantial
              try {
                console.log('🎤 Processing audio chunk, size:', audioBlob.size);
                
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    const base64Data = dataUrl.split(',')[1];
                    resolve(base64Data);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(audioBlob);
                });

                const { text } = await blink.ai.transcribeAudio({
                  audio: base64,
                  language: 'en'
                });

                console.log('🗣️ Transcribed text:', text);

                if (text.trim() && text.trim().length > 2 && isInCall) {
                  // Create a user message directly and submit it
                  const userMessage: Message = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: text.trim(),
                    timestamp: new Date()
                  };

                  setMessages(prev => [...prev, userMessage]);
                  
                  // Process the message through Buck AI
                  await processVoiceMessage(text.trim());
                }
              } catch (error) {
                console.error('❌ Transcription error:', error);
              }
            }
          }
          audioChunksRef.current = [];
        };

        // Enhanced continuous recording system with longer chunks
        const startContinuousRecording = () => {
          if (!isInCall) return;
          
          console.log('🎤 Starting continuous recording for phone call');
          
          const recordChunk = () => {
            if (!isInCall || !mediaRecorderRef.current) return;
            
            // Only start recording if not already recording
            if (mediaRecorderRef.current.state === 'inactive') {
              audioChunksRef.current = [];
              mediaRecorderRef.current.start();
              console.log('🎤 Started recording chunk');
              
              // Stop recording after 5 seconds and process (longer chunks for better speech recognition)
              setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                  console.log('🎤 Stopping recording chunk');
                  mediaRecorderRef.current.stop();
                }
              }, 5000);
            }
          };
          
          // Start first chunk immediately
          recordChunk();
          
          // Set up interval to continuously record with longer intervals
          recordingIntervalRef.current = setInterval(() => {
            if (isInCall) {
              recordChunk();
            } else {
              if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
              }
            }
          }, 6000); // Start new chunk every 6 seconds (1 second gap between 5-second chunks)
        };

        // Start the enhanced continuous recording
        startContinuousRecording();
        
        // Speak the greeting
        try {
          setIsSpeaking(true);
          const greeting = "Hi there! I'm Buck AI, your personal Chief Financial Officer. I can now speak my responses out loud and listen to your voice. What would you like to discuss about your business finances today?";
          
          const { url } = await blink.ai.generateSpeech({
            text: greeting,
            voice: 'nova'
          });
          
          const audio = new Audio(url);
          audio.playbackRate = 1.3;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
        } catch (error) {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        }
        
      } catch (error) {
        console.error('Microphone permission error:', error);
        
        // Add permission denied message
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "❌ **Microphone permission denied.** I need microphone access to start a voice call with you. Please enable microphone permissions in your browser settings and try again. You can still chat with me via text! 😊",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Handle file upload for multi-modal input
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    
    try {
      const user = await blink.auth.me();
      const userId = user?.id || 'anonymous';

      // Determine file type
      let fileType: 'image' | 'document' | 'spreadsheet' = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.csv')) {
        fileType = 'spreadsheet';
      }

      // Add processing message
      const processingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🔄 **Processing your ${fileType}...** \n\nI'm analyzing "${file.name}" using my advanced multi-modal AI capabilities. This may take a moment.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Process the file using appropriate MCP
      let result: any;
      
      if (fileType === 'image' && (file.name.toLowerCase().includes('receipt') || file.name.toLowerCase().includes('invoice'))) {
        // Use Receipt OCR MCP for receipts and invoices
        const receiptData = await receiptOCRMCP.processReceiptImage(file);
        await receiptOCRMCP.createTransactionFromReceipt(receiptData, userId);
        result = {
          extractedData: {
            documentType: 'receipt',
            vendor: receiptData.vendor,
            totalAmount: `${receiptData.amount.toFixed(2)}`,
            date: receiptData.date,
            category: receiptData.category
          },
          analysisResult: {
            businessInsights: [
              `Automatically categorized as ${receiptData.category}`,
              `Transaction created with ${receiptData.confidence * 100}% confidence`,
              `Vendor: ${receiptData.vendor}`
            ],
            recommendations: [
              'Receipt processed and transaction created automatically',
              'Check the Transactions page to verify the entry',
              'Consider setting up automated receipt processing for your email'
            ]
          }
        };
      } else if (fileType === 'document' || fileType === 'spreadsheet') {
        // Use Document Processor MCP for documents and spreadsheets
        const documentData = await documentProcessorMCP.processDocument(file);
        await documentProcessorMCP.createAccountingEntries(documentData, userId);
        result = {
          extractedData: {
            documentType: documentData.type,
            filename: documentData.filename,
            confidence: `${(documentData.confidence * 100).toFixed(1)}%`
          },
          analysisResult: {
            businessInsights: documentData.insights,
            recommendations: [
              'Document processed with AI analysis',
              'Accounting entries created automatically',
              'Review the extracted data for accuracy'
            ]
          }
        };
      } else {
        // Fallback to existing custom training system
        result = await customTraining.processMultiModalInput(userId, file, fileType);
      }

      // Create response based on processing results
      let responseContent = `✅ **Successfully processed "${file.name}"!**\n\n`;
      
      if (result.extractedData) {
        responseContent += `**📊 Extracted Data:**\n`;
        if (result.extractedData.documentType) {
          responseContent += `• Document Type: ${result.extractedData.documentType}\n`;
        }
        if (result.extractedData.totalAmount) {
          responseContent += `• Total Amount: ${result.extractedData.totalAmount}\n`;
        }
        if (result.extractedData.vendor) {
          responseContent += `• Vendor: ${result.extractedData.vendor}\n`;
        }
        if (result.extractedData.date) {
          responseContent += `• Date: ${result.extractedData.date}\n`;
        }
      }

      if (result.analysisResult?.businessInsights) {
        responseContent += `\n**💡 Business Insights:**\n`;
        result.analysisResult.businessInsights.forEach((insight: string) => {
          responseContent += `• ${insight}\n`;
        });
      }

      if (result.analysisResult?.recommendations) {
        responseContent += `\n**🎯 Recommendations:**\n`;
        result.analysisResult.recommendations.forEach((rec: string) => {
          responseContent += `• ${rec}\n`;
        });
      }

      responseContent += `\n**What would you like me to help you with regarding this ${fileType}?**`;

      // Update the processing message with results
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { ...msg, content: responseContent }
          : msg
      ));

      // Add to context memory
      contextMemory.addMessage(userId, 'assistant', responseContent);

    } catch (error) {
      console.error('File processing error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { 
              ...msg, 
              content: `❌ **Sorry, I had trouble processing "${file.name}".** \n\nPlease try uploading the file again, or ask me for help with a different approach. I can handle images (receipts, invoices), documents (PDFs, Word), and spreadsheets (Excel, CSV).`
            }
          : msg
      ));
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const quickActions = [
    { icon: TrendingUp, label: "Revenue Analysis", prompt: "Show me my revenue analysis for this month" },
    { icon: Calculator, label: "Expense Summary", prompt: "What are my biggest expenses this quarter?" },
    { icon: FileText, label: "Invoice Status", prompt: "Show me my overdue invoices" },
    { icon: DollarSign, label: "Cash Flow", prompt: "How is my cash flow looking?" },
    { icon: BarChart3, label: "Crypto Prices", prompt: "Show me current cryptocurrency prices and market trends" },
    { icon: Image, label: "Process Receipt", prompt: "I want to upload a receipt for automatic processing and categorization" },
    { icon: Zap, label: "Market Intelligence", prompt: "Give me real-time market insights and competitor analysis for my industry" },
    { icon: Brain, label: "Compliance Check", prompt: "Check my business compliance status and upcoming tax deadlines" }
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to JSX
    return content
      .split('\n')
      .map((line, index) => {
        // Handle bold text
        const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Handle bullet points
        const bulletFormatted = boldFormatted.replace(/^• /, '• ');
        
        return (
          <div key={index} className={line.startsWith('• ') ? 'ml-2' : ''}>
            <span dangerouslySetInnerHTML={{ __html: bulletFormatted }} />
          </div>
        );
      });
  };

  // Global error boundary to prevent crashes
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      setHasError(true);
      setErrorMessage('Buck AI encountered an unexpected error. Please refresh the page.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setErrorMessage('Buck AI encountered a connection error. Please try again.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md p-6 text-center">
            <div className="mb-4">
              <Brain className="h-12 w-12 mx-auto text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Buck AI Needs a Moment</h3>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <Button 
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restart Buck AI
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600">
            <AvatarFallback className="text-white font-bold">
              <Brain className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Buck AI</h2>
            <p className="text-sm text-slate-500">Your AI Chief Financial Officer</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={isInCall ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
            <Sparkles className="h-3 w-3 mr-1" />
            {isInCall ? "On Call" : "Online"}
          </Badge>
          <Button
            variant={isInCall ? "default" : "outline"}
            size="sm"
            onClick={togglePhoneCall}
            className={isInCall 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            }
            title={isInCall ? "End call with Buck AI" : "Call Buck AI"}
          >
            {isInCall ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </Button>
          {isSpeaking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSpeech}
              className="text-blue-600 hover:text-blue-700"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action.prompt)}
              className="text-xs hover:bg-blue-50 hover:border-blue-200"
            >
              <action.icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className={`h-8 w-8 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-slate-400 to-slate-600' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                <AvatarFallback className="text-white text-sm">
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`max-w-[80%] p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className={`text-sm leading-relaxed ${
                  message.role === 'user' ? 'text-white' : 'text-slate-900'
                }`}>
                  {message.role === 'assistant' ? (
                    <div className="space-y-1">
                      {formatMessage(message.content)}
                      {message.isStreaming && (
                        <div className="flex items-center space-x-1 mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Buck AI about your business finances..."
              className="min-h-[44px] max-h-32 resize-none pr-20 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                title="Upload receipt, invoice, or document"
              >
                {isProcessingFile ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 text-slate-500" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                disabled={isInCall}
                title={isInCall ? "Voice input disabled during call" : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className={`h-4 w-4 ${isInCall ? 'text-slate-300' : 'text-slate-500'}`} />
                )}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {isListening && (
          <div className="flex items-center justify-center mt-2 text-sm text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            Recording... Speak now
          </div>
        )}
      </div>
    </div>
  );
}