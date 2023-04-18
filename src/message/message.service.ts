import { Injectable } from '@nestjs/common';
import { CustomerService } from './customer/customer.service';
import { IncomingMessageDto } from './dto/incoming-message.dto.';
import { OpenAiService } from './open-ai/open-ai.service';
import { Client } from 'whatsapp-web.js';
import {
  getHelpMessage,
  getThankYouMessage,
  getDonationMessage,
  getClearChatSuccessMessage,
  getHelperSuporterMessage,
} from './helpers/chat-messages';
import { getServiceUnavailableError } from './helpers/error-messages';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class MessageService {
  client: Client;
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly customerService: CustomerService,
  ) {}

  async convertAudioToText(inputFile: string): Promise<string> {
    const outputFile = './temp/converted_audio.wav';
  
    console.log('Iniciando a conversão do áudio'); // Adicionando mensagem de depuração
    
    // Conversão do arquivo de áudio para o formato correto usando ffmpeg
    return new Promise(async (resolve, reject) => {
      ffmpeg(inputFile)
        .noVideo()
        .output(outputFile)
        .audioChannels(1)
        .audioFrequency(24000)
        .audioCodec('pcm_s16le')
        .format('wav')
        .on('end', async () => {
          try {
            console.log('Conversão do áudio concluída');
            // Carregar o arquivo de áudio convertido
            const audioData = fs.readFileSync(outputFile);
  
            // Enviar o arquivo de áudio para a API Whisper da OpenAI
            const response = await this.openAiService.recognizeAudio(audioData);
            console.log('Resposta do Whisper:', response);
  
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.transcription);
            }
          } catch (error) {
            console.log('Erro na conversão do áudio:', error);
            reject(error);
          }
        })
        .on('error', (err) => {
          console.log('Erro no FFmpeg:', err);
          console.error('Detalhes do erro:', err.message); // Adicionando mensagem de depuração do erro
          reject(err);
        })
        .run();
    });
  }
  

  async createMessage(incomingMessageDto: IncomingMessageDto) {
    const user = incomingMessageDto.from;
    const content = incomingMessageDto.body;
    const customer = await this.customerService.findCustomer(user);

    if (!customer) {
      const createdCustomer = await this.customerService.createCustomer({
        user,
      });
      if (createdCustomer) {
        await this.customerService.saveMessage({
          role: 'system',
          content: process.env.BOT_PERSONA,
          owner: {
            connect: {
              user,
            },
          },
        });
        await this.customerService.saveMessage({
          role: 'user',
          content,
          owner: {
            connect: {
              user,
            },
          },
        });
      }

      return getDonationMessage();
    }

    await this.customerService.saveMessage({
      role: 'user',
      content,
      owner: {
        connect: {
          user,
        },
      },
    });

    const context = await this.customerService.getMessagesContext(user);
    const response = await this.openAiService.createChatCompletition(
      user,
      context,
      content,
    );
    if (response === 400) {
      this.customerService.clearHistory(user);
      return getServiceUnavailableError();
    }
    if (!response || response === 429) {
      return getServiceUnavailableError;
    }

    await this.customerService.saveMessage({
      role: 'assistant',
      content: response,
      owner: {
        connect: {
          user: user,
        },
      },
    });
    return response;
  }

  async createImage(prompt: string) {
    const createdImage = await this.openAiService.createImage(
      prompt.substring(9),
    );
    return createdImage;
  }

  async helpMessage() {
    return getHelpMessage();
  }

  async clearMessageHistory(user: string) {
    await this.customerService.clearHistory(user);
    return getClearChatSuccessMessage();
  }

  async donationMessage() {
    return getThankYouMessage();
  }

  async HelperSuporterMessage() {
    return getHelperSuporterMessage();
  }
}
