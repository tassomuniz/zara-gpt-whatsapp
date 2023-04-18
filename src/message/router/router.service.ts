/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from '@nestjs/common';
import { MessageService } from '../message.service';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ReplyMessageDto } from '../dto/reply-message.dto';
import { getCannotGenerateImageError } from '../helpers/error-messages';
import fs from 'fs';
import path from 'path';
import { path as appRoot } from 'app-root-path';


@Injectable()
export class RouterService {
  client: Client;
  commands: Map<string, Function>;

  constructor(private readonly messageService: MessageService) {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'zara-bot' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
    });

    this.commands = new Map<string, Function>();
    this.commands.set('/imagine', this.handleImagineCommand.bind(this));
    this.commands.set('/clear', this.handleClearCommand.bind(this));
    this.commands.set('contribuir', this.handleDonateCommand.bind(this));
    this.commands.set('/doar', this.handleDonateCommand.bind(this));
    this.commands.set('/donate', this.handleDonateCommand.bind(this));
    this.commands.set('doar', this.handleDonateCommand.bind(this));
    this.commands.set('/help', this.handleHelpCommand.bind(this));
    this.commands.set('ajuda', this.handleHelpCommand.bind(this));
    this.commands.set('/suporte', this.handleSuporterHelperCommand.bind(this));
  }

  initialize(): void {
    this.client.on('qr', (qr) => {
      console.log('QR Generated');
      qrcode.toString(
        qr,
        { type: 'terminal', small: true },
        function (err, url) {
          if (err) throw err;
          console.log(url);
        },
      );
    });

    this.client.on('ready', () => {
      console.log('Server is running!');
    });

    this.client.on('message', async (msg) => {
      console.log('Mensagem recebida:', msg.type);
      if (msg.id.fromMe) {
        return;
      }
    
      const command = msg.body.toLowerCase().split(' ')[0];
      const to = msg.from;
      const isGroupMessage = msg.from.split('@')[1] === 'g.us';
    
      const handler = this.commands.get(command);
      if (handler) {
        return await handler(msg, to);
      }
    
      if (isGroupMessage && command !== 'zara') {
        return;
      }
      
      function saveMediaToFile(mediaData, fileName) {
        return new Promise<string>((resolve, reject) => {
          const tempAudioFile = `./temp/${msg.id.id}.opus`;
          const filePath = path.join(appRoot, tempAudioFile);

          
          
          console.log('Salvando o arquivo de áudio em:', filePath);
          fs.writeFile(filePath, mediaData, "base64", (err) => {
            console.log('Arquivo de áudio salvo com sucesso:', filePath);
            if (err) {
              console.error('Falha ao salvar o arquivo de áudio:', err);
              fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) {
                  console.error('O aplicativo não tem permissão para ler e gravar no diretório', filePath);
                } else {
                  console.log('Aplicativo com permissão para ler e gravar no diretório', filePath);
                }
              });
              reject(err);
            } else {
              console.log('Arquivo de áudio salvo com sucesso:', filePath);
              resolve(filePath);
            }
          });
        });
      }
      
          
      // Verifique se a mensagem é do tipo de áudio após as outras verificações.
      let messageContent;
      if (msg.type === 'ptt') {
        console.log('Mensagem de áudio recebida');
        
        try {
          const media = await msg.downloadMedia();
          //console.log('Mídia baixada com sucesso:', media);
          const uniqueFilename = new Date().toISOString() + '_' + Math.random().toString(36).substr(2, 9) + '.opus';
          const filePath = await saveMediaToFile(media.data, uniqueFilename);

          console.log('Arquivo de áudio salvo com sucesso:', filePath);
          
          console.log('Convertendo o áudio em texto...');
          messageContent = await this.messageService.convertAudioToText(filePath);
          console.log('Texto transcrito do áudio:', messageContent);
        } catch (error) {
          console.error('Falha ao salvar o arquivo de áudio:', error);
        }
      } else {
        console.log('Mensagem não é de áudio, processando o corpo da mensagem...');
        messageContent = msg.body;
        console.log('Conteúdo da mensagem:', messageContent);
      }



      const response = await this.messageService.createMessage({
        from: msg.from,
        body: messageContent,
      });
    
      try {
        if (response.length > 1400) {
          const chunks = response.match(/.{1,1400}/g);
          chunks.forEach(async (chunk: string) => {
            await this.reply({
              to,
              body: chunk,
            });
          });
        } else {
          await this.reply({
            to,
            body: response,
          });
        }
      } catch (e) {
        console.log(e);
      }
    });
    

    this.client.initialize();
  }

  async reply(replyMessageDto: ReplyMessageDto) {
    return await this.client.sendMessage(
      replyMessageDto.to,
      replyMessageDto.body,
    );
  }

  async replyImage(replyMessageDto: ReplyMessageDto) {
    const media = await MessageMedia.fromUrl(replyMessageDto.body);

    return await this.client.sendMessage(replyMessageDto.to, media);
  }

  async handleImagineCommand(msg, to) {
    const createdImage = await this.messageService.createImage(msg.body);
    if (createdImage === 400) {
      return await this.reply({
        to,
        body: getCannotGenerateImageError(),
      });
    }
    return await this.replyImage({
      to,
      body: createdImage,
    });
  }

  async handleClearCommand(msg, to) {
    return await this.reply({
      body: await this.messageService.clearMessageHistory(msg.from),
      to: msg.from,
    });
  }

  async handleDonateCommand(msg, to) {
    return await this.reply({
      to,
      body: await this.messageService.donationMessage(),
    });
  }

  async handleHelpCommand(msg, to) {
    return await this.reply({
      to,
      body: await this.messageService.helpMessage(),
    });
  }

  async handleSuporterHelperCommand(msg,to){
    return await this.reply({
      to,
      body: await this.messageService.HelperSuporterMessage(),
    });
  }

}


