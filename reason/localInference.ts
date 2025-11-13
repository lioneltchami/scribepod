import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration from environment
const WHISPER_SERVER_URL = process.env.WHISPER_SERVER_URL || 'http://localhost:5000';
const HTTP_TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || '30000'); // 30 seconds default

export interface Thots {
  intent: string;
  person_is: string;
  extra_state: string;
  thoughts: string;
  response: string;
}

// Custom error classes for better error handling
export class TranscriptionError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export class ThoughtGenerationError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ThoughtGenerationError';
  }
}

export const postAudioData = async (file: any): Promise<string> => {
  if (!file || !file.buffer) {
    throw new TranscriptionError('Invalid file: file or file.buffer is undefined');
  }

  const form = new FormData();
  form.append('audio_data', file.buffer, {
    filename: 'test.wav',
    contentType: 'audio/wav',
    knownLength: file.size
  });

  try {
    const response = await axios.post(`${WHISPER_SERVER_URL}/transcribe`, form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: HTTP_TIMEOUT_MS,
    });

    if (!response.data) {
      throw new TranscriptionError('Empty response from transcription server');
    }

    return response.data;
  } catch (e) {
    const error = e as AxiosError;

    // Log detailed error information
    console.error('[LocalInference] Transcription error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
    });

    // Throw descriptive error
    if (error.response) {
      // Server responded with error status
      throw new TranscriptionError(
        `Transcription server error (${error.response.status}): ${error.response.statusText}`,
        error
      );
    } else if (error.request) {
      // Request made but no response received
      throw new TranscriptionError(
        'No response from transcription server - server may be down or unreachable',
        error
      );
    } else {
      // Error setting up request
      throw new TranscriptionError(`Request setup error: ${error.message}`, error);
    }
  }
}


export const generateThoughts = async (conversation: string[]): Promise<Thots> => {
  if (!conversation || conversation.length === 0) {
    throw new ThoughtGenerationError('Invalid conversation: array is empty or undefined');
  }

  const with_person_prepended = conversation.map((sentence) => 'person: ' + sentence);

  try {
    const response = await axios.post(`${WHISPER_SERVER_URL}/generate_thots`, {
      conversation_speech: with_person_prepended
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: HTTP_TIMEOUT_MS,
    });

    if (!response.data) {
      throw new ThoughtGenerationError('Empty response from thought generation server');
    }

    // Validate response structure
    const requiredFields = ['intent', 'person_is', 'extra_state', 'thoughts', 'response'];
    const missingFields = requiredFields.filter(field => !(field in response.data));

    if (missingFields.length > 0) {
      throw new ThoughtGenerationError(
        `Invalid response structure - missing fields: ${missingFields.join(', ')}`
      );
    }

    return response.data;
  } catch (e) {
    // If already our custom error, rethrow it
    if (e instanceof ThoughtGenerationError) {
      throw e;
    }

    const error = e as AxiosError;

    // Log detailed error information
    console.error('[LocalInference] Thought generation error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
    });

    // Throw descriptive error
    if (error.response) {
      throw new ThoughtGenerationError(
        `Thought generation server error (${error.response.status}): ${error.response.statusText}`,
        error
      );
    } else if (error.request) {
      throw new ThoughtGenerationError(
        'No response from thought generation server - server may be down or unreachable',
        error
      );
    } else {
      throw new ThoughtGenerationError(`Request setup error: ${error.message}`, error);
    }
  }
}


