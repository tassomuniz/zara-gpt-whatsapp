import { Injectable } from '@nestjs/common';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import axios from 'axios';
@Injectable()
export class OpenAiService {
  private configuration: Configuration;
  private openAI: OpenAIApi;

  constructor() {
    this.configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAI = new OpenAIApi(this.configuration);
  }

  async createChatCompletition(
    user: string,
    context: ChatCompletionRequestMessage[],
    content: string,
  ) {
    context.push({ role: 'user', content });
    try {
      const response = await this.openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        user,
        messages: context,
      });
      const GPTResponse = response.data.choices[0].message.content;
      console.log(GPTResponse);
      return GPTResponse;
    } catch (e) {
      console.log(e);
      if (e.response.status === 400 || e.response.status === 429) {
        return e.response.status;
      } else {
        return;
      }
    }
  }

  async createImage(prompt: string) {
    try {
      const response = await this.openAI.createImage({
        prompt,
        n: 1,
        size: '1024x1024',
      });
      const imgURL = response.data.data[0].url;
      return imgURL;
    } catch (e) {
      return e.response.status;
    }
  }

  async recognizeAudio(audioData: Buffer): Promise<{transcription: string, error: string}> {
    try {
      // Chamar a API Whisper    
      const audioBlob = new Blob([audioData]); // Converter o buffer para Blob
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
  
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        },
      );
      //  console.log('Resposta do Whisper:', response);
      if (response.data['error']) {
        return { transcription: '', error: response.data['error']};
      }
  
      // Obter a transcrição de áudio do modelo Whisper
      const transcript = response.data['text'];
      
      return { transcription: transcript, error: ''};
    } catch (error) {
      console.error(error);
      return { transcription: '', error: 'Erro ao processar o áudio.'};
    }
  }
}